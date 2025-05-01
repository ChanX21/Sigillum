"use client";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import Image from "next/image";
import { NFTDetailView } from "@/components/nft/NFTDetailView";
import { useGetImageById } from "@/hooks/useGetImageById";
import { useParams } from "next/navigation";
import { NFTMetadata } from "@/types";
import { useEffect, useState } from "react";
import { fetchMetadata } from "@/utils/web2";
import OptimizedImage from "@/components/shared/OptimizedImage";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function Detail() {
  const id = useParams().id as string;
  const { data } = useGetImageById(id);
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchMetadata(
          `${process.env.NEXT_PUBLIC_PINATA_URL}${data.metadataCID}`
        );

        setMetadata(response);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    if (data?.metadataCID) {
      fetchData();
    }
  }, [data]);

  return (
    <>
      <Header />

      <main className="flex flex-col md:flex-row w-full min-h-screen px-4 md:px-10 pt-24 md:pt-0">
        {/* Image Section */}
        <div className="w-full md:w-2/3 border-b md:border-b-0 md:border-r border-stone-300 flex justify-center items-center py-8 md:py-0">
          <div className="absolute top-16 left-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ChevronLeft className="w-6 h-6 mr-2" />
              Back
            </Button>
          </div>

          <div className="w-full md:w-3/4 aspect-[16/9] relative overflow-hidden">
            {/* <Image
              alt={metadata?.name || ""}
              src={metadata?.image || "/fallback.png"}
              fill
              className="rounded-4xl object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            /> */}

            <OptimizedImage
              alt={metadata?.name || ""}
              src={metadata?.image || "/fallback.png"}
              sizes="(max-width: 768px) 100vw, 50vw"
              fill
              className="rounded-4xl "
            />
          </div>
        </div>

        {/* Detail Section */}
        <div className="w-full md:w-1/3 h-full p-8  md:pt-32">
          {data && (
            <NFTDetailView
              nft={data}
              metadata={metadata}
              metadataCID={data.metadataCID}
            />
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
