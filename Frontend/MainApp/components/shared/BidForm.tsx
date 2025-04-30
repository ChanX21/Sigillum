import { Button } from "../ui/button";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { useEffect, useState } from "react";
import {
  getListingIds,
  buildPlaceBidTxWithCoinSelection,
  buildPlaceStakeTxWithCoinSelection,
} from "@/utils/blockchainServices";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import { ListingDataResponse, MediaRecord } from "@/types";

interface BIDFormProps {
  nft: MediaRecord;
  setOpen?: (open: boolean) => void;
}

export const BidForm = ({ nft, setOpen }: BIDFormProps) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidding, setBidding] = useState<boolean>(false);
  const [staking, setStaking] = useState<boolean>(false);
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

    try {
      setBidding(true);

      // Log information for debugging
      console.log("Placing bid with:", {
        address,
        listingId: nft.blockchain.listingId,
        marketplaceId: MARKETPLACE_ID,
        packageId: PACKAGE_ID,
        moduleName: MODULE_NAME,
      });

      // Convert bid amount to MIST (1 SUI = 10^9 MIST)
      const bidAmountMist = BigInt(
        Math.floor(parseFloat(bidAmount) * 1_000_000_000)
      );

      // Create a SuiClient instance
      const provider = new SuiClient({ url: getFullnodeUrl("testnet") });

      // Use the new helper function to build the transaction
      const { transaction, success, error } =
        await buildPlaceBidTxWithCoinSelection(
          provider,
          address,
          MARKETPLACE_ID,
          nft.blockchain.listingId,
          bidAmountMist,
          PACKAGE_ID,
          MODULE_NAME
        );

      if (!success) {
        toast.error(error || "Failed to build transaction");
        return;
      }

      // Execute the transaction
      try {
        const result = await signAndExecuteTransaction({
          transaction,
        });

        console.log(result);

        if (result) {
          setBidAmount("");
          setOpen?.(false);
          toast.success("Bid placed successfully!");
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
            "Failed to place bid: The listing may not exist or you don't have permission to bid on it."
          );
        } else if (errorMessage.includes("Dry run failed")) {
          toast.error(
            "Failed to place bid: Transaction simulation failed. The listing may not be active."
          );
        } else {
          toast.error(
            `Failed to place bid: ${errorMessage.substring(0, 100)}...`
          );
        }
        return;
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

      // Log information for debugging
      console.log("Placing stake with:", {
        address,
        listingId: nft.blockchain.listingId,
        marketplaceId: MARKETPLACE_ID,
        packageId: PACKAGE_ID,
        moduleName: MODULE_NAME,
      });

      // Convert stake amount to MIST (1 SUI = 10^9 MIST)
      const stakeAmountMist = BigInt(
        Math.floor(parseFloat(bidAmount) * 1_000_000_000)
      );

      // Create a SuiClient instance
      const provider = new SuiClient({ url: getFullnodeUrl("testnet") });

      // Use the new helper function to build the transaction
      const { transaction, success, error } =
        await buildPlaceStakeTxWithCoinSelection(
          provider,
          address,
          MARKETPLACE_ID,
          nft.blockchain.listingId,
          stakeAmountMist,
          PACKAGE_ID,
          MODULE_NAME
        );

      if (!success) {
        toast.error(error || "Failed to build transaction");
        return;
      }

      // Execute the transaction
      try {
        const result = await signAndExecuteTransaction({
          transaction,
        });

        console.log(result);

        if (result) {
          setBidAmount("");
          setOpen?.(false);
          toast.success("Stake placed successfully!");
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
            "Failed to place stake: The listing may not exist or you don't have permission to stake on it."
          );
        } else if (errorMessage.includes("Dry run failed")) {
          toast.error(
            "Failed to place stake: Transaction simulation failed. The listing may not be active."
          );
        } else {
          toast.error(
            `Failed to place stake: ${errorMessage.substring(0, 100)}...`
          );
        }
        return;
      }
    } catch (error: any) {
      console.error("Error placing stake:", error);
      toast.error("Failed to place stake. Please try again.");
    } finally {
      setStaking(false);
    }
  };

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
        <Button
          className="w-[49%] py-6 text-lg border text-primary rounded-none"
          size="lg"
          onClick={handlePlaceStake}
          variant="outline"
          disabled={bidding || staking || !address || !bidAmount}
        >
          {staking ? "Staking..." : "Stake"}
        </Button>
      </div>

      {/* {debugInfo && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono overflow-auto max-h-32">
          {debugInfo}
        </div>
      )} */}
    </div>
  );
};
