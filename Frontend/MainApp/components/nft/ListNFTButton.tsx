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
import { listNft } from '@/utils/blockchainServices';

const ListNFTButton = ({ listingId, tokenId, nftId }: { listingId: string, tokenId: string, nftId: string }) => {
    const [listPrice, setlistPrice] = useState<string>('')
    const { signAndExecuteTransaction, address } = useWallet()
    // const { data, mutate: listNft, isPending, isSuccess, isError, error } = useListNft()
    const queryClient = useQueryClient()
    const { data: nftDetUpdate, mutate: updateNftDet } = useUpdateNftDets()
    const handleListing = async () => {
        const price = Math.floor(parseFloat(listPrice) * 10 ** 9)
        if (!isNaN(price) && address) {
            const { transaction } = await listNft(listingId, price, PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID, tokenId)

            try {
                const result = await signAndExecuteTransaction({
                    transaction: transaction,
                });

                if (result) {
                    toast.success("Nft Listed Successfully!");
                    updateNftDet({ nftId })
                    queryClient.invalidateQueries({ queryKey: ['unlisted-nfts'], exact: false })
                }
            } catch (txError: any) {
                console.error("Transaction execution error:", txError);
                toast.error("Transaction execution error")
            }
        } else {
            toast.error("Please enter a valid price");
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild className='border-t'>
                <Button
                    variant="default"
                    className="flex rounded-none flex-col items-center py-5 bg-black text-white hover:text-white text-xs"
                >
                    New Listing
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