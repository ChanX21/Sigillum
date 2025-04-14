import express from 'express';
import * as imageAuthController from '../controllers/imageAuthController';
import upload from '../middleware/upload';

const router = express.Router();

// POST /images/authenticate - Authenticate an image with creator's signature
router.post('/authenticate/:address', upload.single('image'), imageAuthController.authenticateImage);

// POST /images/verify - Verify an image using the uploaded file
router.post('/verify', upload.single('image'), imageAuthController.verify);

// GET /images/all - Get all authenticated images
router.get('/all', imageAuthController.getAllImages);

// GET /images/:id - Get a authenticated image by id
router.get('/:id', imageAuthController.getImageById);

export default router; 