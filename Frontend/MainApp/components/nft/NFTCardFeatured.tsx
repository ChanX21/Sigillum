import { Button } from "@/components/ui/button";
import Image from "next/image";

import { NFTCard } from "@/types";
import { UserAvatar } from "../shared/UserAvatar";

interface NFTCardFeaturedProps {
  nft: NFTCard;
}

export const NFTCardFeatured = ({ nft }: NFTCardFeaturedProps) => (
  <div className="col-span-1 bg-white rounded-4xl p-4 flex flex-col lg:flex-row gap-3 hover:shadow-lg transition-shadow h-auto lg:h-[400px]">
    {/* Image */}
    <div className="w-full lg:w-1/2 aspect-[16/9] relative overflow-hidden">
      <Image
        alt={nft.title}
        src={nft.image}
        fill
        className="rounded-4xl object-cover"
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
    </div>

    {/* Content */}
    <div className="w-full lg:w-1/2 h-auto lg:h-full flex flex-col px-0 lg:px-3 justify-between py-4 lg:py-3 gap-5">
      <h3 className="text-md font-semibold">{nft.title}</h3>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-gray-500 text-sm">Current Bid</p>
          <p className="text-sm font-medium">{nft.currentBid} ETH</p>
        </div>

        <div className="flex gap-2">
          <Button variant="default" className="rounded-md w-1/2">
            Place bid
          </Button>
          <Button
            variant="outline"
            className="rounded-md w-1/2 border border-primary bg-white"
          >
            Instant buy
          </Button>
        </div>
      </div>

      {nft.metadata && (
        <div className="text-gray-500">
          <h3 className="text-sm">Description</h3>
          <ul className="list-disc flex flex-col gap-3 list-outside text-sm pl-3">
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
        <div className="flex flex-col lg:flex-row justify-between gap-3 lg:gap-0">
          <div className="flex items-center gap-2">
            <UserAvatar src={nft.owner.avatar} alt={nft.owner.name} />
            <div className="flex flex-col">
              <p className="text-xs font-medium">{nft.owner.name}</p>
              <p className="text-xs text-gray-400">Owner</p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs text-gray-400">Instant buy</p>
            <p className="text-xs font-semibold">{nft.currentBid + 0.06} ETH</p>
          </div>
        </div>
      )}
    </div>
  </div>
);
