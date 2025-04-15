"use client";
import { NFTCardFeatured } from "@/components/nft/NFTCardFeatured";
import { NFTCardBrowse } from "@/components/nft/NFTCardBrowse";
import { Footer } from "@/components/shared/Footer";
import { MediaRecord, NFTCard } from "@/types";
import { Header } from "@/components/shared/Header";
import { useGetAllImages } from "@/hooks/useGetAllImages";

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

      <main className="flex flex-col w-full min-h-screen pt-24 px-4 md:px-10">
        <section
          className="min-h-[50vh] grid grid-cols-1 md:grid-cols-2 gap-10 mb-10"
          aria-label="Featured NFTs"
        >
          {data?.slice(-2).map((nft: MediaRecord, index: number) => (
            <NFTCardFeatured key={index} nft={nft} />
          ))}
        </section>

        <section
          aria-label="Browse NFTs"
          className="pt-10 border-t border-stone-400"
        >
          <h1 className="text-3xl font-bold mb-8">Browse</h1>
          <div className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory">
            {data?.map((nft: MediaRecord, index: number) => (
              <div key={index} className="snap-start">
                <NFTCardBrowse nft={nft} idx={index} />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
