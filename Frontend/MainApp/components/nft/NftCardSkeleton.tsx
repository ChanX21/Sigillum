import React from "react";
import Link from "next/link";
import { SiSui } from "react-icons/si";

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

interface NFTCardSkeletonProps {
  id?: string;
}

// Placeholder components
const OptimizedImage: React.FC<OptimizedImageProps> = ({ className }) => (
  <div className={`${className} bg-gray-200 animate-pulse`}></div>
);

const UserAvatar: React.FC<UserAvatarProps> = () => (
  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
);

const ContractForm: React.FC = () => (
  <div className="h-10 w-full bg-gray-200 rounded mb-6 animate-pulse"></div>
);

const NFTCardSkeleton: React.FC<NFTCardSkeletonProps> = ({
  id = "placeholder-id",
}) => {
  return (
    <div className="col-span-1 bg-white border-2 p-3 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left side - Image */}
        <div className="relative w-full md:w-1/2">
          <div className="relative w-full h-[300px] md:h-full">
            <div className="absolute bg-gray-200 inset-0 flex items-center justify-center z-0">
              <div className="w-12 h-12 rounded-full animate-pulse bg-gray-300" />
            </div>
            {/* Timer overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[160px] h-[40px] rounded-[16px] border border-white/30 bg-white/30 shadow backdrop-blur-[5px] flex items-center justify-center">
              <span className="text-white font-semibold"></span>
            </div>
          </div>
        </div>

        {/* Right side - Details */}
        <div className="w-full md:w-1/2 p-6">
          <div className="h-8 w-3/4 bg-gray-200 rounded mb-4 animate-pulse"></div>

          {/* Current Bid Skeleton */}
          <div className="mb-6 min-h-[40px]">
            <div className="h-4 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Contract Form Skeleton */}
          <ContractForm />

          {/* Description */}
          <div className="mb-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>

            <div className="space-y-4">
              {/* Date */}
              <div className="flex justify-between items-center pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Metadata */}
              <div className="flex justify-between items-center pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Blockchain */}
              <div className="flex justify-between items-center pb-2">
                <div className="flex justify-between items-center pb-2 w-full">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center mt-4 gap-2">
            <UserAvatar />
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCardSkeleton;
