import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User.js';
// Define interfaces

interface IBlockchain {
  transactionHash: string;
  tokenId: string;
  listingId: string;
}


export interface IAuthenticatedImage extends Document {
  original: string;
  watermarked: string;
  user: IUser;
  vector: {
    id: string;
    blobId: string;
  };
  blockchain: IBlockchain;
  metadataCID: string;
  status: 'soft-listed' | 'listed' | 'error';
  verifications: IVerification[] | string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IVerification extends Document {
  imageId: IAuthenticatedImage;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>({
  imageId: {
    type: Schema.Types.ObjectId,
    ref: 'AuthenticatedImage',
    required: true,
  },
  score: {
    type: Number,
    required: true,
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
  vector: {
    id: {
      unique: true,
      type: String,
      required: true,
    },
    blobId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  blockchain: {
    transactionHash: {
      type: String,
      required: true,
      unique: true,
    },
    tokenId: {
      type: String,
      required: true,
      unique: true,
    },
    listingId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  verifications: [{
    type: Schema.Types.ObjectId,
    ref: 'Verification'
  }],
  metadataCID: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['soft-listed', 'listed', 'error'],
    default: 'soft-listed'
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
authenticatedImageSchema.index({ vectorId: 1 });

const AuthenticatedImage = mongoose.model<IAuthenticatedImage>('AuthenticatedImage', authenticatedImageSchema);
const Verification = mongoose.model<IVerification>('Verification', verificationSchema);

export { AuthenticatedImage, Verification };