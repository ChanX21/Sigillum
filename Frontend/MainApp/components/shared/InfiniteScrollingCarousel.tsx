import { useRef, useState, useEffect } from "react";
import { MediaRecord } from "@/types";

// This component wraps your existing carousel sections to add infinite scrolling
export default function InfiniteScrollingCarousel({
  children,
  carouselData,
}: {
  children: any;
  carouselData: MediaRecord[];
}) {
  const scrollContainerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Calculate scroll speed based on data length (adjust as needed)
  const scrollDuration = carouselData?.length
    ? Math.max(carouselData.length * 4, 20)
    : 30;

  // Duplicate content to prevent visible resets
  const doubledContent =
    carouselData && carouselData.length > 0
      ? [...children, ...children]
      : children;

  // Calculate width for animation
  const itemWidth = 288; // Estimated width of each card + gap (adjust based on your design)
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
              width: `${doubledContent.length * itemWidth}px`,
            }}
          >
            {doubledContent}
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

// Usage example - modify your MarketplacePage component:
/*
import InfiniteScrollingCarousel from "@/components/InfiniteScrollingCarousel";

// Then replace your carousel sections with:

<InfiniteScrollingCarousel carouselData={data}>
  {data.map((nft: MediaRecord, index: number) => (
    <div key={index} className="snap-start px-2">
      <NftAuctionCardPreview nft={nft} idx={index} />
    </div>
  ))}
</InfiniteScrollingCarousel>

*/
