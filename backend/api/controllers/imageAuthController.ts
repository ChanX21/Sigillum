import { Request, Response } from 'express';
import { processImageForAuthentication } from '../utils/imageUtils.js';
import { uploadToIPFS, createAndUploadNFTMetadata } from '../services/ipfsService.js';
import {
  mintNFT,
  createSoftListing,
  addBlob
} from '../services/blockchainService.js';
import { AuthenticatedImage, Verification } from '../models/AuthenticatedImage.js';
import qdrantClient from '../clients/qdrant.js';
import { v4 } from 'uuid';
import { Nonce, Session, User, WebSocketSession } from '../models/User.js';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import jwt from 'jsonwebtoken';
import { notifyImageUploaded, notifyNFTMinted, notifySoftListed, notifyBlobUploaded, notifyFailed } from '../services/websocketService.js';

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

    // extract the nonce from the message
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
 * Clear session
 * @param req - Express request object
 * @param res - Express response object
 */
export const clearSession = async (req: Request, res: Response): Promise<void> => {
  try {
    await Session.deleteMany({ user: req.user._id });
    res.status(200).clearCookie('token').json({ message: 'Session cleared' });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ message: 'Failed to clear session' });
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
    res.status(200).json(req.user);
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
    const data = JSON.parse(req.body.metadata);
    if(!data.name || !data.description) {
      res.status(400).json({ message: 'Name and description are required' });
      return;
    }

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
    const sessionId = v4();
    // Create a new web socket session
    const webSocketSession = new WebSocketSession({
      sessionId
    });
    await webSocketSession.save();
    res.status(200).json({ sessionId: jwt.sign({ sessionId: sessionId }, JWT_SECRET, { expiresIn: JWT_EXPIRATION }) });
    const blobId = await addBlob(req.file.buffer, authenticationData.vector);
    if(!blobId) {
      notifyFailed(sessionId, 'Failed to add blob');
      return;
    }
    // Send notification - Blob uploaded
    notifyBlobUploaded(sessionId, blobId);
    // Upload original image to IPFS
    const originalIpfsCid = await uploadToIPFS(req.file.buffer);

    // Upload watermarked image to IPFS
    const watermarkedIpfsCid = await uploadToIPFS(authenticationData.watermarkedBuffer);
 
    let metadata = {
      metadataCID: '', // Will be set after IPFS upload
      image: originalIpfsCid,
      watermarkData: authenticationData.watermarkData,
      ...data
    };
    const metadataIpfsCid = await createAndUploadNFTMetadata(metadata, originalIpfsCid);
     // Send notification - Image uploaded
  notifyImageUploaded(sessionId, {
    original: originalIpfsCid,
    watermarked: watermarkedIpfsCid,
    metadata: metadataIpfsCid
  });
    const mintResult = await mintNFT(walletAddress, originalIpfsCid, blobId, watermarkedIpfsCid, metadataIpfsCid);
    
    // Send notification - NFT minted
    notifyNFTMinted(sessionId, {
      tokenId: mintResult.tokenId,
    });
    
    const listingResult = await createSoftListing(mintResult.tokenId, {
      owner: walletAddress,
      minBid: 2,
      description: data.description,
      endTime: Date.now() + 1000 * 60 * 60 * 24 * 2,
    });
    
    // Send notification - Item soft-listed
    notifySoftListed(sessionId, {
      listingId: listingResult,
    });
    
    // Create new authenticated image record
    const vectorId = v4();
    const newAuthenticatedImage = new AuthenticatedImage({
      original: originalIpfsCid,
      watermarked: watermarkedIpfsCid,
      metadataCID: metadataIpfsCid,
      user: req.user._id,
      vector: {
        id: vectorId,
        blobId: blobId  
        },
      blockchain: {
        transactionHash: mintResult.transactionHash,
        tokenId: mintResult.tokenId,
        listingId: listingResult
      },
      status: 'soft-listed'
    });
   await newAuthenticatedImage.save();
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
      await WebSocketSession.deleteOne({ sessionId });
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

    const verifications: any[] = [];
    for(let i = 0; i < filteredSimilarImages.length; i++) {
      let authenticatedImage = await AuthenticatedImage.findOne({"vector.id": filteredSimilarImages[i].id}).populate('verifications user').lean();
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
    if(verifications.length > 0) {
      res.status(200).json({
        message: 'Image verification successful',
        verifications: verifications
      });
    }
    else {
      res.status(400).json({ message: 'No similar images found' });
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

