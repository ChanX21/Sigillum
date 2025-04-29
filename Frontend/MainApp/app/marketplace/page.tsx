"use client";
import NftAuctionCard from "@/components/nft/nftAuctionCard";
import NftAuctionCardPreview from "@/components/nft/NftAuctionCardPreview";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MarketplacePage() {
  return (
    <>
      <Header />

      <main className="flex flex-col w-full min-h-screen pt-24 px-4 md:px-10">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          {Array(2)
            .fill(0)
            .map((idx) => (
              <NftAuctionCard key={idx} />
            ))}
        </section>

        <h2 className="text-2xl font-bold mb-8">Explore</h2>
        <section className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory">
          {Array(5)
            .fill(0)
            .map((_, idx) => (
              <div key={idx} className="snap-start">
                <NftAuctionCardPreview key={idx} item={idx} />
              </div>
            ))}
        </section>
        <h2 className="text-2xl font-bold mb-8">Featured Drops</h2>
        <section className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory">
          {Array(5)
            .fill(0)
            .map((_, idx) => (
              <div key={idx} className="snap-start">
                <NftAuctionCardPreview key={idx} item={idx} />
              </div>
            ))}
        </section>

        <section className="w-full my-16 flex flex-col items-center">
          <div className="w-full max-w-4xl min-h-[200px] border-2 rounded-lg p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="mb-6 w-full md:w-1/2">
              <h3 className="font-bold text-2xl leading-tight text-left">
                Stay in the loop
              </h3>
              <div className="text-2xl font-bold text-gray-400 leading-tight text-left">
                Get the latest insights
              </div>
            </div>
            <div>
              <form className="flex flex-row w-full max-w-xl mb-2">
                <Input
                  type="email"
                  placeholder="Your Email"
                  className="border px-4 py-2 rounded-none flex-1 text-base focus:outline-none focus:ring-0"
                  style={{
                    borderRight: "none",
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                />
                <Button
                  type="submit"
                  className="bg-black text-white px-6 py-2 rounded-none text-base font-normal border border-black border-l-0"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  Signup
                </Button>
              </form>
              <div className="text-xs text-gray-400 text-left max-w-xl">
                By clicking send you'll receive occasional emails from Rarible.
                You always have the choice to unsubscribe within every email you
                receive.
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
