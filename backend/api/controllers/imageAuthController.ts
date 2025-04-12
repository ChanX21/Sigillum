import { Request, Response } from 'express';
import fs from 'fs';
import { processImageForAuthentication } from '../utils/imageUtils';
import { uploadToIPFS, createAndUploadNFTMetadata } from '../services/ipfsService';
import { 
  mintNFT, 
  verifyImageComprehensive,
  Metadata,
} from '../services/blockchainService';
import AuthenticatedImage, { IAuthenticatedImage } from '../models/AuthenticatedImage';

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
      res.status(400).json({ message: 'No image file uploaded' });
      return;
    }

    // Process image for authentication
    const authenticationData = await processImageForAuthentication(req.file.buffer);
    
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
    
    const creatorAddress = req.params.address;
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
 * Verify an image using comprehensive Sui contract verification
 * @param req - Express request object
 * @param res - Express response object
 */
export const verifyImageWithContract = async (req: VerifyRequest, res: Response): Promise<void> => {
  try {
    const { sha256Hash, tokenId } = req.body;
    
    if (!tokenId && !sha256Hash) {
      res.status(400).json({ message: 'Token ID or image hash is required for verification' });
      return;
    }
    
    // Get image data either by tokenId or imageHash
    let authenticatedImage: IAuthenticatedImage | null = null;
    
    if (tokenId) {
      authenticatedImage = await AuthenticatedImage.findOne({
        'blockchain.tokenId': tokenId
      });
    } else if (sha256Hash) {
      authenticatedImage = await AuthenticatedImage.findOne({
        'authentication.sha256Hash': sha256Hash
      });
      
      if (!authenticatedImage || !authenticatedImage.blockchain.tokenId) {
        res.status(404).json({ message: 'No token ID found for this image hash' });
        return;
      }
    }
    
    if (!authenticatedImage) {
      res.status(404).json({ message: 'No authenticated image found' });
      return;
    }
    
    // Create metadata object for comprehensive verification
    const metadata: Metadata = {
      metadataCID: authenticatedImage.blockchain.metadataURI || '',
      image: authenticatedImage.original || '',
      sha256Hash: authenticatedImage.authentication.sha256Hash || '',
      pHash: authenticatedImage.authentication.pHash || '',
      dHash: authenticatedImage.authentication.pHash || '', // Using pHash as dHash if not available
      watermarkData: authenticatedImage.authentication.watermarkData || ''
    };
    
    // Perform comprehensive verification
    const verificationResult = await verifyImageComprehensive(
      authenticatedImage.blockchain.tokenId,
      metadata
    );
    
    // Update status to verified if verification was successful
    if (verificationResult.isAuthentic && authenticatedImage.status !== 'verified') {
      authenticatedImage.status = 'verified';
      authenticatedImage.updatedAt = new Date();
      await authenticatedImage.save();
    }
    
    // Construct creator object
    const creator = {
      id: typeof authenticatedImage.blockchain.creator === 'object' ? 
        authenticatedImage.blockchain.creator : 
        authenticatedImage.blockchain.creator,
      username: typeof authenticatedImage.blockchain.creator === 'object' ? 
        (authenticatedImage.blockchain.creator as any).username : 
        'Unknown'
    };
    
    res.status(200).json({
      message: verificationResult.isAuthentic 
        ? 'Image verification successful' 
        : 'Image verification failed',
      verification: {
        imageId: authenticatedImage._id,
        sha256Hash: authenticatedImage.authentication.sha256Hash,
        pHash: authenticatedImage.authentication.pHash,
        creator,
        authenticatedAt: authenticatedImage.authentication.authenticatedAt,
        blockchain: authenticatedImage.blockchain,
        verificationResult,
        originalIpfsUrl: `https://ipfs.io/ipfs/${authenticatedImage.original}`,
        watermarkedIpfsUrl: `https://ipfs.io/ipfs/${authenticatedImage.watermarked}`
      }
    });
  } catch (error) {
    console.error('Error performing comprehensive verification:', error);
    res.status(500).json({ 
      message: 'Failed to verify image with comprehensive verification',
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

