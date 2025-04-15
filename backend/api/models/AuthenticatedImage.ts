import mongoose, { Document, Schema } from 'mongoose';

// Define interfaces
interface IAuthentication {
  sha256Hash: string;
  pHash: string;
  watermarkData?: string;
  timestamp?: number;
  authenticatedAt: Date;
}

interface IBlockchain {
  transactionHash: string;
  tokenId: string;
  creator: string;
}


export interface IAuthenticatedImage extends Document {
  original: string;
  watermarked: string;
  authentication: IAuthentication;
  blockchain: IBlockchain;
  metadataCID: string;
  status: 'uploaded'  | 'minted' | 'soft-listed' | 'verified' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

const authenticatedImageSchema = new Schema<IAuthenticatedImage>({
  original: {
    unique: true,
    type: String,
    required: true,
  },
  watermarked: {
    unique: true,
    type: String,
    required: true,
  },
  authentication: {
    sha256Hash: {
      type: String,
      required: true,
    },
    pHash: {
      type: String,
      required: true,
    },
    watermarkData: String,
    timestamp: Number,
    authenticatedAt: Date
  },
  blockchain: {
    transactionHash: {
      type: String,
    },
    tokenId: {
      type: String,
    },
    creator: {
      type: String,
      required: true,
    },
    listingId: {
      type: String,
    },
  },
  metadataCID: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['uploaded', 'minted', 'soft-listed', 'verified', 'error'],
    default: 'uploaded'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for faster queries
authenticatedImageSchema.index({ 'authentication.sha256Hash': 1 });
authenticatedImageSchema.index({ 'authentication.pHash': 1 });

const AuthenticatedImage = mongoose.model<IAuthenticatedImage>('AuthenticatedImage', authenticatedImageSchema);

export { AuthenticatedImage};