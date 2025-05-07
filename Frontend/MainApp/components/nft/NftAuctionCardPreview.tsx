import { MediaRecord, NFTMetadata } from "@/types";
import {
  convertMistToSuiAndUsd,
  fetchMetadata,
  formatSuiAmount,
} from "@/utils/web2";
import { useCountdown } from "@/hooks/useCountdown";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { UserAvatar } from "../shared/UserAvatar";
import { shortenAddress } from "@/utils/shortenAddress";
import OptimizedImage from "../shared/OptimizedImage";
import { ListingDataResponse } from "@/types";
import { useWallet } from "@suiet/wallet-kit";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { getObjectDetails } from "@/utils/blockchainServices";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import ListNFTButton from "./ListNFTButton";
import { client } from "@/lib/suiClient";

interface NftAuctionCardPreviewProps {
  active?: boolean;
  imageSrc?: string;
  ownerName?: string;
  ownerAvatar?: string;
  title?: string;
  highestBid?: string;
  endingIn?: string;
  item?: number;
}

interface NFTCardBrowseProps {
  nft: MediaRecord;
  idx: number;
  status?: string;
}

export const NftAuctionCardPreview = ({
  nft,
  idx,
  status,
}: NFTCardBrowseProps) => {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [listingDetails, setListingDetails] =
    useState<ListingDataResponse | null>(null);
  const timeRemaining = useCountdown(Number(listingDetails?.endTime));
  const [loading, setLoading] = useState<boolean>(false);
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
  const listPrice = listingDetails?.listPrice ?? BigInt(0);
  const listPriceNumber = Number(listPrice);
  const isReserve = listPriceNumber > 0;

  // console.log(listingDetails);
  return (
    <div
      className={`w-[320px] bg-white border-2  overflow-hidden flex flex-col ${
        isReserve ? "border-b-primary" : "border-gray-300"
      }`}
    >
      <div className="relative w-full aspect-square">
        <Link href={`/detail/${nft._id}`}>
          <OptimizedImage
            alt={metadata?.name || ""}
            src={metadata?.image || "/fallback.png"}
            sizes="(max-width: 768px) 100vw, 50vw"
            fill
            className="object-cover rounded-none"
          />
        </Link>
      </div>
      <div className={`flex flex-col items-center py-4  bg-white`}>
        <div className="flex items-center gap-2 mb-2">
          <UserAvatar
            walletAddress={nft.user.walletAddress}
            alt={nft.user.walletAddress || "Creator"}
          />
          <span className={`text-xs  text-gray-800`}>
            {" "}
            {nft.user.name || shortenAddress(nft.user.walletAddress) || ""}
          </span>
        </div>
        <Link href={`/detail/${nft._id}`}>
          <h3
            className={`text-lg font-bold text-center text-primary`}
            title={metadata?.name || ""}
          >
            {metadata?.name
              ? metadata.name.length > 20
                ? `${metadata.name.slice(0, 20)}...`
                : metadata.name
              : ""}
          </h3>
        </Link>
      </div>

      {listingDetails?.listPrice !== undefined &&
        (isReserve ? (
          <div className="flex flex-col items-center py-3.5 border-t border-primary bg-primary text-xs">
            <p className="text-gray-400">Reserve price</p>
            <span className="font-semibold text-white">
              {/* {formatSuiAmount(listPriceNumber)} SUI */}
              {converted.usd}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2  border-gray-300 border-t text-primary text-xs">
            <div className="flex flex-col items-center py-3 border-r border-gray-300">
              <span className="mb-1 text-gray-400">Current highest bid</span>
              <span className="font-semibold">
                {hasHighestBid ? `${converted.usd}` : "USD 0.00"}
              </span>
            </div>
            <div className="flex flex-col items-center py-3">
              <span className="mb-1 text-gray-400">Ending in</span>
              <span className="font-semibold">
                {timeRemaining === "No deadline" ? "loading..." : timeRemaining}
              </span>
            </div>
          </div>
        ))}
    </div>
  );
};

export default NftAuctionCardPreview;
