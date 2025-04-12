"use client";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import Image from "next/image";
import { NFTDetailView } from "@/components/nft/NFTDetailView";

export default function Detail() {
  return (
    <>
      <Header />

      <main className="flex flex-col md:flex-row w-full min-h-screen px-4 md:px-10 pt-24">
        {/* Image Section */}
        <div className="w-full md:w-2/3 border-b md:border-b-0 md:border-r border-stone-300 flex justify-center items-center py-8 md:py-0">
          <div className="w-full md:w-3/4 aspect-[16/9] relative overflow-hidden">
            <Image
              alt="nft"
              src="/image.png"
              fill
              className="rounded-4xl object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Detail Section */}
        <div className="w-full md:w-1/3 h-full p-8 pt-16 md:pt-32">
          <NFTDetailView />
        </div>
      </main>

      <Footer />
    </>
  );
}
