import mongoose, { Document, Schema } from 'mongoose';

// Define interfaces
interface IAuthentication {
  sha256Hash: string;
  pHash: string;
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
  status: 'uploaded' | 'minted' | 'soft-listed' | 'error';
  verifications: IVerification[] | string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IVerification extends Document {
  imageId: IAuthenticatedImage;
  verifier: string;
  createdAt: Date;
  updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>({
  imageId: {
    type: Schema.Types.ObjectId,
    ref: 'AuthenticatedImage',
    required: true,
  },
  verifier: {
    type: String,
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
  authentication: {
    sha256Hash: {
      type: String,
      required: true,
    },
    pHash: {
      type: String,
      required: true,
    },
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
    enum: ['uploaded', 'minted', 'soft-listed', 'error'],
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
const Verification = mongoose.model<IVerification>('Verification', verificationSchema);

export { AuthenticatedImage, Verification };