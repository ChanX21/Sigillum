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

// Middleware declarations
declare module '../middleware/upload' {
  import multer from 'multer';
  const upload: multer.Multer;
  export default upload;
} 