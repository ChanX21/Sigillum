import { AuthState, useImageAuthStore } from "@/hooks/useImageAuthStore";
import { shortenAddress } from "@/utils/shortenAddress";
import { FaRegCopy } from "react-icons/fa";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface NFTDetailsProps {
  compact?: boolean;
}

export const NFTDetails = ({ compact = false }: NFTDetailsProps) => {
  const { result } = useImageAuthStore() as AuthState
  const details = compact
    ? [{ label: "NFT Id", value: "#52" }]
    : [
      { label: "NFT Id", value: result?.image?.id },
      {
        label: "IPFS URL",
        value: shortenAddress(`${process.env.NEXT_PUBLIC_PINATA_URL}/${result?.image.originalIpfsCid}`),
      },
      {
        label: "Status",
        value: result?.image.status,
      },
      {
        label: "SHA-256 Hash",
        value: shortenAddress(result?.image.sha256Hash),
      },
      {
        label: "Perceptual Hash",
        value: shortenAddress(result?.image.pHash),
      },
    ];
  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} Successfully`)
  }
  
  return (
    <div className="flex flex-col border border-primary rounded-xl shadow-lg p-6">
      <div>
        <p className="font-semibold text-xl">NFT Details</p>
        <p className="text-sm text-gray-500 font-medium">
          Your image is now secured on the blockchain
        </p>
      </div>
      <div className="flex pt-4 flex-1 flex-col gap-3">
        {details.map((detail) => (
          <div key={detail.label} className="flex flex-col">
            <p className="font-semibold text-gray-500 text-md">{detail.label}</p>
            <p className="text-sm font-medium flex items-center gap-2">
              <span>{detail.value}</span>
              <Button onClick={() => handleCopy(detail.value as string, detail.label as string)}>
                <FaRegCopy size={12} className="cursor-pointer" />
              </Button>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
