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

      {/* NFT Details */}
      <NFTDetails setStep={setStep}/>


      
    </div>
  );
}
