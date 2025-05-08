import { AuthState, useImageAuthStore } from "@/store/useImageAuthStore";
import { shortenAddress } from "@/utils/shortenAddress";
import { FaRegCopy } from "react-icons/fa";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useGetImageById } from "@/hooks/useGetImageById";
import { IoMdCloudUpload } from "react-icons/io";
import { Clock } from "lucide-react";

interface NFTDetailsProps {
  compact?: boolean;
}

export const NFTDetails = ({ compact = false }: NFTDetailsProps) => {
  const { result } = useImageAuthStore() as AuthState;

  const [imageId, setImageId] = useState<string>('')

  const {
    data, isLoading: nftDetailLoading
  } = useGetImageById(imageId);

  useEffect(() => {
    if (result?.image?.id) {
      setImageId(result.image.id)
    }
  }, [result?.image.id]);

 


  const details = compact
    ? [{ label: "NFT Id", value: result?.image?.id }]
    : [
      { label: "NFT Id", value: result?.image?.id },
      {
        label: "IPFS URL",
        value: `${process.env.NEXT_PUBLIC_PINATA_URL}${result?.image.originalIpfsCid}`,
      },
      {
        label: "Status",
        value: result?.image.status,
      },
      {
        label: "Vector Url",
        value: `https://walruscan.com/testnet/blob/${data?.vector?.blobId}`,
      },
    ];
  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} Successfully`);
  };

  return (
    <div className="flex flex-col gap-10 w-full md:w-[45%] p-8 pt-6">
      <div>
        <p className="font-semibold text-xl">NFT Details</p>
        <p className="text-sm text-gray-500 font-medium">
          Your image is now secured on the blockchain
        </p>
      </div>
      {nftDetailLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-t-[#1b263b] border-[#f1f3f5] rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-medium mt-6 mb-2">Loading Nft Details</h3>
        </div>
      ) : (
        <div className="flex pt-4 flex-1 flex-col gap-3">
          {details.map((detail) => (
            <div key={detail.label} className="flex flex-col">
              <p className="font-semibold text-gray-500 text-md">
                {detail.label}
              </p>
              <p className="text-sm font-medium flex items-center gap-2">
                <span className="flex items-center gap-2 mt-1">
                  {[
                    "IPFS URL",
                    "SHA-256 Hash",
                    "Perceptual Hash",
                    "Vector Url",
                  ].includes(detail.label)
                    ? (!data || !data.vector.blobId) && detail.label === "Vector Url" ? (
                      <>
                        <Clock width={15} />
                        Blob ID will be ready within an hour.
                      </>
                    ) : shortenAddress(detail.value, 10, 10)
                    : detail.value}
                </span>
                {!(detail.label === 'Vector Url' && !data?.vector?.blobId) && (
                  detail.label !== "Status" ? (
                    <Button
                      className="scale-90"
                      onClick={() =>
                        handleCopy(detail.value as string, detail.label as string)
                      }
                    >
                      <FaRegCopy size={12} width={20} className="cursor-pointer" />
                    </Button>
                  ) : (
                    <Button className="scale-90" onClick={() => toast("NFT uploaded successfully.")}>
                      <IoMdCloudUpload size={12} className="cursor-pointer" />
                    </Button>
                  )
                )}

              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
