import { AuthState, useImageAuthStore } from "@/store/useImageAuthStore";
import { shortenAddress } from "@/utils/shortenAddress";
import { FaRegCopy } from "react-icons/fa";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { IoMdCloudUpload } from "react-icons/io";
import { AlertCircle, CheckCircle2, Shield, UploadCloud } from "lucide-react";
import { initSocket } from "@/lib/socket";
import { GoDownload } from "react-icons/go";
import { Card } from "../ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { GiWalrusHead } from "react-icons/gi";
import OptimizedImage from "../shared/OptimizedImage";
import { useAuthenticateImage } from "@/hooks/useAuthenticateImage";

interface NFTDetailsProps {
  step: number;
  compact?: boolean;
  setStep: (step: number) => void;
}
const statusSteps = [
  {
    key: "authenticate",
    label: "AI-Powered Authentication",
    description: "Sigillum AI is verifying the originality and integrity of the uploaded image using advanced image analysis.",
    icon: <Shield className="w-8 h-8" />,
  },
  {
    key: "blob",
    label: "Generating Blob ID",
    description: "Converting the image into a Blob and assigning it a unique identifier for further processing.",
    icon: <GiWalrusHead className="w-8 h-8" />,
  },
  {
    key: "uploaded",
    label: "Uploading Image",
    description: "Storing the image on Decentralized Pinata & Walrus servers..",
    icon: <UploadCloud className="w-8 h-8" />,
  },
  {
    key: "minted",
    label: "Tokenizing Image",
    description: "Tokenizing the image as an NFT on the blockchain.",
    icon: <Shield className="w-8 h-8" />,
  },
  {
    key: "softListed",
    label: "Soft Listing on Marketplace",
    description: "Displaying the NFT on the marketplace, pending final approval or verification.",
    icon: <CheckCircle2 className="w-8 h-8" />,
  },
];
const stepProgress = {
  "image:authenticate": 10,
  "image:blob": 30,
  "image:uploaded": 50,
  "image:minted": 70,
  "image:softListed": 100,
};

