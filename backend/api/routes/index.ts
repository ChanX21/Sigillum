import express from 'express';
import * as imageAuthController from '../controllers/imageAuthController';
import upload from '../middleware/upload';

const router = express.Router();

// POST /api/images/authenticate - Authenticate an image
router.post('/authenticate', upload.single('image'), imageAuthController.authenticateImage);

// POST /api/images/mint - Mint an NFT for an authenticated image
router.post('/mint', imageAuthController.mintImageNFT);

// POST /api/images/verify - Verify an image against blockchain records
router.post('/verify', imageAuthController.verifyImage);

// GET /api/images/creator/:creatorId - Get all authenticated images for a creator
router.get('/creator/:creatorId', imageAuthController.getCreatorImages);

export default router; 