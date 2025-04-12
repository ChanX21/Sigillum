import express from 'express';
import * as imageAuthController from '../controllers/imageAuthController';
import upload from '../middleware/upload';

const router = express.Router();

// POST /api/images/authenticate - Authenticate an image
router.post('/authenticate/:address', upload.single('image'), imageAuthController.authenticateImage);

// POST /api/images/verify - Verify an image using the uploaded file
router.post('/verify', upload.single('image'), imageAuthController.verify);

// GET /api/images/all - Get all authenticated images
router.get('/all', imageAuthController.getAllImages);

export default router; 