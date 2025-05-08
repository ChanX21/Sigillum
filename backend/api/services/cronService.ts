import cron from 'node-cron';
import { AuthenticatedImage } from '../models/AuthenticatedImage.js';
import { updateBlob } from './blockchainService.js';
import qdrantClient from '../clients/qdrant.js';


/**
 * Initialize cron jobs
 */
export const initCronJobs = () => {
  // Schedule blob ID update job to run every 5 minutes
  cron.schedule('*/1 * * * *', async () => {
    try {
      console.log('[CRON] Starting blob ID update job...');
      
      // Find all authenticated images that:
      // 1. Have been minted (have a tokenId)
      // 2. Have a vector ID
      // 3. Don't have a blobId or have an empty blobId
      const images = await AuthenticatedImage.find({
        'blockchain.tokenId': { $exists: true, $ne: '' },
        'vector.id': { $exists: true, $ne: '' },
        $or: [
          { 'vector.blobId': { $exists: false } },
          { 'vector.blobId': '' }
        ]
      }).limit(10); // Process in batches to avoid overloading

      console.log(`[CRON] Found ${images.length} images that need blob ID updates`);

      if (images.length === 0) {
        console.log('[CRON] No images need updating. Job completed.');
        return;
      }

      // Process each image
      for (const image of images) {
        try {
          // Get the vector data from the vector.id field
          const vectorId = image.vector.id;
          let vector: number[] | null = null;
          
          // First try to get the vector from Qdrant
          const vectorResponse = await qdrantClient.retrieve('images', {
            ids: [vectorId],
            with_vector: true
          })
          vector = vectorResponse[0].vector as number[];
          
          // Update the blob ID
          console.log(`[CRON] Updating blob ID for image ${image._id} with token ID ${image.blockchain.tokenId}`);
          const blobId = await updateBlob(image.blockchain.tokenId, vector);
          if (blobId === null) {
            console.error(`[CRON] Failed to update blob ID for image ${image._id}`);
            continue;
          }
          // Update the image record in the database
          await AuthenticatedImage.findByIdAndUpdate(
            image._id,
            { 'vector.blobId': blobId }
          );
          
          console.log(`[CRON] Successfully updated blob ID for image ${image._id}: ${blobId}`);
        } catch (error) {
          console.error(`[CRON] Error updating blob ID for image ${image._id}:`, error);
          // Continue with the next image even if this one fails
        }
      }
      
      console.log('[CRON] Blob ID update job completed.');
    } catch (error) {
      console.error('[CRON] Error in blob ID update job:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
}; 