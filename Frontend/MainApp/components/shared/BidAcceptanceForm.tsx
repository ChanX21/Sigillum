import { Button } from "../ui/button";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { useEffect, useState } from "react";
import { buildAcceptBidTx } from "@/utils/blockchainServices";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import { ListingDataResponse, MediaRecord } from "@/types";

interface BIDFormProps {
  nft: MediaRecord;
}

export const BidAcceptanceForm = ({ nft }: BIDFormProps) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const wallet = useWallet();
  const { address, signAndExecuteTransaction } = wallet;

  const handleAcceptBid = async () => {
    if (!address || !nft.blockchain.listingId) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    try {
      setSubmitting(true);

      // Log information for debugging
      console.log("Placing bid with:", {
        address,
        listingId: nft.blockchain.listingId,
        marketplaceId: MARKETPLACE_ID,
        packageId: PACKAGE_ID,
        moduleName: MODULE_NAME,
      });

      // Use the new helper function to build the transaction
      const tx = await buildAcceptBidTx(
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        PACKAGE_ID,
        MODULE_NAME
      );

      // Execute the transaction
      try {
        const result = await signAndExecuteTransaction({
          transaction: tx,
        });

        console.log(result);

        if (result) {
          toast.success("Bid accepted successfully!");
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
            "Failed to accept bid: The listing may not exist or you don't have permission to bid on it."
          );
        } else if (errorMessage.includes("Dry run failed")) {
          toast.error(
            "Failed to accept bid: Transaction simulation failed. The listing may not be active."
          );
        } else {
          toast.error(
            `Failed to place bid: ${errorMessage.substring(0, 100)}...`
          );
        }
        return;
      }
    } catch (error: any) {
      console.error("Error accepting bid:", error);
      toast.error("Failed to accept bid. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        className="w-full py-6 text-lg rounded-md bg-transparent border-primary border text-primary hover:text-white"
        size="lg"
        onClick={handleAcceptBid}
        disabled={submitting || !address}
      >
        {submitting ? "Processing..." : "Accept Bid"}
      </Button>
    </div>
  );
};
