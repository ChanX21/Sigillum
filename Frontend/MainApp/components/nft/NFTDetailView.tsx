import { SiSui } from "react-icons/si";
import { UserAvatar } from "../shared/UserAvatar";
import { MediaRecord, NFTMetadata } from "@/types";
import { shortenAddress } from "@/utils/shortenAddress";
import { BidForm } from "../shared/BidForm";
import { useEffect, useState } from "react";
import { getListingDetails } from "@/utils/blockchainServices";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { useWallet } from "@suiet/wallet-kit";
import { formatSuiAmount, getTimeRemaining } from "@/utils/web2";

interface NFTDetailViewProps {
  nft: MediaRecord;
  metadata: NFTMetadata | null;
}

interface ListingDetails {
  owner: string;
  nftId: string;
  listPrice: number;
  listingType: number;
  minBid: number;
  highestBid: number;
  highestBidder: string;
  active: boolean;
  verificationScore: number;
  startTime: number;
  endTime: number;
}

export const NFTDetailView = ({ nft, metadata }: NFTDetailViewProps) => {
  const [listingDetails, setListingDetails] = useState<ListingDetails | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const { address } = wallet;

  useEffect(() => {
    const fetchListingDetails = async () => {
      if (!nft.blockchain.listingId) return;

      try {
        setLoading(true);
        setError(null);

        const provider = new SuiClient({ url: getFullnodeUrl("testnet") });

        const details = await getListingDetails(
          provider,
          PACKAGE_ID,
          MODULE_NAME,
          MARKETPLACE_ID,
          nft.blockchain.listingId,
          address
        );

        if (details) {
          // Cast the details to match our interface
          setListingDetails(details as unknown as ListingDetails);
          console.log("Listing details:", details);
        }
      } catch (err) {
        console.error("Error fetching listing details:", err);
        setError("Failed to fetch listing details");
      } finally {
        setLoading(false);
      }
    };

    fetchListingDetails();
  }, [nft.blockchain.listingId, address]);

  // Check if there's a highest bid
  const hasHighestBid = listingDetails && listingDetails.highestBid > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4 border-b border-stone-300">
          {metadata?.name || ""}
        </h1>
        <div className="flex items-center ">
          <div className="bg-primary rounded-full p-1" />
          <div className=" text-primary px-3 py-1  text-sm">
            {listingDetails?.active ? "Live Auction" : "Inactive"}
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <div>
          <p className="text-sm text-gray-500">Current Bid</p>
          <div className="flex items-center gap-2">
            {loading ? (
              <p className="text-2xl font-semibold">Loading...</p>
            ) : error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : (
              <p className="text-2xl font-semibold">
                {listingDetails
                  ? `${formatSuiAmount(listingDetails.highestBid)} SUI`
                  : "0 SUI"}
              </p>
            )}
          </div>
          {listingDetails && listingDetails.minBid > 0 && (
            <p className="text-xs text-gray-500">
              Min bid: {formatSuiAmount(listingDetails.minBid)} SUI
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Ends in</p>
          <p className="text-2xl font-semibold">
            {loading ? "Loading..." : getTimeRemaining(listingDetails?.endTime)}
          </p>
        </div>
      </div>

      <BidForm nft={nft} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-xs">
            All Bids{" "}
            <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded-full">
              {hasHighestBid ? "1" : "0"}
            </span>
          </h2>
        </div>
        {hasHighestBid && (
          <div className="flex items-center justify-between py-4 border-t">
            <div className="flex items-center gap-3">
              <UserAvatar
                walletAddress={listingDetails.highestBidder}
                alt="Highest bidder"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {shortenAddress(listingDetails.highestBidder)}
                </span>
                <span className="text-xs bg-primary/10 w-fit text-primary px-2 py-0.5 rounded">
                  Highest bid
                </span>
              </div>
            </div>
            <p className="font-medium">
              {formatSuiAmount(listingDetails.highestBid)} SUI
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Description</h2>
        <p className="text-gray-600">{metadata?.description}</p>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Details</h2>
        <div className="">
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Blockchain</span>
            <div className="flex items-center gap-2">
              <SiSui />
              <span>SUI</span>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Token ID</span>
            <span> {shortenAddress(nft.blockchain.tokenId) || ""}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Owner</span>
            <span>
              {listingDetails
                ? shortenAddress(listingDetails.owner)
                : "Unknown"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Contract</span>
            <div className="flex items-center gap-2">
              <span className="text-primary">
                {shortenAddress(nft.blockchain.tokenId) || ""}
              </span>
              <button className="text-primary">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            </div>
          </div>
          {listingDetails && (
            <div className="flex justify-between items-center py-2 border-t border-stone-300">
              <span className="text-gray-600">Listing Type</span>
              <span>
                {listingDetails.listingType === 0
                  ? "Soft Listing"
                  : "Real Listing"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
