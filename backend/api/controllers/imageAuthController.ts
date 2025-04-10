import { Request, Response } from 'express';
import fs from 'fs';
import { processImageForAuthentication } from '../utils/imageUtils';
import { uploadToIPFS, createAndUploadNFTMetadata } from '../services/ipfsService';
import { mintNFT, verifyImage as verifyBlockchainImage, Metadata } from '../services/blockchainService';
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
    imageHash?: string;
    tokenId?: string;
  }
}

/**
 * Verify an image against blockchain records
 * @param req - Express request object
 * @param res - Express response object
 */
export const verifyImage = async (req: VerifyRequest, res: Response): Promise<void> => {
  try {
    const { imageHash, tokenId } = req.body;
    
    if (!imageHash && !tokenId) {
      res.status(400).json({ 
        message: 'Either image hash or token ID is required for verification' 
      });
      return;
    }
    
    let authenticatedImage: IAuthenticatedImage | null = null;
    
    if (imageHash) {
      // Find by hash
      authenticatedImage = await AuthenticatedImage.findOne({
        'authentication.sha256Hash': imageHash
      });
    } else if (tokenId) {
      // Find by token ID
      authenticatedImage = await AuthenticatedImage.findOne({
        'blockchain.tokenId': tokenId
      });
    }
    
    if (!authenticatedImage) {
      res.status(404).json({ message: 'No authenticated image found' });
      return;
    }
    
    // For token ID verification, also verify on the blockchain
    let blockchainVerified = false;
    if (tokenId) {
      blockchainVerified = await verifyBlockchainImage(
        tokenId, 
        authenticatedImage.authentication.sha256Hash
      );
    }
    
    // Update status to verified if not already
    if (authenticatedImage.status !== 'verified') {
      authenticatedImage.status = 'verified';
      authenticatedImage.updatedAt = new Date();
      await authenticatedImage.save();
    }
    
    // Construct creator object safely
    const creator = {
      id: typeof authenticatedImage.blockchain.creator === 'object' ? 
        authenticatedImage.blockchain.creator : 
        authenticatedImage.blockchain.creator,
      username: typeof authenticatedImage.blockchain.creator === 'object' ? 
        (authenticatedImage.blockchain.creator as any).username : 
        'Unknown'
    };
    
    res.status(200).json({
      message: 'Image verification successful',
      verification: {
        imageId: authenticatedImage._id,
        sha256Hash: authenticatedImage.authentication.sha256Hash,
        pHash: authenticatedImage.authentication.pHash,
        creator,
        authenticatedAt: authenticatedImage.authentication.authenticatedAt,
        blockchain: authenticatedImage.blockchain,
        blockchainVerified,
        originalIpfsUrl: `https://ipfs.io/ipfs/${authenticatedImage.original}`,
        watermarkedIpfsUrl: `https://ipfs.io/ipfs/${authenticatedImage.watermarked}`
      }
    });
  } catch (error) {
    console.error('Error verifying image:', error);
    res.status(500).json({ message: 'Failed to verify image' });
  }
};

/**
 * Get all authenticated images for a creator
 * @param req - Express request object
 * @param res - Express response object
 */
export const getCreatorImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const creatorId = req.params.creatorId;
    
    const authenticatedImages = await AuthenticatedImage.find({
      'blockchain.creator': creatorId
    }).sort({ createdAt: -1 });
    
    res.status(200).json(authenticatedImages);
  } catch (error) {
    console.error('Error fetching creator images:', error);
    res.status(500).json({ message: 'Failed to fetch creator images' });
  }
}; 