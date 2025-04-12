import Image from "next/image";
import { AiOutlineDownload } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { NFTDetails } from "./NFTDetails";

export const ResultArea = ({
  setStep,
}: {
  setStep: (step: number) => void;
}) => {
  return (
    <div>
      <div className="min-h-[550px] rounded-lg p-10 grid md:grid-cols-2 w-full gap-10 md:gap-36 ">
        <div className="col-span-1 flex flex-col">
          <div className="w-full aspect-[16/9] relative overflow-hidden mb-10">
            <Image
              alt="nft"
              src="/image.png"
              fill
              className="rounded-4xl object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>

          <Button
            variant="default"
            onClick={() => setStep(2)}
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
