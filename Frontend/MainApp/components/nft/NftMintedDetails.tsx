"use client";
import React from "react";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { GoDownload } from "react-icons/go";
import { AuthState, useImageAuthStore } from "@/store/useImageAuthStore";
import { NFTDetails } from "./NFTDetails";

export function NftMintedDetails({
  setStep,
}: {
  setStep: (step: number) => void;
}) {
  const { result } = useImageAuthStore() as AuthState

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `${process.env.NEXT_PUBLIC_PINATA_URL}${result?.image.watermarkedIpfsCid}`; // Replace with your image URL
    link.download = "watermarked-image"; // The filename to save as
    link.target = "_blank"
    link.click();
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      {/* Back button */}
      <div className="max-w-4xl  w-full">
        <button
          onClick={() => setStep(0)}
          className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer hover:text-black mb-2 ml-2 mt-4 focus:outline-none"
          style={{ alignSelf: "flex-start" }}
        >
          <IoMdClose size={14} />
          Back
        </button>
      </div>
      <div className="w-full max-w-4xl border border-gray-300 rounded-lg shadow-sm p-0 flex flex-col md:flex-row bg-white mt-2">
        {/* Image + Download */}
        <div className="flex flex-col items-start w-full md:w-[55%] p-8 pb-4">
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden  ">
            <Image
              src={`${process.env.NEXT_PUBLIC_PINATA_URL}${result?.image.watermarkedIpfsCid}`}
              alt="NFT"
              fill
              className="object-cover rounded-lg"
              style={{ objectPosition: "center" }}
              priority
            />
          </div>
          <button
            onClick={handleDownload}
            className="mt-4 flex items-center gap-2 border border-gray-400 px-4 py-2  bg-white hover:bg-gray-100 text-sm font-normal"
          >
            <GoDownload size={18} />
            Download Watermarked Image
          </button>
        </div>
        {/* NFT Details */}
        <NFTDetails />
        
      </div>
      {/* Green Info Box */}
      <div className="w-full max-w-4xl mt-8">
        <div className="bg-green-100 border border-green-300 rounded-lg px-6 py-4">
          <div className="font-semibold text-green-900 mb-1 text-sm">
            What happens next?
          </div>
          <div className="text-green-900 text-xs">
            Your image is now secured with an invisible watermark and minted as
            an NFT on the blockchain. You can share your watermarked image
            knowing it's protected. The original is stored on decentralized
            storage, and all verification data is included in the NFT.
          </div>
        </div>
      </div>
    </div>
  );
}
