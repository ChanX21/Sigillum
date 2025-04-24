export interface NFTCard {
  title: string;
  image: string;
  currentBid: number;
  owner?: {
    name: string;
    avatar: string;
  };
  metadata?: {
    date: string;
    blockchain: string;
  };
}

export interface imageAuthResponse {
  image: imageAuthDetails;
  message: string;
}
export interface imageAuthDetails {
  id: string;
  originalIpfsCid: string;
  pHash: string;
  sha256Hash: string;
  status: string;
  watermarkedIpfsCid: string;
}

export type MediaRecord = {
  _id: string;
  original: string; // IPFS CID of the original media
  watermarked: string; // IPFS CID of the watermarked media
  metadataCID: string; // IPFS CID for metadata
  status: string; // e.g., "soft-listed", "minted", etc.
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;

  vector: {
    id: string; // UUID
    ipfsCid: string; // CID for vector representation
  };

  blockchain: {
    transactionHash: string;
    tokenId: string;
    creator: string;
    listingId: string;
  };

  verifications: {
    _id: string;
    imageId: string;
    score: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }[];
};

export type NFTMetadata = {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value?: string; // some are missing `value`
  }[];
  authentication: {
    sha256Hash: string;
    pHash: string;
    watermarkData: string; // you can also parse this as an object if needed
  };
};

export type ListingDataResponse = {
  owner: string; // hex string address
  nftId: string; // hex string address
  listPrice: bigint;
  listingType: number; // u8
  minBid: bigint;
  highestBid: bigint;
  highestBidder: string; // hex string address
  active: boolean;
  verificationScore: bigint;
  startTime: bigint;
  endTime: bigint;
};
