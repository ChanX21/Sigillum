import { Button } from "../ui/button";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { useState, useEffect } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import { MediaRecord } from "@/types";
import { DateTimePicker } from "./DateTimePicker";
import { buildRelistNftTx } from "@/utils/blockchainServices";
import { Input } from "../ui/input";

interface RelistFormProps {
  nft: MediaRecord;
  setOpen: (open: boolean) => void;
}

export const RelistForm = ({ nft, setOpen }: RelistFormProps) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(0);
  const [minBid, setMinBid] = useState<number>(0);

  // Calculate default end time in the same way as DateTimePicker
  const calculateDefaultEndTime = (): number => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // 1 day from now
    // Round to nearest minute to avoid second/millisecond discrepancies
    date.setSeconds(0, 0);
    return date.getTime();
  };

  // Initialize endTime to 1 day from now
  const [endTime, setEndTime] = useState<number>(calculateDefaultEndTime());

  // Log initial endTime for debugging
  useEffect(() => {
    console.log("RelistForm initial endTime:", endTime);
    console.log(
      "RelistForm formatted date:",
      new Date(endTime).toLocaleString()
    );
  }, []);

  const wallet = useWallet();
  const { address, signAndExecuteTransaction } = wallet;

  // This function will receive the timestamp in milliseconds from DateTimePicker
  const handleEndTimeChange = (timestamp: number) => {
    console.log(
      "Received endTime from DateTimePicker:",
      timestamp,
      new Date(timestamp).toLocaleString()
    );
    setEndTime(timestamp);
  };

  const priceMist = BigInt(
    Math.floor(parseFloat(price.toString()) * 1_000_000_000)
  );

  const minBidMist = BigInt(
    Math.floor(parseFloat(minBid.toString()) * 1_000_000_000)
  );

  const handleRelistNft = async () => {
    if (!address || !nft.blockchain.listingId || !nft.blockchain.tokenId) {
      toast.error("Missing required NFT information");
      return;
    }

    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price greater than 0");
      return;
    }

    if (isNaN(minBid) || minBid <= 0) {
      toast.error("Please enter a valid minimum bid greater than 0");
      return;
    }

    if (endTime <= Date.now()) {
      toast.error("End time must be in the future");
      return;
    }

    try {
      setSubmitting(true);

      // Log information for debugging
      console.log("Relisting NFT with:", {
        address,
        listingId: nft.blockchain.listingId,
        nftId: nft.blockchain.tokenId,
        newPrice: priceMist,
        newMinBid: minBidMist,
        endTime,
        endTimeFormatted: new Date(endTime).toLocaleString(),
        marketplaceId: MARKETPLACE_ID,
        packageId: PACKAGE_ID,
        moduleName: MODULE_NAME,
      });

      // Build the transaction
      const tx = await buildRelistNftTx(
        MARKETPLACE_ID,
        nft.blockchain.listingId,
        nft.blockchain.tokenId,
        Number(priceMist),
        Number(minBidMist),
        endTime,
        PACKAGE_ID,
        MODULE_NAME
      );

      // Execute the transaction
      try {
        const result = await signAndExecuteTransaction({
          transaction: tx,
        });

        console.log("Transaction result:", result);

        if (result) {
          toast.success("NFT relisted successfully!");
          setOpen(false); // Close the modal after successful relisting
        }
      } catch (txError: any) {
        console.error("Transaction execution error:", txError);

        // Extract more detailed error information
        const errorMessage = txError?.message || "Unknown error";

        if (errorMessage.includes("ENotOwner")) {
          toast.error("Failed to relist: You are not the owner of this NFT.");
        } else if (errorMessage.includes("EListingNotActive")) {
          toast.error(
            "Failed to relist: The listing is not active or doesn't exist."
          );
        } else if (errorMessage.includes("EInvalidListing")) {
          toast.error("Failed to relist: Invalid listing ID or NFT ID.");
        } else {
          toast.error(`Failed to relist: ${errorMessage.substring(0, 100)}...`);
        }
        return;
      }
    } catch (error: any) {
      console.error("Error relisting NFT:", error);
      toast.error("Failed to relist NFT. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="">
      {/* Pass the handleEndTimeChange function to DateTimePicker */}
      <DateTimePicker onEndTimeChange={handleEndTimeChange} initialDays={1} />

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">New Listing Price</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            className="bg-transparent border-primary rounded-none"
            placeholder="Enter new price"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">New Minimum Bid</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={minBid}
            onChange={(e) => setMinBid(parseFloat(e.target.value))}
            className="bg-transparent border-primary rounded-none"
            placeholder="Enter new minimum bid"
          />
          <p className="text-xs text-gray-500">
            Recommended: Set to at least 80% of your listing price
          </p>
        </div>
      </div>

      <Button
        className="w-full py-6 text-lg rounded-none bg-transparent border-primary border text-primary hover:text-white"
        size="lg"
        onClick={handleRelistNft}
        disabled={submitting || !address}
      >
        {submitting ? "Processing..." : "Relist NFT"}
      </Button>
    </div>
  );
};
