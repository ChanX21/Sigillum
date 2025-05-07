import React from "react";
import Link from "next/link";

// Type definitions
interface OptimizedImageProps {
  alt: string;
  src: string;
  sizes: string;
  fill: boolean;
  className: string;
}

interface UserAvatarProps {
  walletAddress?: string;
  alt?: string;
}

interface CompactNFTCardSkeletonProps {
  id?: string;
}

// Placeholder components
const OptimizedImage: React.FC<OptimizedImageProps> = ({ className }) => (
  <div className={`${className} bg-gray-200 animate-pulse`}></div>
);

const UserAvatar: React.FC<UserAvatarProps> = () => (
  <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
);

const NftPreviewSkeleton: React.FC<CompactNFTCardSkeletonProps> = ({
  id = "placeholder-id",
}) => {
  return (
    <div className="w-[320px] min-w-[320px] bg-white border-2 overflow-hidden flex flex-col">
      {/* Image Section */}
      <div className="relative w-full aspect-square">
        <div className="absolute bg-gray-200 inset-0 flex items-center justify-center z-0">
          <div className="w-12 h-12 rounded-full animate-pulse bg-gray-300" />
        </div>
      </div>

      {/* User Info and Title Section */}
      <div className="flex flex-col items-center py-4 bg-white">
        {/* User Info */}
        <div className="flex items-center gap-2 mb-2">
          <UserAvatar />
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* NFT Title */}

        <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mx-auto"></div>
      </div>

      {/* Price/Bid Section - Always show skeleton version */}
      <div className="grid grid-cols-2 border-t border-gray-300 text-primary text-xs">
        <div className="flex flex-col items-center py-3 border-r border-gray-300">
          {/* <span className="mb-1 text-gray-400">Current highest bid</span> */}
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center py-3">
          {/* <span className="mb-1 text-gray-400">Ending in</span> */}
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default NftPreviewSkeleton;
