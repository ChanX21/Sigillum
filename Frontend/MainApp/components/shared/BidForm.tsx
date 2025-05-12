import { Button } from "../ui/button";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { useEffect, useState } from "react";
import {
  buildPlaceBidTxWithCoinSelection,
  buildPlaceStakeTxWithCoinSelection,
  prepareAndBuildBidTransaction,
  prepareAndBuildStakeTransaction,
} from "@/utils/blockchainServices";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import { MediaRecord } from "@/types";
import { client } from "@/lib/suiClient";
import { formatSuiAmount } from "@/utils/web2";

interface BIDFormProps {
  nft: MediaRecord;
  setOpen?: (open: boolean) => void;
  fetchListingDetails?: () => Promise<void>;
  userStake?: {
    hasStaked: boolean;
    stakeAmount: number;
  };
  highestBid?: bigint;
}

export const BidForm = ({
  nft,
  setOpen,
  fetchListingDetails,
  userStake,
  highestBid,
}: BIDFormProps) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidding, setBidding] = useState<boolean>(false);
  const [staking, setStaking] = useState<boolean>(false);
  const [minimumBid, setMinimumBid] = useState<number>(
    Number(formatSuiAmount(Number(highestBid))) || 0
  );

  const wallet = useWallet();
  const { address, signAndExecuteTransaction } = wallet;

  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBidAmount(e.target.value);
  };

  // Handle bid placement
  const handlePlaceBid = async () => {
    if (
      !address ||
      !nft.blockchain.listingId ||
      !bidAmount ||
      parseFloat(bidAmount) <= 0
    ) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    if (parseFloat(bidAmount) < minimumBid) {
      toast.error(`Please enter a bid higher than ${minimumBid} SUI`);
      return;
    }

    try {
      setBidding(true);

      const bidAmountMist = BigInt(
        Math.floor(parseFloat(bidAmount) * 1_000_000_000)
      );

      const provider = client;

      // STEP 1: Prepare & Build Transaction (check if coin split is needed)
      const prepResult = await prepareAndBuildBidTransaction(
        provider,
        address,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        bidAmountMist,
        PACKAGE_ID,
        MODULE_NAME
      );

      // If preparation is needed, sign and execute preparation tx
      if (prepResult.preparationNeeded) {
        toast.info("Preparing coins to place bid...");
        const prepTxResult = await signAndExecuteTransaction({
          transaction: prepResult.transaction,
        });

        if (!prepTxResult) {
          toast.error("Coin preparation failed.");
          return;
        }

        // Give time for blockchain state to update
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // STEP 2: Now build the actual bid transaction (again, to get updated coin state)
      const bidResult = await prepareAndBuildBidTransaction(
        provider,
        address,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        bidAmountMist,
        PACKAGE_ID,
        MODULE_NAME
      );

      if (!bidResult.success) {
        toast.error(bidResult.message || "Failed to build bid transaction");
        return;
      }

      // STEP 3: Execute the bid transaction
      const result = await signAndExecuteTransaction({
        transaction: bidResult.transaction,
      });

      console.log(result);
      if (result) {
        setBidAmount("");
        fetchListingDetails?.();
        setOpen?.(false);
        toast.success("Bid placed successfully!");
      }
    } catch (error: any) {
      console.error("Error placing bid:", error);
      toast.error("Failed to place bid. Please try again.");
    } finally {
      setBidding(false);
    }
  };

  // Handle stake placement
  const handlePlaceStake = async () => {
    if (
      !address ||
      !nft.blockchain.listingId ||
      !bidAmount ||
      parseFloat(bidAmount) <= 0
    ) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    try {
      setStaking(true);

      const stakeAmountMist = BigInt(
        Math.floor(parseFloat(bidAmount) * 1_000_000_000)
      );

      const provider = client;

      // STEP 1: Prepare & Build Transaction (check if coin split is needed)
      const prepResult = await prepareAndBuildStakeTransaction(
        provider,
        address,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        stakeAmountMist,
        PACKAGE_ID,
        MODULE_NAME
      );

      // If preparation is needed, sign and execute preparation tx
      if (prepResult.preparationNeeded) {
        toast.info("Preparing coins to place stake...");
        const prepTxResult = await signAndExecuteTransaction({
          transaction: prepResult.transaction,
        });

        if (!prepTxResult) {
          toast.error("Coin preparation failed.");
          return;
        }

        // Give time for blockchain state to update
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // STEP 2: Now build the actual stake transaction (again, to get updated coin state)
      const stakeResult = await prepareAndBuildStakeTransaction(
        provider,
        address,
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        stakeAmountMist,
        PACKAGE_ID,
        MODULE_NAME
      );

      if (!stakeResult.success) {
        toast.error(stakeResult.message || "Failed to build stake transaction");
        return;
      }

      // STEP 3: Execute the stake transaction
      const result = await signAndExecuteTransaction({
        transaction: stakeResult.transaction,
      });

      console.log(result);
      if (result) {
        setBidAmount(""); // Clear the input field after successful stake
        fetchListingDetails?.(); // Refresh the listing details
        setOpen?.(false); // Close the modal (if applicable)
        toast.success("Stake placed successfully!");
      }
    } catch (error: any) {
      console.error("Error placing stake:", error);
      toast.error("Failed to place stake. Please try again.");
    } finally {
      setStaking(false);
    }
  };

  console.log(minimumBid);
  return (
    <div className="space-y-4">
      {/* Bid input */}
      <div className="flex items-center gap-2 border border-stone-300  p-4">
        <input
          type="number"
          className="flex-1 bg-transparent outline-none h-full rounded-none"
          placeholder="0.0"
          value={bidAmount}
          onChange={handleBidAmountChange}
          disabled={bidding || staking}
        />
        <span className="text-lg font-medium">SUI</span>
      </div>
      

      <div className="w-full flex gap-2">
        <Button
          className="w-[49%] py-6 text-lg rounded-none"
          size="lg"
          onClick={handlePlaceBid}
          disabled={bidding || staking || !address || !bidAmount}
        >
          {bidding ? "Bidding..." : "Place a Bid"}
        </Button>
        {/* {userStake && !userStake.hasStaked && ( */}
        <Button
          className="w-[49%] py-6 text-lg border text-primary rounded-none"
          size="lg"
          onClick={handlePlaceStake}
          variant="outline"
          disabled={bidding || staking || !address || !bidAmount}
        >
          {staking ? "Staking..." : "Stake"}
        </Button>
        {/* )} */}
      </div>

      {/* {debugInfo && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono overflow-auto max-h-32">
          {debugInfo}
        </div>
      )} */}
    </div>
  );
};
