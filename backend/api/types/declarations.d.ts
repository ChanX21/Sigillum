// Service declarations
declare module '../services/ipfsService' {
  export function uploadToIPFS(data: Buffer | string): Promise<string>;
  export function createAndUploadNFTMetadata(metadata: any, imageCid: string): Promise<string>;
}

declare module '../services/blockchainService' {
  export function mintNFT(ownerAddress: string, imageHash: string, metadataURI: string): Promise<{
    transactionHash: string;
    tokenId: string;
  }>;
  export function verifyImage(tokenId: string, imageHash: string): Promise<boolean>;
}

declare module '../services/websocketService' {
  import { Server as SocketIOServer } from 'socket.io';
  import { Server as HttpServer } from 'http';
  
  export function initSocketIO(server: HttpServer): SocketIOServer;
  export function getIO(): SocketIOServer;
  export function notifyImageUploaded(userId: string, imageData: any): void;
  export function notifyBlobUploaded(userId: string, blobId: string): void;
  export function notifyNFTMinted(userId: string, nftData: any): void;
  export function notifySoftListed(userId: string, listingData: any): void;
}

// Middleware declarations
declare module '../middleware/upload' {
  import multer from 'multer';
  const upload: multer.Multer;
  export default upload;
} 