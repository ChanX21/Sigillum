import { SiIpfs, SiSui } from "react-icons/si";
import { GiWalrusHead } from "react-icons/gi";
import { UserAvatar } from "../shared/UserAvatar";
import { ListingDataResponse, MediaRecord, NFTMetadata } from "@/types";
import { shortenAddress } from "@/utils/shortenAddress";
import { BidForm } from "../shared/BidForm";
import { useEffect, useState } from "react";
import {
  buildWithdrawStakeTx,
  getBidCount,
  getObjectDetails,
  getUserStake,
} from "@/utils/blockchainServices";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { useWallet } from "@suiet/wallet-kit";
import { convertMistToSuiAndUsd, formatSuiAmount } from "@/utils/web2";
import { useCountdown } from "@/hooks/useCountdown";
import { BidAcceptanceForm } from "../shared/BidAcceptanceForm";
import Link from "next/link";
import { toast } from "sonner";
import { FaRegCopy } from "react-icons/fa";
import { getStakersCount } from "@/utils/blockchainServices";
import { Button } from "../ui/button";
import { RelistForm } from "../shared/RelistForm";
import { RelistModal } from "../shared/RelistModal";
import { client } from "@/lib/suiClient";
import { Clock } from "lucide-react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface NFTDetailViewProps {
  nft: MediaRecord;
  metadata: NFTMetadata | null;
  metadataCID: string;
}

