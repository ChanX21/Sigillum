import { SiSui } from "react-icons/si";
import { GiWalrusHead } from "react-icons/gi";
import { UserAvatar } from "../shared/UserAvatar";
import { ListingDataResponse, MediaRecord, NFTMetadata } from "@/types";
import { shortenAddress } from "@/utils/shortenAddress";
import { BidForm } from "../shared/BidForm";
import { useEffect, useState } from "react";
import { getObjectDetails } from "@/utils/blockchainServices";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { useWallet } from "@suiet/wallet-kit";
import { formatSuiAmount } from "@/utils/web2";
import { useCountdown } from "@/hooks/useCountdown";
import { BidAcceptanceForm } from "../shared/BidAcceptanceForm";
import Link from "next/link";
import { toast } from "sonner";
import { FaRegCopy } from "react-icons/fa";
import { Button } from "../ui/button";

interface NFTDetailViewProps {
  nft: MediaRecord;
  metadata: NFTMetadata | null;
  metadataCID: string;
}

export const NFTDetailView = ({
  nft,
  metadata,
  metadataCID,
}: NFTDetailViewProps) => {
  const [listingDetails, setListingDetails] =
    useState<ListingDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const { address } = wallet;
  const timeRemaining = useCountdown(Number(listingDetails?.endTime));

  const fetchListingDetails = async () => {
    if (!nft.blockchain.listingId) return;

    try {
      setLoading(true);
      setError(null);

      const provider = new SuiClient({ url: getFullnodeUrl("testnet") });

      const details = await getObjectDetails(
        provider,
        PACKAGE_ID,
        MODULE_NAME,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        address
      );

      if (details) {
        // Cast the details to match our interface
        setListingDetails(details as unknown as ListingDataResponse);
        //console.log("Listing details:", details);
      }
    } catch (err) {
      console.error("Error fetching listing details:", err);
      setError("Failed to fetch listing details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListingDetails();
  }, [nft.blockchain.listingId, address]);

  //console.log(nft);
  console.log(listingDetails);
  const sold =
    !listingDetails?.active &&
    listingDetails?.highestBidder == listingDetails?.owner;

  const handleCopy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`Copied Text Successfully`);
  };

  // Check if there's a highest bid
  const hasHighestBid = listingDetails && Number(listingDetails.highestBid) > 0;

  return (
    <div className="space-y-8">
      <div>
        {/* <h1 className="text-2xl font-semibold mb-4 border-b border-stone-300">
          {metadata?.name || ""}
        </h1> */}
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
              <p className="text-sm font-semibold">Loading...</p>
            ) : error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : (
              <p className="text-2xl font-semibold">
                {listingDetails
                  ? `${formatSuiAmount(Number(listingDetails.highestBid))} SUI`
                  : "0 SUI"}
              </p>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Ends in</p>
          <p className="text-sm font-semibold">
            {loading ? "Loading..." : timeRemaining}
          </p>
        </div>
      </div>

      {!sold && <BidForm nft={nft} fetchListingDetails={fetchListingDetails} />}

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
          <div className="flex items-center justify-between py-4 border-b border-t">
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
              {formatSuiAmount(Number(listingDetails.highestBid))} SUI
            </p>
          </div>
        )}
        {(() => {
          const { owner, highestBid } = listingDetails || {};
          return owner === address &&
            highestBid &&
            highestBid > 0 &&
            listingDetails?.active &&
            !sold ? (
            <BidAcceptanceForm nft={nft} />
          ) : null;
        })()}
      </div>

      <div className="space-y-4">
        <h2 className="font-medium border-b">Description</h2>
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
            <div className="flex items-center justify-end gap-2">
              <span> {shortenAddress(nft.blockchain.tokenId) || ""}</span>
              <button
                onClick={() => handleCopy(nft?.blockchain?.tokenId)}
                className=""
              >
                <FaRegCopy size={15} className="cursor-pointer" />
              </button>
            </div>
          </div>
          {/* <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Owner</span>
            <div className="flex justify-end items-center gap-2">
              <span>
                {nft.blockchain.creator
                  ? shortenAddress(nft.blockchain.creator)
                  : "Unknown"}
              </span>
              <button onClick={() => handleCopy(nft?.blockchain?.creator)} className="">
                <FaRegCopy size={15} className="cursor-pointer" />
              </button>
            </div>
          </div> */}
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Contract</span>
            <Link
              href={`${process.env.NEXT_PUBLIC_SUI_EXPLORER_URL}${nft.blockchain.tokenId}`}
              target="_blank"
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="text-primary">
                  {shortenAddress(nft.blockchain.tokenId) || ""}
                </span>
                <button className="text-primary pointer-events-none">
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
            </Link>
          </div>
          {listingDetails && (
            <div className="flex justify-between items-center py-2 border-t border-b border-stone-300">
              <span className="text-gray-600">Metadata</span>
              <Link
                href={`${process.env.NEXT_PUBLIC_PINATA_URL}${metadataCID}`}
                target="_blank"
              >
                <span className="underline cursor-pointer">IPFS</span>
              </Link>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-t border-b border-stone-300">
            <span className="text-gray-600">Walrus</span>
            <Link
              href={`https://walruscan.com/testnet/blob/${nft.vector.blobId}`}
              target="_blank"
              className="flex items-center gap-2 cursor-pointer"
            >
              <GiWalrusHead />
              <span>{shortenAddress(nft.vector.blobId)}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
