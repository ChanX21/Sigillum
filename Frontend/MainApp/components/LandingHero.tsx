"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { FiCheck, FiShoppingCart } from "react-icons/fi";

export function LandingHero() {
  return (
    <section className="flex flex-col items-center justify-center mt-12 mb-10">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-center mb-4 tracking-tight">
        CELEBRATING
        <br className="hidden sm:block" />
        AUTHENTIC MOMENTS<span className="">_</span>
      </h1>
      <p className="text-gray-500 text-center max-w-[600px] mb-6 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
        A new home for real photos.
        <br className="hidden sm:block" />
        Where authenticity is valued and every image tells its true story.
      </p>
      <div className="flex items-center justify-center space-x-4  ">
        <Button
          className="bg-black text-white font-medium px-4 py-2 rounded-none shadow hover:bg-gray-900 transition text-sm flex items-center gap-2"
          style={{ width: "150px" }}
        >
          <FiCheck className="text-lg" />
          Verify your vision
        </Button>
        <Link href="/marketplace">
          <Button
            variant="outline"
            className="bg-white border border-gray-400 px-4 py-2 text-primary rounded-none shadow text-sm hover:bg-gray-100 flex items-center gap-2"
            style={{ width: "150px" }}
          >
            <FiShoppingCart className="text-lg" />
            Marketplace
          </Button>
        </Link>
      </div>
    </section>
  );
}
