"use client";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { useParams } from "next/navigation";
import { NFTMetadata } from "@/types";
import { useEffect, useState } from "react";
import { fetchMetadata } from "@/utils/web2";
import OptimizedImage from "@/components/shared/OptimizedImage";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useGetImageById } from "@/hooks/useGetImageById";
import { NFTDetailView } from "@/components/nft/NFTDetailView";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { shortenAddress } from "@/utils/shortenAddress";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "@/components/shared/Loading";

export default function Detail() {
  const id = useParams().id as string;
  const { isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { data, error: imageDataError } = useGetImageById(id);
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!data?.metadataCID) return;

        const response = await fetchMetadata(
          `${process.env.NEXT_PUBLIC_PINATA_URL}${data.metadataCID}`
        );
        setMetadata(response);
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setError("Failed to load NFT metadata");
      }
    };

    if (data?.metadataCID) {
      fetchData();
    }
  }, [data]);

  if (isLoading) {
    return null; //<Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || imageDataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold mb-4">Error</h2>
        <p className="text-gray-600">{error || String(imageDataError)}</p>
      </div>
    );
  }

  // Format image URL properly
  const getImageUrl = () => {
    if (!metadata?.image) return "/fallback.png";

    // If image URL doesn't start with http/https, prepend IPFS gateway
    if (!metadata.image.startsWith("http")) {
      // Handle IPFS URLs that may start with ipfs://
      const ipfsPath = metadata.image.replace("ipfs://", "");
      return `${process.env.NEXT_PUBLIC_PINATA_URL}${ipfsPath}`;
    }

    return metadata.image;
  };

  return (
    <>
      <Header />

      <main className="flex flex-col md:flex-row w-full min-h-screen pt-10">
        {/* Back Button - Fixed position on mobile, absolute on desktop */}
        <div className="fixed md:absolute top-16 left-4 ">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-2/3 border-b md:border-b-0 md:border-r border-stone-300 flex flex-col justify-center items-center pt-20 md:pt-24 px-4 md:px-8 lg:px-12">
          {metadata ? (
            <div className="w-full max-w-3xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold border-b">
                {metadata.name}
              </h2>
              {/* Responsive container with aspect ratio */}
              <div className="relative w-full  aspect-square md:aspect-[4/3] lg:aspect-[16/10] py-10 ">
                <OptimizedImage
                  src={getImageUrl()}
                  alt={metadata?.name || "NFT Image"}
                  className=" object-contain"
                  priority={true}
                  loading="eager"
                  sizes="(max-width: 640px) 95vw, (max-width: 1024px) 65vw, 50vw"
                />
              </div>

              {data?.user && (
                <div className="flex items-center justify-between pb-4 ">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      walletAddress={data.user.walletAddress}
                      alt="Owner"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {data.user.name ||
                          shortenAddress(data.user.walletAddress)}
                      </span>
                      <span className="text-xs bg-primary/10 w-fit text-primary px-2 py-0.5 rounded">
                        Owner
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full min-h-[300px] md:min-h-[400px] flex items-center justify-center bg-gray-50">
              <div className="w-12 h-12 rounded-full animate-pulse bg-gray-300" />
            </div>
          )}
        </div>

        {/* Detail Section */}
        <div className="w-full md:w-1/3 h-full p-4 md:p-6 lg:p-8 md:pt-24">
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
