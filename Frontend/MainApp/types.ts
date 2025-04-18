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
  original: string;
  watermarked: string;
  metadataCID: string;
  status: "minted" | "verified" | string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;

  authentication: {
    sha256Hash: string;
    pHash: string;
    watermarkData: string; // JSON string
    timestamp: number; // UNIX timestamp (ms)
    authenticatedAt: string; // ISO date string
  };

  blockchain: {
    transactionHash: string;
    tokenId: string;
    listingId: string;
    creator: string;
    metadataURI: string;
  };
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
  objectId: string;
  version: string;
  digest: string;
  content: {
    dataType: "moveObject";
    type: string;
    hasPublicTransfer: boolean;
    fields: {
      id: {
        id: string;
      };
      name: string;
      value: {
        type: string;
        fields: {
          active: boolean;
          description: string;
          end_time: string;
          highest_bid: string;
          highest_bidder: string;
          list_price: string;
          listing_type: number;
          metadata: string;
          min_bid: string;
          nft_id: string;
          owner: string;
          start_time: string;
          verification_score: string;
        };
      };
    };
  };
};
