import { Button } from "@/components/ui/button";
import Image from "next/image";

import { NFTCard } from "@/types";
import { UserAvatar } from "../shared/UserAvatar";

interface NFTCardFeaturedProps {
  nft: NFTCard;
}

export const NFTCardFeatured = ({ nft }: NFTCardFeaturedProps) => (
  <div className="col-span-1 h-[400px] bg-white rounded-4xl p-4 flex gap-3 hover:shadow-lg transition-shadow">
    <div className="w-1/2 aspect-[16/9] relative overflow-hidden">
      <Image
        alt={nft.title}
        src={nft.image}
        fill
        className="rounded-4xl object-cover"
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>

    <div className="w-[50%] h-full flex flex-col justify-center gap-5">
      <h3 className="text-md font-semibold">{nft.title}</h3>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-gray-500 text-sm">Current Bid</p>
          <p className="text-sm font-medium">{nft.currentBid} ETH</p>
        </div>

        <div className="flex justify-between">
          <Button
            variant="default"
            className="rounded-md w-[45%] cursor-pointer"
          >
            Place bid
          </Button>
          <Button
            variant="outline"
            className="rounded-md w-[45%] cursor-pointer border border-primary bg-white"
          >
            Instant buy
          </Button>
        </div>
      </div>

      {nft.metadata && (
        <div className="text-gray-500">
          <h3 className="text-sm">Description</h3>
          <ul className="list-disc list-outside text-xs pl-3">
            <li>
              <div className="flex justify-between">
                <span>date</span>
                <span>{nft.metadata.date}</span>
              </div>
            </li>
            <li>
              <div className="flex justify-between">
                <span>blockchain</span>
                <span>{nft.metadata.blockchain}</span>
              </div>
            </li>
          </ul>
        </div>
      )}

      {nft.owner && (
        <div className="flex h-12 justify-between">
          <div className="flex items-center gap-2">
            <UserAvatar src={nft.owner.avatar} alt={nft.owner.name} />
            <div className="h-full flex flex-col justify-center">
              <p className="text-xs font-medium">{nft.owner.name}</p>
              <p className="text-xs text-gray-400">Owner</p>
            </div>
          </div>
          <div className="h-full flex flex-col justify-center">
            <p className="text-xs text-gray-400">Instant buy</p>
            <p className="text-xs font-semibold">{nft.currentBid + 0.06} ETH</p>
          </div>
        </div>
      )}
    </div>
  </div>
);
