"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

export default function NftAuctionCard() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="col-span-1  bg-white  border-2 p-3  overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left side - Image */}
        <div className="relative w-full md:w-1/2 bg-blue-200">
          <div className="relative w-full h-[300px] md:h-full">
            <Image
              src="/image.png"
              alt="Austrian Briar Art"
              className="object-cover"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Timer overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[160px] h-[40px] rounded-[16px] border border-white/30 bg-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[5px] flex items-center justify-center">
              <span className="text-white font-semibold">4h:20m:30s</span>
            </div>
          </div>
        </div>

        {/* Right side - Details */}
        <div className="w-full md:w-1/2 p-6">
          <h2 className="text-2xl font-bold mb-4">Human Austrian Briar Art</h2>

          {/* Current Bid */}
          <div className="mb-6">
            <p className="text-gray-600 mb-1">Current Bid</p>
            <p className="text-xl font-semibold">0.556 ETH</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <Button
              className="bg-black text-white px-6 py-2 rounded-none hover:bg-gray-800 transition-colors flex-1"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Place Bid
            </Button>
            <Button className="bg-white border text-primary border-gray-300 px-6 py-2 rounded-none hover:bg-gray-50 transition-colors flex-1">
              Stake
            </Button>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Description</h3>

            <div className="space-y-4">
              {/* Date */}
              <div className="flex justify-between items-center  pb-2">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">•</span>
                  <span className="text-gray-700">date</span>
                </div>
                <span className="text-gray-600">2nd March,2025</span>
              </div>

              {/* Metadata */}
              <div className="flex justify-between items-center  pb-2">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">•</span>
                  <span className="text-gray-700">metadata</span>
                </div>
                <span className="text-gray-600">metadata</span>
              </div>

              {/* Blockchain */}
              <div className="flex justify-between items-center  pb-2">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">•</span>
                  <span className="text-gray-700">blockchain</span>
                </div>
                <span className="text-gray-600">Ethereum</span>
              </div>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center mt-4">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
              <span className="text-sm">👤</span>
            </div>
            <div>
              <p className="font-medium">Jane Cooper</p>
              <p className="text-sm text-gray-500">Owner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
