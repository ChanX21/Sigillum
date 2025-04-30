import { Request, Response, NextFunction } from 'express';
import { processImageForAuthentication } from '../utils/imageUtils.js';
import { uploadToIPFS, createAndUploadNFTMetadata, uploadVectorToIPFS } from '../services/ipfsService.js';
import {
  mintNFT,
  createSoftListing,
} from '../services/blockchainService.js';
import { AuthenticatedImage, Verification } from '../models/AuthenticatedImage.js';
import axios from 'axios';
import qdrantClient from '../clients/qdrant.js';
import { v4 } from 'uuid';
import { Nonce, Session, User } from '../models/User.js';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import jwt from 'jsonwebtoken';

// Custom interface for request with file
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'sigillum-secret-key';
// JWT expiration time (1 day)
const JWT_EXPIRATION = '1d';

/**
 * Get a nonce for a user
 * @param req - Express request object
 * @param res - Express response object
 */

export const getNonce = async (req: Request, res: Response): Promise<void> => {
  const { address } = req.params;
  const nonce = v4();
  await Nonce.deleteMany({ user: address });
  const newNonce = new Nonce({
    nonce: nonce,
    user: address
  });
  await newNonce.save();
  res.status(200).json({ nonce: nonce });
};

/**
 * Create a session for a user
 * @param req - Express request object
 * @param res - Express response object
 */

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { signature, message, address } = req.body;

    if (!signature || !message) {
      res.status(400).json({ 
        message: 'Signature and message are required for authentication',
        hint: 'Send these in the request body'
      });
      return;
    }

    // Parse message to extract the nonce
    let nonce;
    try {
      // Assuming message format is "Sign this message to authenticate: NONCE"
      nonce = message.split(': ')[1];
    } catch (error) {
      res.status(400).json({
        message: 'Invalid message format',
        hint: 'Message should be in format: "Sign this message to authenticate: NONCE"'
      });
      return;
    }

    // Verify the nonce exists in the database
    const nonceRecord = await Nonce.findOne({ nonce, user: address })
    if (!nonceRecord) {
      res.status(400).json({
        message: 'Invalid or expired nonce',
        hint: 'Request a new nonce and try again'
      });
      return;
    }
    const messageBytes = new TextEncoder().encode(message);
    // Verify the signature
    const publicKey = await verifyPersonalMessageSignature(messageBytes, signature);
    if (!publicKey.verifyAddress(address)) {
      res.status(400).json({ 
        message: 'Signature verification failed',
        hint: 'Please check your signature and message'
      });
      return;
    }

    // Delete the used nonce
    await Nonce.deleteOne({ _id: nonceRecord._id });
    let user = await User.findOne({ walletAddress: address });
    if (!user) {
      user = new User({ walletAddress: address });
      await user.save();
    }
    const sessionId = v4();

    // Create a JWT token
    const token = jwt.sign(
      { sessionId: sessionId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Create a new session in the database
    const session = new Session({
      sessionId: sessionId,
      user: user._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    });
    await session.save();

    res.status(200).cookie("token",token,{
      httpOnly: true,
      secure: true,
      path:'/',
      sameSite:'none',
      maxAge: 3600000,}).json({ message: 'Authentication successful' });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Failed to create session' });
  }
};

