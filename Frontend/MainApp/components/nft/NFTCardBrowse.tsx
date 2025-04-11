import { Button } from "@/components/ui/button";
import { NFTCard } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface NFTCardBrowseProps {
  nft: NFTCard;
  idx: number;
}

export const NFTCardBrowse = ({ nft, idx }: NFTCardBrowseProps) => (
  <Link href={`/detail/${idx}`}>
    <div className="w-[320px] rounded-4xl bg-white h-[400px] p-2 flex flex-col gap-2 hover:shadow-lg transition-shadow">
      <div className="w-full aspect-[16/9] relative overflow-hidden h-[70%]">
        <Image
          alt={nft.title}
          src={nft.image}
          fill
          className="rounded-4xl object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 320px"
        />
      </div>

      <div className="flex h-12 justify-between md:px-2">
        <div className="flex items-center gap-2">
          <div className="h-full flex flex-col justify-center">
            <p className="text-xl font-medium">{nft.title}</p>
          </div>
        </div>
        {idx % 2 == 0 && (
          <div className="h-full flex flex-col justify-center">
            <p className="text-xs text-gray-400">Current bid</p>
            <p className="text-xs font-semibold">{nft.currentBid} ETH</p>
          </div>
        )}
      </div>

      {idx % 2 == 0 ? (
        <div className="flex justify-between">
          <Button variant="default" className="rounded-md w-full cursor-pointer">
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
    </div>
  </Link>
);