export const NFTDetailView = ({
  nft,
  metadata,
  metadataCID,
}: NFTDetailViewProps) => {
  const [listingDetails, setListingDetails] =
    useState<ListingDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const { address } = wallet;
  const timeRemaining = useCountdown(Number(listingDetails?.endTime));
  const [unstaking, setUnstaking] = useState<boolean>(false);
  const [stakersCount, setStakersCount] = useState<number>(0);
  const [bidCount, setBidCount] = useState<number>(0);
  const [userStake, setUserStake] = useState<{
    hasStaked: boolean;
    stakeAmount: number;
  }>({
    hasStaked: false,
    stakeAmount: 0,
  });
  const [converted, setConverted] = useState<{ sui: string; usd: string }>({
    sui: "SUI 0.00",
    usd: "USD 0.00",
  });
  const [convertedUserStake, setConvertedUserStake] = useState<{
    sui: string;
    usd: string;
  }>({
    sui: "SUI 0.00",
    usd: "USD 0.00",
  });

  const fetchListingDetails = async () => {
    if (!nft.blockchain.listingId || !address) return;

    try {
      setLoading(true);
      setError(null);

      const provider = client; //new SuiClient({ url: getFullnodeUrl("testnet") });

      const details = await getObjectDetails(
        provider,
        PACKAGE_ID,
        MODULE_NAME,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        address,
      );

      const stakersCount = await getStakersCount(
        provider,
        PACKAGE_ID,
        MODULE_NAME,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        address,
      );

      const bidCount = await getBidCount(
        provider,
        PACKAGE_ID,
        MODULE_NAME,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        address,
      );

      const userStake = await getUserStake(
        provider,
        PACKAGE_ID,
        MODULE_NAME,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        address,
        address,
      );

      if (stakersCount) {
        setStakersCount(stakersCount);
      }

      if (bidCount) {
        setBidCount(bidCount);
      }

      if (userStake) {
        setUserStake(userStake);
        const result = await convertMistToSuiAndUsd(
          Number(userStake.stakeAmount),
        );
        setConvertedUserStake(result);
      }

      if (details) {
        // Cast the details to match our interface
        setListingDetails(details as unknown as ListingDataResponse);
        const result = await convertMistToSuiAndUsd(Number(details.highestBid));
        setConverted(result);
      }
    } catch (err) {
      console.error("Error fetching listing details:", err);
      setError("Failed to fetch listing details");
    } finally {
      setLoading(false);
    }
  };

  // Handle unstake placement
  const handleUnstake = async () => {
    if (!address || !nft.blockchain.listingId) {
      toast.error("Please enter a valid unstake data");
      return;
    }

    try {
      setUnstaking(true);

      // Use the helper function to build the transaction
      const transaction = buildWithdrawStakeTx(
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        PACKAGE_ID,
        MODULE_NAME,
      );

      // Execute the transaction
      try {
        const result = await wallet.signAndExecuteTransaction({
          transaction,
        });

        console.log(result);

        if (result) {
          fetchListingDetails?.();
          toast.success("Unstaked successfully!");
        }
      } catch (txError: any) {
        console.error("Transaction execution error:", txError);

        // Extract more detailed error information
        const errorMessage = txError?.message || "Unknown error";

        if (
          errorMessage.includes("dynamic_field") &&
          errorMessage.includes("borrow_child_object_mut")
        ) {
          toast.error(
            "Failed to unstake: The listing may not exist or you don't have permission to stake on it.",
          );
        } else if (errorMessage.includes("Dry run failed")) {
          toast.error(
            "Failed to unstake: Transaction simulation failed. The listing may not be active.",
          );
        } else {
          toast.error(
            `Failed to unstake: ${errorMessage.substring(0, 100)}...`,
          );
        }
        return;
      }
    } catch (error: any) {
      console.error("Error unstaking:", error);
      toast.error("Failed to unstake. Please try again.");
    } finally {
      setUnstaking(false);
    }
  };

  useEffect(() => {
    fetchListingDetails();
  }, [nft.blockchain.listingId, address]);

  //console.log(nft);
  console.log(listingDetails);

  const sold =
    !listingDetails?.active &&
    listingDetails?.highestBidder == listingDetails?.owner;

  const handleCopy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`Copied Text Successfully`);
  };

  // Check if there's a highest bid
  const hasHighestBid = listingDetails && Number(listingDetails.highestBid) > 0;

  //check if ended
  const isTimeEnded =
    timeRemaining === "Ended" ||
    timeRemaining === "No deadline" ||
    timeRemaining === "00h 00m 00s";

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center ">
          <div className="bg-primary rounded-full p-1" />
          <div className=" text-primary px-3 py-1  text-sm">
            {listingDetails?.active && !isTimeEnded
              ? "Live Auction"
              : "Inactive"}
          </div>
        </div>
      </div>

      <div className="flex gap-8 min-h-[40px]">
        {wallet.connected && wallet.address && (
          <>
            <div>
              <p className="text-sm text-gray-500">Current Bid</p>
              <div className="flex items-center gap-2">
                {loading ? (
                  <p className="text-sm font-semibold">Loading...</p>
                ) : error ? (
                  <p className="text-red-500 text-sm">{error}</p>
                ) : (
                  <div className="flex flex-col">
                    <p className="text-2xl font-semibold">
                      {listingDetails ? `${converted.sui}` : "SUI 0.00"}
                    </p>
                    <p className="text-sm text-gray-500 font-semibold">
                      {listingDetails ? `${converted.usd}` : "USD 0.00"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ends in</p>
              <p className="text-sm font-semibold">
                {loading ? "Loading..." : timeRemaining}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="min-h-[40px]">
        {!sold &&
          wallet.connected &&
          wallet.address &&
          wallet.address !== listingDetails?.owner &&
          !isTimeEnded && (
            <BidForm
              nft={nft}
              fetchListingDetails={fetchListingDetails}
              userStake={userStake}
              highestBid={listingDetails?.highestBid}
              owner={listingDetails?.owner}
            />
          )}
      </div>

      {userStake &&
        userStake.hasStaked &&
        !isTimeEnded &&
        !listingDetails?.active && (
          <Button
            className="w-full py-6 text-lg border text-primary rounded-none"
            size="lg"
            onClick={handleUnstake}
            variant="outline"
            disabled={unstaking || !address}
          >
            {unstaking
              ? "Unstaking..."
              : `Unstake ${formatSuiAmount(userStake.stakeAmount)} SUI`}
          </Button>
        )}

      <div className="space-y-4">
        <div className="flex items-center justify-between ">
          <h2 className="font-medium text-xs">
            All Bids{" "}
            <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded-full">
              {bidCount}
            </span>
          </h2>
          <h2 className="font-medium text-xs">
            All Stakes{" "}
            <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded-full">
              {stakersCount}
            </span>
          </h2>
        </div>
        {hasHighestBid && (
          <div className="flex items-center justify-between py-4 border-b border-t">
            <div className="flex items-center gap-3">
              <UserAvatar
                walletAddress={listingDetails.highestBidder}
                alt="Highest bidder"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {shortenAddress(listingDetails.highestBidder)}
                </span>
                <span className="text-xs bg-primary/10 w-fit text-primary px-2 py-0.5 rounded">
                  Highest bid
                </span>
              </div>
            </div>
            {/* <p className="font-medium">{converted.usd}</p> */}
          </div>
        )}
        {(() => {
          const { owner, highestBid } = listingDetails || {};
          return owner === address &&
            !isTimeEnded &&
            highestBid &&
            highestBid > 0 &&
            listingDetails?.active &&
            !sold ? (
            <BidAcceptanceForm nft={nft} />
          ) : null;
        })()}
        {(() => {
          const { owner } = listingDetails || {};
          return owner === address && sold ? (
            <RelistModal nft={nft} listingDetails={listingDetails} />
          ) : null;
        })()}
      </div>

      <div className="space-y-4">
        <h2 className="font-medium border-b">Description</h2>
        <p className="text-gray-600">{metadata?.description}</p>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Details</h2>
        <div className="">
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Blockchain</span>
            <div className="flex items-center gap-2">
              <SiSui />
              <span>SUI</span>
            </div>
          </div>

          {/* <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Owner</span>
            <div className="flex justify-end items-center gap-2">
              <span>
                {nft.blockchain.creator
                  ? shortenAddress(nft.blockchain.creator)
                  : "Unknown"}
              </span>
              <button onClick={() => handleCopy(nft?.blockchain?.creator)} className="">
                <FaRegCopy size={15} className="cursor-pointer" />
              </button>
            </div>
          </div> */}
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Token Contract</span>
            <Link
              href={`${process.env.NEXT_PUBLIC_SUI_EXPLORER_URL}${nft.blockchain.tokenId}`}
              target="_blank"
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="text-primary">
                  {shortenAddress(nft.blockchain.tokenId) || ""}
                </span>
                <button className="text-primary pointer-events-none">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </div>
            </Link>
          </div>
          {listingDetails && (
            <div className="flex justify-between items-center py-2 border-t border-b border-stone-300">
              <span className="text-gray-600">Asset Info</span>
              <Link
                href={`${process.env.NEXT_PUBLIC_PINATA_URL}${metadataCID}`}
                target="_blank"
                className="hover:underline"
              >
                <span className="cursor-pointer flex items-center gap-2">
                  {" "}
                  View on Ipfs{" "}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-t border-b border-stone-300">
            <span className="text-gray-600">Blob Id</span>
            {nft.vector.blobId ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(nft.vector.blobId);
                      toast.success("Copied BlobId Successfully");
                    }}
                  >
                    <Image
                      src={"/tusky-wink.svg"}
                      alt="Tusky Io"
                      width={17}
                      height={15}
                    />
                    <span>{shortenAddress(nft.vector.blobId)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-2 text-sm cursor-pointer">
                <Clock width={15} />
                Available in 1 hour.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
