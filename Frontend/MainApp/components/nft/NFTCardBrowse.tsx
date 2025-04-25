import { Button } from "@/components/ui/button";
import { MediaRecord, NFTMetadata } from "@/types";
import { fetchMetadata } from "@/utils/web2";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";


import ListNFTButton from "./ListNFTButton";



interface NFTCardBrowseProps {
  nft: MediaRecord;
  idx: number;
  status?: string;
}

export const NFTCardBrowse = ({ nft, idx, status }: NFTCardBrowseProps) => {
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
    <div className="w-[320px] rounded-4xl bg-white h-[400px] p-2 flex flex-col gap-2 hover:shadow-lg transition-shadow">
      <div className="w-full aspect-[16/9] relative overflow-hidden h-[70%]">
        <Link href={`/detail/${nft._id}`}>
          {" "}
          <Image
            alt={metadata?.name || "nft image"}
            src={metadata?.image || "/fallback.png"}
            fill
            className="rounded-4xl object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 320px"
          />
        </Link>
      </div>

      <div className="flex flex-col h-12 justify-between md:px-2 gap-1">
        <div className="flex items-center gap-2">
          <div className="h-full flex flex-col justify-center">
            <Link href={`/detail/${nft._id}`}>
              <p className="text-md font-medium">{metadata?.name || ""}</p>
            </Link>
          </div>
        </div>
        {idx % 2 == 0 && (
          <div className="h-full flex  justify-between">
            <p className="text-xs text-gray-400">Current bid</p>
            <p className="text-xs font-semibold">{} SUI</p>
          </div>
        )}
      </div>
      <>
        {status === 'minted' || status === 'soft-listed' ? (

          <div className="flex justify-between">
            <Button
              variant="default"
              className="rounded-md w-[49%]  cursor-pointer"
            >
              View
            </Button>
            <ListNFTButton listingId={nft.blockchain.listingId} tokenId={nft.blockchain.tokenId} nftId={nft._id} />
          </div>
        ) : (
          <>
            {idx % 2 == 0 ? (
              <div className="flex justify-between">
                <Button
                  variant="default"
                  className="rounded-md w-full cursor-pointer"
                >
                  Place bid
                </Button>
              </div>
            ) : (
              <div className="flex justify-between">
                <Button
                  variant="default"
                  className="rounded-md w-[49%]  cursor-pointer"
                >
                  Place bid
                </Button>
                <Button
                  variant="outline"
                  className="rounded-md w-[49%] cursor-pointer border border-primary bg-white"
                >
                  Instant buy
                </Button>
              </div>
            )}
          </>
        )}
      </>
    </div>
  );
};
