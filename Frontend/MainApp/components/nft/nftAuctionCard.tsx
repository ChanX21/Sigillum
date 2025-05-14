"use client";

import { useState, useEffect } from "react";
import { MediaRecord } from "@/types";
import { NFTMetadata } from "@/types";
import {
  convertMistToSuiAndUsd,
  fetchMetadata,
  formatHumanReadableDate,
} from "@/utils/web2";
import { useCountdown } from "@/hooks/useCountdown";
import Link from "next/link";
import { UserAvatar } from "../shared/UserAvatar";
import { shortenAddress } from "@/utils/shortenAddress";
import { ContractForm } from "../shared/ContractForm";
import OptimizedImage from "../shared/OptimizedImage";
import { ListingDataResponse } from "@/types";
import { useWallet } from "@suiet/wallet-kit";
import { getObjectDetails } from "@/utils/blockchainServices";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { SiSui } from "react-icons/si";
import { client } from "@/lib/suiClient";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface NFTCardFeaturedProps {
  nft: MediaRecord;
}

export default function NftAuctionCard({ nft }: NFTCardFeaturedProps) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [listingDetails, setListingDetails] =
    useState<ListingDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const timeRemaining = useCountdown(Number(listingDetails?.endTime));
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const { address } = wallet;
  const [converted, setConverted] = useState<{ sui: string; usd: string }>({
    sui: "SUI 0.00",
    usd: "USD 0.00",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchMetadata(
          `${process.env.NEXT_PUBLIC_PINATA_URL}${nft.metadataCID}`
        );

        setMetadata(response);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    if (nft?.metadataCID) {
      fetchData();
    }
  }, [nft]);

  useEffect(() => {
    const fetchListingDetails = async () => {
      if (!nft.blockchain.listingId) return;

      try {
        setLoading(true);
        setError(null);

        const provider = client; //new SuiClient({ url: getFullnodeUrl("testnet") });

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
          const result = await convertMistToSuiAndUsd(
            Number(details.highestBid)
          );
          setConverted(result);
          //console.log("Listing details:", details);
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
  const hasHighestBid = listingDetails && Number(listingDetails.highestBid) > 0;

  //check if ended
  const isTimeEnded =
    timeRemaining === "Ended" ||
    timeRemaining === "No deadline" ||
    timeRemaining === "00h 00m 00s";

  return (
    <div className="col-span-1  bg-white  border-2 p-3  overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left side - Image */}
        <div className="relative w-full md:w-1/2 ">
          <Link href={`/detail/${nft._id}`}>
            <div className="relative w-full h-[300px] md:h-full">
              <OptimizedImage
                alt={metadata?.name || ""}
                src={metadata?.image || "/fallback.png"}
                sizes="(max-width: 768px) 100vw, 50vw"
                fill
                className="object-cover rounded-none"
              />
              {/* Timer overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[160px] h-[40px] rounded-[16px] border border-white/30 bg-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[5px] flex items-center justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-white text-xs font-semibold mix-blend-difference">
                        {timeRemaining === "No deadline"
                          ? "loading..."
                          : timeRemaining}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-white text-xs font-semibold mix-blend-difference">
                        {timeRemaining === "No deadline"
                          ? "loading..."
                          : timeRemaining}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </Link>
        </div>

        {/* Right side - Details */}
        <div className="w-full md:w-1/2 p-6">
          <Link href={`/detail/${nft._id}`}>
            <h2 className="text-2xl font-bold mb-4">{metadata?.name || ""}</h2>
          </Link>

          {/* Current Bid */}
          <div className="mb-6 min-h-[40px]">
            {wallet.connected && wallet.address && (
              <>
                <p className="text-gray-600 mb-1">Current Bid</p>
                <p className="text-xl font-semibold">
                  {listingDetails && hasHighestBid ? (
                    <>
                      {converted.usd}
                      <span className="text-xs text-gray-400 font-regular ml-1">({converted.sui})</span>
                    </>

                  ) : "USD 0.00"}
                </p>
              </>
            )}
          </div>

          {wallet.connected && wallet.address && !isTimeEnded && (
            <ContractForm nft={nft} listingDetails={listingDetails} />
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Description</h3>

            <div className="space-y-4">
              {/* Date */}
              <div className="flex justify-between items-center  pb-2">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">•</span>
                  <span className="text-gray-700">date</span>
                </div>
                <span className="text-gray-600">
                  {formatHumanReadableDate(nft.createdAt)}
                </span>
              </div>

              {/* Metadata */}
              <div className="flex justify-between items-center  pb-2">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">•</span>
                  <span className="text-gray-700">Asset Info</span>
                </div>
                <Link
                  href={`${process.env.NEXT_PUBLIC_PINATA_URL}${nft.metadataCID}`}
                  target="_blank"
                  className="hover:underline"
                >
                  <span className="cursor-pointer flex items-center gap-2"> View on Ipfs <svg
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
                  </span>
                </Link>
              </div>

              {/* Blockchain */}
              <div className="flex justify-between items-center  pb-2">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">•</span>
                  <span className="text-gray-700">blockchain</span>
                </div>
                <span className="text-gray-600 flex items-center gap-1">
                  <SiSui />
                  <span>SUI</span>
                </span>
              </div>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center mt-4 gap-2">
            <UserAvatar
              walletAddress={nft.user.walletAddress}
              alt={nft.user.walletAddress || "Creator"}
            />
            <div>
              <p className="font-medium">
                {" "}
                {nft.user.name || shortenAddress(nft.user.walletAddress) || ""}
              </p>
              <p className="text-sm text-gray-500">Owner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
