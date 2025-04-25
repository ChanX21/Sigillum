'use client'

import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { useWallet } from '@suiet/wallet-kit';

import { useListNft } from '@/hooks/useListNft';
import { MARKETPLACE_ID, MODULE_NAME, PACKAGE_ID } from '@/lib/suiConfig';
import { toast } from 'sonner';
import { useUpdateNftDets } from '@/hooks/useUpdateNftDets';
import { useQueryClient } from '@tanstack/react-query';

const ListNFTButton = ({ listingId, tokenId, nftId }: { listingId: string, tokenId: string, nftId: string }) => {
    const [listPrice, setlistPrice] = useState<string>('')
    const { signTransaction, address } = useWallet()
    const { data, mutate: listNft, isPending, isSuccess, isError, error } = useListNft()
    const queryClient = useQueryClient()
    const { data: nftDetUpdate, mutate: updateNftDet } = useUpdateNftDets()
    const handleListing = async () => {
        const price = parseFloat(listPrice)
        if (!isNaN(price) && address) {
            listNft?.({
                address,
                marketplaceObjectId: MARKETPLACE_ID,
                moduleName: MODULE_NAME,
                packageId: PACKAGE_ID,
                softListingId: listingId,
                listPrice: price,
                nftId: tokenId,
                signTransaction,
            });
        } else {
            alert("Please enter a valid price");
        }
    }

    useEffect(() => {
        if (isSuccess) {
            toast.success("Nft Listed SuccessFully")
            updateNftDet({ nftId })
            queryClient.invalidateQueries({ queryKey: ['unlisted-nfts'], exact: false })
        }
        if (isError) {
            toast.error(error.message)
        }
    }, [isSuccess, isError])
    useEffect(() => {
        console.log(nftDetUpdate)
    }, [nftDetUpdate])
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="rounded-md w-[49%] cursor-pointer border border-primary bg-white"
                >
                    List
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>List NFT for Sale</DialogTitle>
                    <DialogDescription>
                        Enter the price at which you want to list this NFT.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Price (SUI)
                        </Label>
                        <Input
                            id="price"
                            value={listPrice}
                            onChange={(e) => setlistPrice(e.target.value)}
                            placeholder="0.05"
                            className="col-span-3"
                            type="number"
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full" onClick={handleListing}>
                        Confirm Listing
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ListNFTButton