/**
 * Update user profile
 * @param req - Express request object
 * @param res - Express response object
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name });
    if (!user) {
      res.status(400).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

/**
 * Get user profile
 * @param req - Express request object
 * @param res - Express response object
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(400).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

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
    const { walletAddress } = req.user;
  

    // Process image for authentication
    const authenticationData = await processImageForAuthentication(req.file.buffer, {
      creatorId: walletAddress
    });

    // find similar images in qdrant
    const similarImages = await qdrantClient.query("images", {
      query: authenticationData.vector,
      params: {
        hnsw_ef: 128,
        exact: false,
      },
      limit: 5,
    });
    if(similarImages.points.filter((image: any) => image.score > 0.85).length > 0) {
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
      watermarkData: authenticationData.watermarkData
    };
    const metadataIpfsCid = await createAndUploadNFTMetadata(metadata, originalIpfsCid);

    // Create new authenticated image record
    const vectorId = v4();
    const newAuthenticatedImage = new AuthenticatedImage({
      original: originalIpfsCid,
      watermarked: watermarkedIpfsCid,
      metadataCID: metadataIpfsCid,
      user: req.user._id,
      vector: {
        id: vectorId,
        },
      status: 'uploaded'
    });
    const savedImage = await newAuthenticatedImage.save();
    await qdrantClient.upsert('images', {
      wait: true,
      points: [{
        id: vectorId,
        vector: authenticationData.vector,
        payload: {
          original: originalIpfsCid,
          watermarked: watermarkedIpfsCid,
        }
      }]
      });
    await axios.post(`${process.env.BASE_URL}/blockchain`, {
      action: 'mint',
      id: savedImage.id
    },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BE_KEY}`
        }
      });

    res.status(201).json({
      message: 'Image authenticated successfully',
      image: {
        id: newAuthenticatedImage._id,
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
      const authenticatedImage = await AuthenticatedImage.findById(id).populate('user');
      if (!authenticatedImage || (authenticatedImage.status !== 'uploaded' && authenticatedImage.status !== 'error')) {
        res.status(400).json({ message: 'Image not uploaded' });
        return;
      }
      res.status(200).json({ message: 'Image will be minted' });
      // Use type assertion to bypass type checking for Qdrant client
      const vectorResponse = await qdrantClient.retrieve("images", {
        ids: [authenticatedImage.vector.id],
        with_vector: true
      });
      if(!vectorResponse[0].vector) {  
        res.status(400).json({ message: 'Image not found' });
        return;
      }
      
      // Handle different possible vector formats and convert to flat array
      let vectorData: number[] = [];
      const vector = vectorResponse[0].vector;
      
      if (Array.isArray(vector)) {
        // If it's a flat array, use it directly
        if (typeof vector[0] === 'number') {
          vectorData = vector as number[];
        } 
        // If it's an array of arrays, flatten it
        else if (Array.isArray(vector[0])) {
          vectorData = (vector as number[][]).flat();
        }
      }
      
      const vectorBlob = new Blob([new Float32Array(vectorData)], {type: 'application/octet-stream'});
      const result = await mintNFT(authenticatedImage.user.walletAddress, authenticatedImage.original, vectorBlob, authenticatedImage.watermarked, authenticatedImage.metadataCID);
      await AuthenticatedImage.findByIdAndUpdate(
        authenticatedImage._id,
        { status: 'minted', blockchain: { ...authenticatedImage.blockchain, transactionHash: result.transactionHash, tokenId: result.tokenId, blobId: result.blobId } }
      );
      await axios.post(`${process.env.BASE_URL}/blockchain`, {
        action: 'soft-list',
        id: authenticatedImage.id
      },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.BE_KEY}`
          }
        });
    }
    else if (action === 'soft-list') {
      const authenticatedImage = await AuthenticatedImage.findById(id).populate('user');
      if (!authenticatedImage || (authenticatedImage.status !== 'minted' && authenticatedImage.status !== 'error')) {
        res.status(400).json({ message: 'Image not minted' });
        return;
      }
      res.status(200).json({ message: 'Image will be soft listed' });
      const listingId = await createSoftListing(authenticatedImage.blockchain.tokenId, {
        owner: authenticatedImage.user.walletAddress,
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
    const authenticationData = await processImageForAuthentication(req.file.buffer);

    // find similar images in qdrant
    const similarImages = await qdrantClient.query("images", {
      query: authenticationData.vector,
      params: {
        hnsw_ef: 128,
        exact: false,
      },
      limit: 5,
    });
    const filteredSimilarImages = similarImages.points.filter((image: any) => image.score > 0.85);
    if(filteredSimilarImages.length === 0) {
      res.status(400).json({ message: 'No similar images found' });
      return;
    }
    const verifications: any[] = [];
    for(let i = 0; i < filteredSimilarImages.length; i++) {
      let authenticatedImage = await AuthenticatedImage.findOne({"vector.id": filteredSimilarImages[i].id}).populate('verifications').lean();
      if(authenticatedImage) {
        // Create a new verification record
        const verification = new Verification({
          imageId: authenticatedImage._id,
          score: filteredSimilarImages[i].score,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        const savedVerification = await verification.save();
        
        // Add the verification ID to the image's verifications array
        await AuthenticatedImage.findByIdAndUpdate(
          authenticatedImage._id,
          { $addToSet: { verifications: savedVerification._id } }
        );
        verifications.push(authenticatedImage);
        verifications[i].score = filteredSimilarImages[i].score;
      }
    }
        res.status(200).json({
          message: 'Image verification successful',
        verifications: verifications
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
 * Status update
 * @param req - Express request with image ID
 * @param res - Express response object
 */
export const statusUpdate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authenticatedImage = await AuthenticatedImage.findById(id, { status: "soft-listed" });
  if (!authenticatedImage) {
    res.status(400).json({ message: 'Image not found' });
    return;
  }
  await AuthenticatedImage.findByIdAndUpdate(id, { status: "listed" });
  res.status(200).json({ message: 'Image status updated' });
};

/**
 * Get all authenticated images
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAllImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedImages = await AuthenticatedImage.find({ status: { $in: ['soft-listed', 'listed'] } })
      .populate({
        path: 'verifications',
        model: 'Verification'
      })
      .populate({
        path: 'user',
        model: 'User'
      });
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
    const authenticatedImage = await AuthenticatedImage.findOne({ _id: imageId, status: { $in: ['soft-listed', 'listed'] } })
      .populate({
        path: 'verifications',
        model: 'Verification'
      })
      .populate({
        path: 'user',
        model: 'User'
      });
    res.status(200).json(authenticatedImage);
  } catch (error) {
    console.error('Error fetching image by ID:', error);
    res.status(500).json({ message: 'Failed to fetch image by ID' });
  }
};

