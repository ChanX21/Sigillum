"use client";
import React from "react";
import Image from "next/image";
import { IoMdDownload } from "react-icons/io";
import { IoMdClose } from "react-icons/io";
import { useRouter } from "next/navigation";
import { GoDownload } from "react-icons/go";
import { AuthState, useImageAuthStore } from "@/store/useImageAuthStore";
import { NFTDetails } from "./NFTDetails";

export function NftMintedDetails({
  setStep,
}: {
  setStep: (step: number) => void;
}) {
  const router = useRouter();
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
        {/* <div className="flex flex-col gap-10 w-full md:w-[45%] p-8 pt-6">
          <div>
            <h2 className="font-semibold text-base mb-1">NFT Details</h2>
            <div className="text-gray-500 text-xs mb-4">
              Your image is now secured on the blockchain
            </div>
          </div>
          <div className="text-xs mb-2 font-semibold">
            <div className="mb-2 flex flex-col gap-2">
              <span className="text-gray-500">NFT ID</span>
              <span className=" font-bold text-black">{nftId}</span>
            </div>
            <div className="mb-2 flex flex-col gap-2">
              <span className="text-gray-500">IPFS URL</span>
              <span className=" text-black  truncate max-w-[220px] align-middle">
                {ipfsUrl}
              </span>
            </div>
            <div className="mb-2 flex flex-col gap-2">
              <span className="text-gray-500">Transaction Hash</span>
              <span className=" text-black  truncate max-w-[220px] align-middle">
                {txHash}
              </span>
            </div>
            <div className="mb-2 flex flex-col gap-2">
              <span className="text-gray-500">SHA-256 Hash</span>
              <span className=" text-black  truncate max-w-[220px] align-middle">
                {sha256}
              </span>
            </div>
            <div className="mb-2 flex flex-col gap-2">
              <span className="text-gray-500">Perceptual Hash</span>
              <span className=" text-black  truncate max-w-[220px] align-middle">
                {perceptualHash}
              </span>
            </div>
          </div>
        </div> */}
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
