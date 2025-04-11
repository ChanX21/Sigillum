"use client";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import Image from "next/image";
import { NFTDetailView } from "@/components/nft/NFTDetailView";

export default function Detail() {
  return (
    <>
      <Header />

      <main className="flex w-full min-h-screen px-4 md:px-10">
        <div className="w-2/3 min-h-screen border-r border-stone-300 h-full flex flex-col justify-center items-center">
          <div className="w-3/4 aspect-[16/9] relative overflow-hidden">
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
        <div className="w-1/3 min-h-screen h-full p-8 pt-32">
          <NFTDetailView />
        </div>
      </main>

      <Footer />
    </>
  );
}
