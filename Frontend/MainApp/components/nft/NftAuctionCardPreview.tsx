import Image from "next/image";
import React from "react";

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

export const NftAuctionCardPreview: React.FC<NftAuctionCardPreviewProps> = ({
  active = false,
  imageSrc = "/fallback.png", // fallback image
  ownerName = "Jane Cooper",
  ownerAvatar = "/user.png", // fallback avatar
  title = "Human Austrian Briar Art",
  highestBid = "0.556 ETH",
  endingIn = "4h:20m:30s",
  item,
}) => {
  return (
    <div
      className={`w-[320px] bg-white border-2  overflow-hidden flex flex-col`}
    >
      <div className="relative w-full aspect-square">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div
        className={`flex flex-col items-center py-4 ${
          active ? "bg-black" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Image
            src={ownerAvatar}
            alt={ownerName}
            width={24}
            height={24}
            className="rounded-full"
          />
          <span
            className={`text-xs ${active ? "text-white" : "text-gray-800"}`}
          >
            {ownerName}
          </span>
        </div>
        <h3 className={`text-lg font-bold text-center text-primary`}>
          {title}
        </h3>
      </div>
      {item !== undefined &&
        item !== null &&
        (item % 2 === 0 ? (
          <div className="grid grid-cols-2 border-t border-gray-300 text-primary text-xs">
            <div className="flex flex-col items-center py-3 border-r border-gray-300">
              <span className="mb-1 text-gray-400">Current highest bid</span>
              <span className="font-semibold">{highestBid}</span>
            </div>
            <div className="flex flex-col items-center py-3">
              <span className="mb-1 text-gray-400">Ending in</span>
              <span className="font-semibold">{endingIn}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-3 border-t border-gray-300 bg-primary text-xs">
            <p className="text-gray-400">Reserve price</p>
            <span className="font-semibold text-white">{highestBid}</span>
          </div>
        ))}
    </div>
  );
};

export default NftAuctionCardPreview;
