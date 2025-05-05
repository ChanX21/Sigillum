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
import { RelistForm } from "./RelistForm";

export function RelistModal({
  nft,
  listingDetails,
}: {
  nft: MediaRecord;
  listingDetails: ListingDataResponse | null;
}) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery({
    query: "(min-width: 1224px)",
  });

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="flex gap-3 mb-8">
            <Button
              className="w-full py-6 text-lg rounded-none bg-transparent border-primary border text-primary hover:text-white"
              size="lg"
            >
              Relist
            </Button>
          </div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Relist</DialogTitle>
            <DialogDescription>Make your transaction here.</DialogDescription>
          </DialogHeader>
          <RelistForm nft={nft} setOpen={setOpen} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="flex gap-3 mb-8">
          <Button
            className="w-full py-6 text-lg rounded-none bg-transparent border-primary border text-primary hover:text-white"
            size="lg"
          >
            Relist
          </Button>
        </div>
      </DrawerTrigger>

      <DrawerContent className="pb-10">
        <DrawerHeader className="text-left">
          <DrawerTitle>Relist</DrawerTitle>
          <DrawerDescription>Make your transaction here.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <RelistForm nft={nft} setOpen={setOpen} />
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
