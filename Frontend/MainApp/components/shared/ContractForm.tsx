import * as React from "react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "react-responsive";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BidForm } from "./BidForm";
import { MediaRecord } from "@/types";
import { ListingDataResponse } from "@/types";
import { useWallet } from "@suiet/wallet-kit";

export function ContractForm({
  nft,
  listingDetails,
}: {
  nft: MediaRecord;
  listingDetails: ListingDataResponse | null;
}) {
  const wallet = useWallet();
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery({
    query: "(min-width: 1224px)",
  });

  const sold =
    !listingDetails?.active &&
    listingDetails?.highestBidder == listingDetails?.owner;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {!sold && (
          <DialogTrigger
            asChild
            disabled={wallet.address !== listingDetails?.owner}
          >
            <div className="flex gap-3 mb-8">
              <Button className="bg-black text-white px-6 py-2 rounded-none hover:bg-gray-800 transition-colors flex-1">
                Place Bid
              </Button>
              <Button className="bg-white border text-primary border-gray-300 px-6 py-2 rounded-none hover:bg-gray-50 transition-colors flex-1">
                Stake
              </Button>
            </div>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transaction</DialogTitle>
            <DialogDescription>Make your transaction here.</DialogDescription>
          </DialogHeader>
          <BidForm
            nft={nft}
            setOpen={setOpen}
            highestBid={listingDetails?.highestBid}
            owner={listingDetails?.owner}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {!sold && (
        <DrawerTrigger asChild>
          <div className="flex gap-3 mb-8">
            <Button className="bg-black text-white px-6 py-2 rounded-none hover:bg-gray-800 transition-colors flex-1">
              Place Bid
            </Button>
            <Button className="bg-white border text-primary border-gray-300 px-6 py-2 rounded-none hover:bg-gray-50 transition-colors flex-1">
              Stake
            </Button>
          </div>
        </DrawerTrigger>
      )}
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Transaction</DrawerTitle>
          <DrawerDescription>Make your transaction here.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <BidForm
            nft={nft}
            setOpen={setOpen}
            highestBid={listingDetails?.highestBid}
            owner={listingDetails?.owner}
          />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
