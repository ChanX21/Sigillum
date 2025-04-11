import { FaRegCopy } from "react-icons/fa";

interface NFTDetailsProps {
  compact?: boolean;
}

export const NFTDetails = ({ compact = false }: NFTDetailsProps) => {
  const details = compact
    ? [{ label: "NFT Id", value: "#52" }]
    : [
        { label: "NFT Id", value: "#52" },
        {
          label: "IPFS URL",
          value: "ipfs://Qm242725a3dc1262baa079...",
        },
        {
          label: "Transaction Hash",
          value: "0xab50e532...e12ed55f",
        },
        {
          label: "SHA-256 Hash",
          value: "0x65535f45...67f8a5ec",
        },
        {
          label: "Perceptual Hash",
          value: "0xe84d3d17322e896f",
        },
      ];

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
              <FaRegCopy size={12} className="cursor-pointer" />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
