import { useRef, useState } from "react";
import { MediaRecord } from "@/types";
import NftAuctionCardPreview from "../nft/NftAuctionCardPreview";

export default function InfiniteScrollingCarousel({
  children,
  carouselData,
}: {
  children: React.ReactNode;
  carouselData: MediaRecord[];
}) {
  const scrollContainerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Calculate scroll speed based on data length
  const scrollDuration = carouselData?.length
    ? Math.max(carouselData.length * 4, 20)
    : 30;

  // Calculate width for animation
  const itemWidth = 288; // Estimated width of each card + gap
  const originalContentWidth = carouselData?.length
    ? carouselData.length * itemWidth
    : 0;

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {carouselData && carouselData.length > 0 ? (
          <div
            className="flex"
            style={{
              animation: `infiniteScroll ${scrollDuration}s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
              width: `${carouselData.length * itemWidth * 2}px`,
            }}
          >
            {/* Original items */}
            {carouselData.map((nft: MediaRecord, index: number) => (
              <div
                key={`original-${nft._id || index}`}
                className="snap-start px-2"
              >
                <NftAuctionCardPreview nft={nft} idx={index} />
              </div>
            ))}

            {/* Duplicated items with unique keys */}
            {carouselData.map((nft: MediaRecord, index: number) => (
              <div
                key={`duplicate-${nft._id || index}`}
                className="snap-start px-2"
              >
                <NftAuctionCardPreview nft={nft} idx={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory">
            {children}
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes infiniteScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${originalContentWidth}px);
          }
        }
      `}</style>
    </div>
  );
}
