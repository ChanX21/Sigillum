import { Request, Response } from 'express';
import { generateSHA256, processImageForAuthentication } from '../utils/imageUtils';
import { uploadToIPFS, createAndUploadNFTMetadata } from '../services/ipfsService';
import { 
  mintNFT,
  verifyImageByHash,
  Metadata,
} from '../services/blockchainService';
import { AuthenticatedImage } from '../models/AuthenticatedImage';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';

// Custom interface for request with file
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * Authenticate an image and prepare it for NFT minting
 * @param req - Express request object
 * @param res - Express response object
 */
export const authenticateImage = async (req: FileRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ 
        message: 'No image file uploaded',
        hint: 'Make sure you are sending a multipart/form-data request with an image field'
      });
      return;
    }

    // Get signature data from form fields
    const { signature, message } = req.body;
    const creatorAddress = req.params.address;
    
    if (!signature || !message) {
      res.status(400).json({ 
        message: 'Signature and message are required for authentication',
        hint: 'Send these as form fields in the same multipart/form-data request as the image'
      });
      return;
    }

    // Verify the signature
    const publicKey = await verifyPersonalMessageSignature(message, signature);
    if (!publicKey.verifyAddress(creatorAddress)) {
      res.status(400).json({ 
        message: 'Signature verification failed',
        hint: 'Please check your signature and message'
      });
      return;
    }

    // Process image for authentication
    const authenticationData = await processImageForAuthentication(req.file.buffer, {
      creatorId: creatorAddress
    });
    
    const existingImage = await AuthenticatedImage.findOne({
      $or: [
        { 'authentication.sha256Hash': authenticationData.sha256Hash },
        { 'authentication.pHash': authenticationData.pHash },
      ]
    });
    if (existingImage) {
      res.status(400).json({ message: 'Image already authenticated' });
      return;
    }
    
    // Upload original image to IPFS
    const originalIpfsCid = await uploadToIPFS(req.file.buffer);
    
    // Upload watermarked image to IPFS
    const watermarkedIpfsCid = await uploadToIPFS(authenticationData.watermarkedBuffer);
    
    let metadata: Metadata = {
      metadataCID: '', // Will be set after IPFS upload
      image: `https://${process.env.PINATA_GATEWAY}/ipfs/${originalIpfsCid}`,
      sha256Hash: authenticationData.sha256Hash,
      pHash: authenticationData.pHash,
      dHash: authenticationData.pHash,
      watermarkData: authenticationData.watermarkData
    };
    const metadataIpfsCid = await createAndUploadNFTMetadata(metadata, originalIpfsCid);
    metadata.metadataCID = metadataIpfsCid;
    const result = await mintNFT(creatorAddress, metadata);
    
    // Create new authenticated image record
    const newAuthenticatedImage = new AuthenticatedImage({
      original: originalIpfsCid,
      watermarked: watermarkedIpfsCid,
      authentication: {
        sha256Hash: authenticationData.sha256Hash,
        pHash: authenticationData.pHash,
        watermarkData: authenticationData.watermarkData,
        timestamp: authenticationData.createdAt,
        authenticatedAt: new Date(authenticationData.authenticatedAt)
      },
      blockchain: {
        transactionHash: result.transactionHash,
        tokenId: result.tokenId,
        creator: creatorAddress,
        metadataURI: `https://${process.env.PINATA_GATEWAY}/ipfs/${metadataIpfsCid}`
      },
      status: 'minted'
    });
    
    await newAuthenticatedImage.save();
    
    res.status(201).json({
      message: 'Image authenticated successfully',
      image: {
        id: newAuthenticatedImage._id,
        sha256Hash: authenticationData.sha256Hash,
        pHash: authenticationData.pHash,
        originalIpfsCid,
        watermarkedIpfsCid,
        status: 'minted'
      }
    });
  } catch (error) {
    console.error('Error authenticating image:', error);
    res.status(500).json({ message: 'Failed to authenticate image' });
  }
};

interface VerifyRequest extends Request {
  body: {
    sha256Hash?: string;
    tokenId?: string;
  }
} 

/**
 * Verify an image directly by its hash against the blockchain
 * @param req - Express request with image hash
 * @param res - Express response object
 */
export const verify = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file uploaded' });
      return;
    }
    const imageHash = generateSHA256(req.file.buffer);
    const authenticationData = await AuthenticatedImage.findOne({
      'authentication.sha256Hash': imageHash
    });
    
    if (!authenticationData) {
      res.status(400).json({ message: 'Image not authenticated' });
      return;
    }
    
    // Get pHash from database
    const pHash = authenticationData.authentication.pHash || '';
    
    // Verify using tokenId, hash and pHash
    const verificationResult = await verifyImageByHash(
      authenticationData.blockchain.tokenId, 
      imageHash,
      pHash
    );
    
    // Find image record in our database (if it exists)
    const authenticatedImage = await AuthenticatedImage.findOne({
      'authentication.sha256Hash': imageHash
    });
    
    // Prepare response data
    const isAuthentic = verificationResult.isAuthentic;
    
    let databaseRecord = null;
    if (authenticatedImage) {
      // Construct creator object
      const creator = {
        id: typeof authenticatedImage.blockchain.creator === 'object' ? 
          authenticatedImage.blockchain.creator : 
          authenticatedImage.blockchain.creator,
        username: typeof authenticatedImage.blockchain.creator === 'object' ? 
          (authenticatedImage.blockchain.creator as any).username : 
          'Unknown'
      };
      
      databaseRecord = {
        imageId: authenticatedImage._id,
        sha256Hash: authenticatedImage.authentication.sha256Hash,
        pHash: authenticatedImage.authentication.pHash,
        creator,
        authenticatedAt: authenticatedImage.authentication.authenticatedAt,
        blockchain: authenticatedImage.blockchain,
        originalIpfsUrl: `https://${process.env.PINATA_GATEWAY}/ipfs/${authenticatedImage.original}`,
        watermarkedIpfsUrl: `https://${process.env.PINATA_GATEWAY}/ipfs/${authenticatedImage.watermarked}`
      };
      
      // Update status to verified if verification was successful
      if (isAuthentic && authenticatedImage.status !== 'verified') {
        authenticatedImage.status = 'verified';
        authenticatedImage.updatedAt = new Date();
        await authenticatedImage.save();
      }
    }
    
    // Status code - 200 if we found matches or have a DB record, 404 if nothing found
    const statusCode = isAuthentic || databaseRecord ? 200 : 404;
    
    res.status(statusCode).json({
      message: isAuthentic 
        ? 'Image verification successful' 
        : 'No matching NFTs found on blockchain for this hash',
      verified: isAuthentic,
      databaseRecord,
      verificationResult
    });
  } catch (error) {
    console.error('Error verifying image by hash:', error);
    res.status(500).json({ 
      message: 'Failed to verify image by hash',
      error: (error as Error).message 
    });
  }
};

/**
 * Get all authenticated images
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAllImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedImages = await AuthenticatedImage.find({});
    res.status(200).json(authenticatedImages);
  } catch (error) {
    console.error('Error fetching all images:', error);
    res.status(500).json({ message: 'Failed to fetch all images' });
  }
};
