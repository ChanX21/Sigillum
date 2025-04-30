"use client";

import Image from "next/image";
import { useState } from "react";

const carouselImages = [
  "/image1.jpg",
  "/image2.jpg",
  "/image3.jpg",
  "/image4.jpg",
  "/image5.jpg",
];

export default function SecureCarousel() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      className="relative overflow-hidden w-full py-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className={`flex gap-4 animate-marquee whitespace-nowrap ${
          isPaused ? "paused" : ""
        }`}
      >
        {[...carouselImages, ...carouselImages].map((src, idx) => (
          <div
            key={idx}
            className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-xl overflow-hidden shadow-md flex-shrink-0"
          >
            <Image
              src={src}
              alt="carousel"
              fill
              className="object-cover"
              priority
            />
          </div>
        ))}
      </div>

      {/* Tailwind custom styles below */}
      <style jsx>{`
        .animate-marquee {
          animation: scroll 30s linear infinite;
        }

        .paused {
          animation-play-state: paused;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
