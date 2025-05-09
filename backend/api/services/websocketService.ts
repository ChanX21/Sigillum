import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketSession } from '../models/User.js';

let io: SocketIOServer;

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'sigillum-secret-key';

/**
 * Initialize the Socket.io server
 * @param server - HTTP server instance
 */
export const initSocketIO = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ['http://localhost:3000', 'https://www.sigillum.digital', 'https://verifier.sigillum.digital'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth or cookies
      const token = socket.handshake.headers.token as string;

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // Verify token with proper type casting
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sessionId: string };
      if (!decoded || !decoded.sessionId) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Find the session
      const session = await WebSocketSession.findOne({ sessionId: decoded.sessionId });
      if (!session) {
        return next(new Error('Authentication error: Session not found'));
      }

      // Set authenticated user data on socket
      socket.data.session = session;
      // Automatically join user to their roomd
      socket.join(`image:${socket.data.session.sessionId}`);
      
      return next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('New authenticated client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

/**
 * Get the Socket.io instance
 * @returns Socket.io server instance
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Send notification when an image is uploaded
 * @param sessionId - ID of the session
 * @param imageData - Data of the uploaded image
 */
export const notifyImageUploaded = (sessionId: string, imageData: any) => {
  if (!io) return;
  
  // Send to specific user's room
  io.to(`image:${sessionId}`).emit('image:uploaded', {
    imageData,
  });
};

/**
 * Send notification when an image and vector is uploaded in the w
 * @param sessionId - ID of the session
 * @param blobId - ID of the blob
 */
export const notifyBlobUploaded = (sessionId: string, blobId: string) => {
  if (!io) return;

  // Send to specific user's room
  io.to(`image:${sessionId}`).emit('image:blob', {
    blobId,
  });
};

/**
 * Send notification when an NFT is minted
 * @param sessionId - ID of the session
 * @param nftData - Data of the minted NFT
 */
export const notifyNFTMinted = (sessionId: string, nftData: any) => {
  if (!io) return;
  
  // Send to specific user's room
  io.to(`image:${sessionId}`).emit('image:minted', {
    nftData,
  });
};

/**
 * Send notification when an item is soft-listed
 * @param sessionId - ID of the session
 * @param listingData - Data of the soft-listed item
 */
export const notifySoftListed = (sessionId: string, listingData: any) => {
  if (!io) return;
  
  // Send to specific image's room
  io.to(`image:${sessionId}`).emit('image:softListed', {
    listingData,
  });
}; 