import express from 'express';
import * as imageAuthController from '../controllers/imageAuthController.js';
import upload from '../middleware/upload.js';
import { verifySession } from '../middleware/verify.js';

const router = express.Router();

// POST /authenticate - Authenticate an image
router.post('/authenticate', verifySession, upload.single('image'), imageAuthController.uploadImage);

// POST /profile - Update user profile
router.post('/profile', verifySession, imageAuthController.updateProfile);

// GET /profile - Get user profile
router.get('/profile', verifySession, imageAuthController.getProfile);

// POST /mint - Mint an image
router.post('/blockchain', imageAuthController.blockchain);

// POST /status-update - Update the status of an image
router.post('/status-update/:id', imageAuthController.statusUpdate);

// GET /nonce/:address - Get a nonce for a user
router.get('/nonce/:address', imageAuthController.getNonce);

// POST /session - Create a session for a user
router.post('/session', imageAuthController.createSession);

// POST /verify - Verify an image using the uploaded file
router.post('/verify', upload.single('image'), imageAuthController.verify);

// GET /all - Get all authenticated images
router.get('/all', imageAuthController.getAllImages);

// GET /:id - Get an authenticated image by ID
router.get('/:id', imageAuthController.getImageById);

export default router; 