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

