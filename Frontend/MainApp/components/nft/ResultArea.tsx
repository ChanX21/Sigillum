import Image from "next/image";
import { AiOutlineDownload } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, Terminal } from "lucide-react";
import { NFTDetails } from "./NFTDetails";
import { useEffect } from "react";
import { AuthState, useImageAuthStore } from "@/store/useImageAuthStore";

export const ResultArea = ({
  setStep,
}: {
  setStep: (step: number) => void;
}) => {
  const { result } = useImageAuthStore() as AuthState
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `${process.env.NEXT_PUBLIC_PINATA_URL}/${result?.image.watermarkedIpfsCid}`; // Replace with your image URL
    link.download = "watermarked-image"; // The filename to save as
    link.target = "_blank"
    link.click();
  };
  return (
    <div>

      <Button variant="ghost" onClick={() => setStep(0)} className="p-2">
        <ChevronLeft className="w-3 h-3 mx-1" />
        Back
      </Button>
      <div className="min-h-[550px] rounded-lg p-10 grid md:grid-cols-2 w-full gap-10 md:gap-36 ">
        <div className="col-span-1 flex flex-col">
          <div className="w-full aspect-[16/9] relative overflow-hidden mb-10">
            <Image
              alt="nft"
              src={`${process.env.NEXT_PUBLIC_PINATA_URL}/${result?.image.watermarkedIpfsCid}`}
              fill
              className="rounded-4xl object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>

          <Button
            variant="default"
            onClick={handleDownload}
            className="rounded-md w-full h-12 cursor-pointer"
          >
            <AiOutlineDownload size={25} />
            <span>Download Watermarked Image</span>
          </Button>
        </div>

        <div className="col-span-1">
          <NFTDetails />
        </div>
      </div>

      <Alert variant="default" className="bg-green-100 border border-green-700">
        <Terminal className="h-4 w-4" />
        <AlertTitle>What happens next?</AlertTitle>
        <AlertDescription>
          Your image is now secured with an invisible watermark and minted as an
          NFT on the blockchain. You can share your watermarked image knowing
          it's protected. The original is stored on decentralized storage, and
          all verification data is included in the NFT.
        </AlertDescription>
      </Alert>
    </div>
  );
};
