import { Button } from "@/components/ui/button";
import Image from "next/image";

import { MediaRecord, NFTMetadata } from "@/types";
import { UserAvatar } from "../shared/UserAvatar";
import { useEffect, useState } from "react";
import { fetchMetadata, formatHumanReadableDate } from "@/utils/web2";
import { shortenAddress } from "@/utils/shortenAddress";
import Link from "next/link";

interface NFTCardFeaturedProps {
  nft: MediaRecord;
}

export const NFTCardFeatured = ({ nft }: NFTCardFeaturedProps) => {
  
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchMetadata(
          `${process.env.NEXT_PUBLIC_PINATA_URL}${nft.metadataCID}`
        );
        // console.log(response)
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
    <div className="col-span-1 bg-white rounded-4xl p-4 flex flex-col lg:flex-row gap-3 hover:shadow-lg transition-shadow h-auto lg:h-[400px]">
      {/* Image */}
      <div className="w-full lg:w-1/2 aspect-[16/9] relative overflow-hidden">
        <Link href={`/detail/${nft._id}`}>
          <Image
            alt={metadata?.name || ""}
            src={metadata?.image || "/fallback.png"}
            fill
            className="rounded-4xl object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </Link>
      </div>

      {/* Content */}
      <div className="w-full lg:w-1/2 h-auto lg:h-full flex flex-col px-0 lg:px-3 justify-between py-4 lg:py-3 gap-5">
        <Link href={`/detail/${nft._id}`}>
          {" "}
          <h3 className="text-md font-semibold">{metadata?.name || ""}</h3>
        </Link>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-gray-500 text-sm">Current Bid</p>
            <p className="text-sm font-medium">{} SUI</p>
          </div>

          <div className="flex  space-x-1">
            <Button variant="default" className="rounded-md w-[49%]">
              Place bid
            </Button>
            <Button
              variant="outline"
              className="rounded-md w-[49%] border border-primary bg-white"
            >
              Instant buy
            </Button>
          </div>
        </div>

        {metadata && (
          <div className="text-gray-500">
            <h3 className="text-sm">Description</h3>
            <ul className="list-disc flex flex-col gap-3 list-outside text-sm pl-3">
              <li>
                <div className="flex justify-between">
                  <span>date</span>
                  <span>{formatHumanReadableDate(nft.createdAt)}</span>
                </div>
              </li>
              <li>
                <div className="flex justify-between">
                  <span>blockchain</span>
                  <span>SUI</span>
                </div>
              </li>
            </ul>
          </div>
        )}

        <div className="flex flex-col lg:flex-row justify-between gap-3 lg:gap-0">
          <div className="flex items-center gap-2">
            <UserAvatar
              walletAddress={nft.user.walletAddress}
              alt={nft.user.walletAddress || "Creator"}
            />
            <div className="flex flex-col">
              <p className="text-xs font-medium">
                {shortenAddress(nft.user.walletAddress) || ""}
              </p>
              <p className="text-xs text-gray-400">Owner</p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs text-gray-400">Instant buy</p>
            <p className="text-xs font-semibold">{0.06} SUI</p>
          </div>
        </div>
      </div>
    </div>
  );
};
