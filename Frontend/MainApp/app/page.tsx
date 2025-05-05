"use client";

import { LandingHero } from "../components/LandingHero";
import { HowItWorks } from "../components/HowItWorks";
import { LandingCta } from "../components/LandingCta";
import ImageCarousel from "@/components/hero/carousel";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col w-full min-h-screen pt-24 px-0 bg-white">
        <LandingHero />
        <ImageCarousel />
        <HowItWorks />
        <LandingCta />
      </main>
      <Footer />
    </>
  );
}
