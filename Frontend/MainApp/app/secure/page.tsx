"use client";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { useState } from "react";
import { ImageUploadShowcase } from "@/components/nft/ImageUploadShowcase";
import { NftMintedDetails } from "@/components/nft/NftMintedDetails";

export default function Upload() {
  const [step, setStep] = useState<number>(0);
  const [stepLoading, setStepLoading] = useState<Boolean>(false);

  return (
    <>
      <Header />
      <main className="flex flex-col w-full min-h-screen pt-24 px-4 md:px-10 mb-12 ">
        {/* <ImageUploadShowcase /> */}

        <NftMintedDetails />
      </main>
      <Footer />
    </>
  );
}
