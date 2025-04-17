import { Request, Response } from 'express';
import { generateSHA256, processImageForAuthentication } from '../utils/imageUtils';
import { uploadToIPFS, createAndUploadNFTMetadata } from '../services/ipfsService';
import { 
  mintNFT,
  verifyImageByHash,
  createSoftListing,
} from '../services/blockchainService';
import { AuthenticatedImage } from '../models/AuthenticatedImage';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import axios from 'axios';

// Custom interface for request with file
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * Authenticate an image and prepare it for NFT minting
 * @param req - Express request object
 * @param res - Express response object
 */
export const uploadImage = async (req: FileRequest, res: Response): Promise<void> => {
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
    
   /* if (!signature || !message) {
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
    }*/

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
    
    let metadata = {
      metadataCID: '', // Will be set after IPFS upload
      image: originalIpfsCid,
      sha256Hash: authenticationData.sha256Hash,
      pHash: authenticationData.pHash,
      dHash: authenticationData.pHash,
      watermarkData: authenticationData.watermarkData
    };
    const metadataIpfsCid = await createAndUploadNFTMetadata(metadata, originalIpfsCid);
    
    // Create new authenticated image record
    const newAuthenticatedImage = new AuthenticatedImage({
      original: originalIpfsCid,
      watermarked: watermarkedIpfsCid,
      metadataCID: metadataIpfsCid,
      authentication: {
        sha256Hash: authenticationData.sha256Hash,
        pHash: authenticationData.pHash,
      },
      blockchain: {
        creator: creatorAddress,
      },
      status: 'uploaded'
    });
    const savedImage = await newAuthenticatedImage.save();
    await axios.post(`${process.env.BASE_URL}/blockchain`, {
      action: 'mint',
      id: savedImage.id
    },
  {headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.BE_KEY}`
  }});
    
    res.status(201).json({
      message: 'Image authenticated successfully',
      image: {
        id: newAuthenticatedImage._id,
        sha256Hash: authenticationData.sha256Hash,
        pHash: authenticationData.pHash,
        originalIpfsCid,
        watermarkedIpfsCid,
        status: 'uploaded'
      }
    });
  } catch (error) {
    console.error('Error authenticating image:', error);
    res.status(500).json({ message: 'Failed to authenticate image' });
  }
};
/** 
 * Mint or soft list an image
 * @param req - Express request with image hash
 * @param res - Express response object
 */
export const blockchain = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if(!authHeader || authHeader.split(' ')[1] !== process.env.BE_KEY) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { action, id } = req.body;
    if (action === 'mint') {
      const authenticatedImage = await AuthenticatedImage.findById(id);
    if (!authenticatedImage || authenticatedImage.status !== 'uploaded') {
      res.status(400).json({ message: 'Image not uploaded' });
      return;
    }
    res.status(200).json({ message: 'Image will be minted' });
    const result = await mintNFT(authenticatedImage.blockchain.creator, authenticatedImage.original, authenticatedImage.authentication.sha256Hash, authenticatedImage.authentication.pHash, authenticatedImage.authentication.pHash, authenticatedImage.watermarked, authenticatedImage.metadataCID);
    await AuthenticatedImage.findByIdAndUpdate(
      authenticatedImage._id,
      { status: 'minted', blockchain: { ...authenticatedImage.blockchain, transactionHash: result.transactionHash, tokenId: result.tokenId } }
    );
    await axios.post(`${process.env.BASE_URL}/blockchain`, {
      action: 'soft-list',
      id: authenticatedImage.id
    },
  {headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.BE_KEY}`
  }});
  }
    else if (action === 'soft-list') {
      const authenticatedImage = await AuthenticatedImage.findById(id);
      if (!authenticatedImage || authenticatedImage.status !== 'minted') {
        res.status(400).json({ message: 'Image not minted' });
        return;
      }
      res.status(200).json({ message: 'Image will be soft listed' });
      const listingId = await createSoftListing(authenticatedImage.blockchain.tokenId, {
        minBid: 100,
        endTime: Date.now() + (60 * 60 * 24 * 2),
        description: 'Soft listing',
        metadataCID: authenticatedImage.metadataCID
      });
      await AuthenticatedImage.findByIdAndUpdate(
        authenticatedImage._id,
        { status: 'soft-listed', blockchain: { ...authenticatedImage.blockchain, listingId: listingId } }
      );
    }
  } catch (error) {
    console.error('Error minting or soft listing image:', error);
    await AuthenticatedImage.findByIdAndUpdate(
      req.body.id,
      { status: 'error' }
    );
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
    
    // Prepare response data
    const isAuthentic = verificationResult.isAuthentic;
    
      // Update status to verified if verification was successful
      if (isAuthentic && authenticationData.status !== 'verified') {
        authenticationData.status = 'verified';
        authenticationData.updatedAt = new Date();
        await authenticationData.save();
      }
    
    if (isAuthentic) {
      res.status(200).json({
        message: 'Image verification successful',
        verificationResult,
        databaseRecord: authenticationData
      });
    }
    else {
      res.status(404).json({ message: 'Image not authenticated' });
    }
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
    const authenticatedImages = await AuthenticatedImage.find({status: 'soft-listed'});
    res.status(200).json(authenticatedImages);
  } catch (error) {
    console.error('Error fetching all images:', error);
    res.status(500).json({ message: 'Failed to fetch all images' });
  }
};

/**
 * Get an authenticated image by ID
 * @param req - Express request with image ID
 * @param res - Express response object
 */
export const getImageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const imageId = req.params.id;
    const authenticatedImage = await AuthenticatedImage.findById(imageId);
    res.status(200).json(authenticatedImage);
  } catch (error) {
    console.error('Error fetching image by ID:', error);
    res.status(500).json({ message: 'Failed to fetch image by ID' });
  }
};

