"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { GoDownload } from "react-icons/go";
import { AuthState, useImageAuthStore } from "@/store/useImageAuthStore";
import { NFTDetails } from "./NFTDetails";
type NFTDetailsRef = {
  reset: () => void;
};
export function NftMintedDetails({
  step,
  setStep,
}: {
  step:number;
  setStep: (step: number) => void;
}) {
  const { result } = useImageAuthStore() as AuthState
  const [resetKey, setResetKey] = useState(0);
  const nftRef = useRef<NFTDetailsRef>(null);

  const handleBack = () => {
    console.log(nftRef.current?.reset())
    nftRef.current?.reset();
    setResetKey(prev => prev + 1); // Force re-render
    setStep(0); // Or your custom logic to go back
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      {/* Back button */}
      <div className="max-w-4xl  w-full">
        <button
          onClick={() => handleBack()}
          className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer hover:text-black mb-2 ml-2 mt-4 focus:outline-none"
          style={{ alignSelf: "flex-start" }}
        >
          <IoMdClose size={14} />
          Back
        </button>
      </div>

      {/* NFT Details */}
      <NFTDetails key={resetKey} ref={nftRef} step={step} setStep={setStep}/>


      
    </div>
  );
}
