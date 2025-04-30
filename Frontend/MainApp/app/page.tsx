"use client";

import { LandingHero } from "../components/LandingHero";
import { ImageCarouselShowcase } from "../components/ImageCarouselShowcase";
import { HowItWorks } from "../components/HowItWorks";
import { LandingCta } from "../components/LandingCta";
import { MediaRecord, NFTCard } from "@/types";
import { useGetAllImages } from "@/hooks/useGetAllImages";
import ImageCarousel from "@/components/hero/carousel";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  const featuredNFTs: NFTCard[] = [
    {
      title: "Human Austrian Briar Art",
      image: "/image.png",
      currentBid: 0.5,
      owner: {
        name: "Jane Cooper",
        avatar: "/user.png",
      },
      metadata: {
        date: "2nd March, 2025",
        blockchain: "sui",
      },
    },
    {
      title: "Venus in Flower",
      image: "/image.png",
      currentBid: 0.56,
      owner: {
        name: "Jane Cooper",
        avatar: "/user.png",
      },
      metadata: {
        date: "2nd March, 2025",
        blockchain: "sui",
      },
    },
  ];

  const browseNFTs: NFTCard[] = Array(6).fill({
    title: "Venus in Flower",
    image: "/image.png",
    currentBid: 0.56,
  });

  const { data } = useGetAllImages();
  console.log(data);

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
