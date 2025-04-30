import { MediaRecord, NFTMetadata } from "@/types";
import { fetchMetadata } from "@/utils/web2";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { UserAvatar } from "../shared/UserAvatar";
import { shortenAddress } from "@/utils/shortenAddress";

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
  return (
    <div
      className={`w-[320px] bg-white border-2  overflow-hidden flex flex-col`}
    >
      <div className="relative w-full aspect-square">
        <Link href={`/detail/${nft._id}`}>
          <Image
            src={metadata?.image || "/fallback.png"}
            alt={metadata?.name || "nft image"}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 33vw"
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
            {shortenAddress(nft.user.walletAddress) || ""}
          </span>
        </div>
        <Link href={`/detail/${nft._id}`}>
          <h3 className={`text-lg font-bold text-center text-primary`}>
            {metadata?.name || ""}
          </h3>
        </Link>
      </div>
      {idx !== undefined &&
        idx !== null &&
        (idx % 2 === 0 ? (
          <div className="grid grid-cols-2 border-t border-gray-300 text-primary text-xs">
            <div className="flex flex-col items-center py-3 border-r border-gray-300">
              <span className="mb-1 text-gray-400">Current highest bid</span>
              <span className="font-semibold">{"0.556 ETH"}</span>
            </div>
            <div className="flex flex-col items-center py-3">
              <span className="mb-1 text-gray-400">Ending in</span>
              <span className="font-semibold">{"4h:20m:30s"}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-3 border-t border-gray-300 bg-primary text-xs">
            <p className="text-gray-400">Reserve price</p>
            <span className="font-semibold text-white">{"0.556 ETH"}</span>
          </div>
        ))}
    </div>
  );
};

export default NftAuctionCardPreview;
