import express from 'express';
import * as imageAuthController from '../controllers/imageAuthController';
import upload from '../middleware/upload';

const router = express.Router();

// POST /api/images/authenticate - Authenticate an image
router.post('/authenticate/:address', upload.single('image'), imageAuthController.authenticateImage);

// POST /api/images/verify-with-contract - Verify an image using comprehensive Sui contract verification
router.post('/verify-with-contract', imageAuthController.verifyImageWithContract);

// GET /api/images/all - Get all authenticated images
router.get('/all', imageAuthController.getAllImages);

export default router; 