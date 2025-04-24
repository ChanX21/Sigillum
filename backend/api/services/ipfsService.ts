import { pinata } from '../clients/pinata.js';


/**
 * Upload a file to IPFS
 * @param {Buffer} fileBuffer - Buffer of the file
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 */
export const uploadToIPFS = async (fileBuffer: Buffer) => {
  try {

    const blob = new Blob([fileBuffer]);
    const file = new File([blob], "image.png", { type: "image/png"})
    const upload = await pinata.upload.public.file(file);    
    return upload.cid; // Returns the CID
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

/**
 * Upload JSON metadata to IPFS
 * @param {Object} metadata - Metadata object
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 */
export const uploadMetadataToIPFS = async (metadata: any) => {
  try {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const blob = new Blob([metadataBuffer]);
    const file = new File([blob], "metadata.json", { type: "application/json"})
    
    const upload = await pinata.upload.public.file(file);
    
    return upload.cid; // Returns the CID
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
};

/**
 * Create and upload NFT metadata
 * @param {Object} imageData - Image authentication data
 * @param {string} imageCID - IPFS CID of the original image
 * @returns {Promise<string>} - IPFS CID of the metadata
 */
export const createAndUploadNFTMetadata = async (imageData: any, imageCID: string) => {
  try {
    const metadata = {
      name: `PicSecure Authenticated Image`,
      description: `Authenticated image with blockchain verification`,
      image: `https://${process.env.PINATA_GATEWAY}/ipfs/${imageCID}`,
      attributes: [
        {
          trait_type: 'SHA256 Hash',
          value: imageData.sha256Hash
        },
        {
          trait_type: 'Perceptual Hash',
          value: imageData.pHash
        },
        {
          trait_type: 'Creator ID',
          value: imageData.creatorId
        },
        {
          trait_type: 'Created At',
          value: imageData.timestamp
        },
        {
          trait_type: 'Authenticated At',
          value: imageData.authenticatedAt
        }
      ],
      authentication: {
        sha256Hash: imageData.sha256Hash,
        pHash: imageData.pHash,
        watermarkData: imageData.watermarkData,
        timestamp: imageData.timestamp,
        authenticatedAt: imageData.authenticatedAt
      }
    };
    
    return await uploadMetadataToIPFS(metadata);
  } catch (error) {
    console.error('Error creating and uploading NFT metadata:', error);
    throw error;
  }
};


/**
 * Upload a vector to IPFS
 * @param {number[]} vector - Vector to upload
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 */
export const uploadVectorToIPFS = async (vector: number[]) => {
  try {
    const vectorBuffer = Buffer.from(JSON.stringify(vector));
    const blob = new Blob([vectorBuffer]);
    const file = new File([blob], "vector.json", { type: "application/json"})
    
    const upload = await pinata.upload.public.file(file);
    return upload.cid; // Returns the CID
  } catch (error) {
    console.error('Error uploading vector to IPFS:', error);
    throw error;
  }
}