export const NFTDetails = forwardRef((props: NFTDetailsProps, ref) => {
  const { step, compact = false, setStep } = props;
  const { sessionId: token } = useImageAuthStore() as AuthState;

  const error = useImageAuthStore((s) => s.error);
  const [status, setStatus] = useState('')
  const [statusStep, setStatusStep] = useState(0)
  const [completed, setCompleted] = useState<boolean>(false);
  const [requestFailed, setRequestFailed] = useState(false)
  const [progress, setProgress] = useState(0);

  const [details, setDetails] = useState<
    { label: string; value: string | undefined }[]
  >([
    { label: "Token Id", value: '' },
    {
      label: "IPFS URL",
      value: '',
    },
    {
      label: "Status",
      value: '',
    },
    {
      label: "Blob Id",
      value: '',
    },
  ]);
  const resetComponent = () => {

    setStatus('');
    setStatusStep(0);
    setCompleted(false);
    setProgress(0);
    setImageUrl('');
    setDetails([
      { label: "Token Id", value: '' },
      { label: "IPFS URL", value: '' },
      { label: "Status", value: '' },
      { label: "Blob Id", value: '' },
    ]);

    // Also reset Zustand state
    useImageAuthStore.getState().setError(null);
    useImageAuthStore.getState().setSessionId(null);
    useImageAuthStore.getState().reset();
  };
  useImperativeHandle(ref, () => ({
    reset: resetComponent
  }));

  const [imageUrl, setImageUrl] = useState('')

  // Websocket Events
  useEffect(() => {
    if (!token) return;
    const socket = initSocket(token)

    const handleProgress = (event: keyof typeof stepProgress) => {
      setProgress(stepProgress[event]);
      setStatus(event);

      if (event === "image:softListed") {
        setCompleted(true);
        socket.disconnect();
      }
    };
    if (token) {
      handleProgress("image:authenticate")
      setStatusStep(1)
    }

    // Register event listeners
    socket.on("image:blob", (data) => {
      handleProgress("image:blob")
      setStatusStep(2)
      setDetails((prev) => {
        // Check if the detail with the label already exists
        const newDetail = {
          label: "Blob Id",
          value: `${data.blobId}`,
        };
        // Update if exists, otherwise add new
        if (prev.some((detail) => detail.label === newDetail.label)) {
          return prev.map((detail) =>
            detail.label === newDetail.label ? newDetail : detail
          );
        }
        return [...prev, newDetail];
      });
    });
    socket.on("image:failed", (data) => {
      console.log("Failed: ", data?.message)

      handleProgress("image:authenticate")
      setStatusStep(0)
      resetComponent()
      setRequestFailed(true)
      socket.disconnect();
    });

    socket.on("image:uploaded", (data) => {
      handleProgress("image:uploaded")

      setStatusStep(3)
      setDetails((prev) => {
        const newDetail = {
          label: "IPFS URL",
          value: `${process.env.NEXT_PUBLIC_PINATA_URL}${data?.imageData?.original}`,
        };
        if (prev.some((detail) => detail.label === newDetail.label)) {
          return prev.map((detail) =>
            detail.label === newDetail.label ? newDetail : detail
          );
        }
        return [...prev, newDetail];
      });
      setImageUrl(`${process.env.NEXT_PUBLIC_PINATA_URL}${data?.imageData?.watermarked}`)
    });

    socket.on("image:minted", (data) => {
      handleProgress("image:minted")

      setStatusStep(4)
      setDetails((prev) => {
        const newDetail = { label: "Token Id", value: data?.nftData?.tokenId };
        if (prev.some((detail) => detail.label === newDetail.label)) {
          return prev.map((detail) =>
            detail.label === newDetail.label ? newDetail : detail
          );
        }
        return [...prev, newDetail];
      });
    });

    socket.on("image:softListed", (data) => {
      handleProgress("image:softListed")

      setDetails((prev) => {
        const newDetail = { label: "Status", value: "soft-listed" };
        if (prev.some((detail) => detail.label === newDetail.label)) {
          return prev.map((detail) =>
            detail.label === newDetail.label ? newDetail : detail
          );
        }
        return [...prev, newDetail];
      });
    });
    return () => {
      socket.disconnect()
    }
  }, [token])

  useEffect(() => {
    if (error) {
      toast.error(error);
      useImageAuthStore.getState().setError(null)
      setStep(0)
    }
  }, [error])

  useEffect(() => {
    setRequestFailed(false);
  }, [step]);


  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} Successfully`);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl; // Replace with your image URL
    link.download = "watermarked-image"; // The filename to save as
    link.target = "_blank"
    link.click();
  };
  if (requestFailed) {
    return (
      <Card className="flex md:min-h-[30vh] flex-col items-center justify-center md:max-w-[30%] px-10 py-16 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertCircle className="w-16 h-16" />
              </div>
            </div>
            <h3 className="text-lg font-medium mt-6 mb-2">Whoops, something broke.</h3>
            <p className="text-[#616161] text-center">Hang tight — Walrus will be back in a bit!</p>
          </motion.div>
        </AnimatePresence>
        <Button onClick={() => {
          setStep(0)
          resetComponent()
        }}>Try Again</Button>
      </Card >
    )
  }

  return !completed && !requestFailed ? (
    <Card className="flex md:min-h-[60vh] flex-col items-center justify-center md:max-w-[30%] px-10 py-16 relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center"
        >
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-t-[#1b263b] border-[#f1f3f5] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {statusSteps[statusStep].icon}
            </div>
          </div>
          <h3 className="text-lg font-medium mt-6 mb-2">{statusSteps[statusStep].label}</h3>
          <p className="text-[#616161] text-center">{statusSteps[statusStep].description}</p>
        </motion.div>
      </AnimatePresence>
      <motion.div className="relative w-full h-2 bg-gray-200 rounded overflow-hidden mt-6">
        <motion.div
          className="h-full bg-black absolute left-0 bottom-0 rounded"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      </motion.div>
    </Card >
  ) : !requestFailed && (
    <>
      <div className="w-full max-w-4xl border border-gray-300 rounded-lg shadow-sm p-0 flex flex-col md:flex-row bg-white mt-2">
        <div className="flex flex-col items-start w-full md:w-[55%] p-8 pb-4">
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden  ">
            <OptimizedImage
              alt={"Nft"}
              src={imageUrl || "/fallback.png"}
              sizes="(max-width: 768px) 100vw, 50vw"
              fill
              className="object-cover rounded-lg"
              style={{ objectPosition: "center" }}
            />
          </div>
          <button
            onClick={handleDownload}
            className="mt-4 cursor-pointer flex items-center gap-2 border border-gray-400 px-4 py-2  bg-white hover:bg-gray-100 text-sm font-normal"
          >
            <GoDownload size={18} />
            Download Watermarked Image
          </button>
        </div>
        <div className="flex flex-col gap-10 w-full md:w-[45%] p-8 pt-6">
          <div>
            <p className="font-semibold text-xl">NFT Details</p>
            <p className="text-sm text-gray-500 font-medium">
              Your image is now secured on the blockchain
            </p>
          </div>


          <div className="flex pt-4 flex-1 flex-col gap-3">
            {!compact ? details.map((detail) => (
              <div key={detail.label} className="flex flex-col">
                <p className="font-semibold text-gray-500 text-md">
                  {detail.label}
                </p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="flex items-center gap-2 mt-1">
                    {[
                      "Token Id",
                      "IPFS URL",
                      "Blob Id",
                    ].includes(detail.label)
                      ? shortenAddress(detail.value, 10, 10)
                      : detail.value}
                  </span>
                  {
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
                  }

                </p>
              </div>
            )) : details
              .filter((detail) => detail.label === "IPFS URL") // Show only "IPFS URL" when compact is true
              .map((detail) => (
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
                        "Blob Id",
                      ].includes(detail.label)
                        ? shortenAddress(detail.value, 10, 10)
                        : detail.value}
                    </span>
                    {
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
                    }

                  </p>
                </div>
              ))}
          </div>

        </div>
      </div>
      {/* Green Info Box */}
      <div className="w-full max-w-4xl mt-8">
        <div className="bg-green-100 border border-green-300 rounded-lg px-6 py-4">
          <div className="font-semibold text-green-900 mb-1 text-sm">
            What happens next?
          </div>
          <div className="text-green-900 text-xs">
            Your image is now secured with an invisible watermark and minted as
            an NFT on the blockchain. You can share your watermarked image
            knowing it's protected. The original is stored on decentralized
            storage, and all verification data is included in the NFT.
          </div>
        </div>
      </div>
    </>
  );
});
