import express from 'express';
import * as imageAuthController from '../controllers/imageAuthController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// POST /authenticate - Authenticate an image with creator's signature
router.post('/authenticate/:address', upload.single('image'), imageAuthController.uploadImage);

// POST /mint - Mint an image
router.post('/blockchain', imageAuthController.blockchain);

// POST /verify - Verify an image using the uploaded file
router.post('/verify/:verifier', upload.single('image'), imageAuthController.verify);

// GET /all - Get all authenticated images
router.get('/all', imageAuthController.getAllImages);

// GET /:id - Get an authenticated image by ID
router.get('/:id', imageAuthController.getImageById);

export default router; 