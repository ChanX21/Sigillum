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
