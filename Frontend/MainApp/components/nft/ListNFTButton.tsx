'use client'

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from '@suiet/wallet-kit';
import React, { useState } from 'react';

import { useUpdateNftDets } from '@/hooks/useUpdateNftDets';
import { MARKETPLACE_ID, MODULE_NAME, PACKAGE_ID } from '@/lib/suiConfig';
import { listNft } from '@/utils/blockchainServices';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, DollarSign, List, RefreshCcw, Rocket } from 'lucide-react';

const ListNFTButton = ({ listingId, tokenId, nftId }: { listingId: string, tokenId: string, nftId: string }) => {
    const [listPrice, setlistPrice] = useState<string>('')
    const { signAndExecuteTransaction, address } = useWallet()
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false); // Loading state
    const { mutate: updateNftDet } = useUpdateNftDets()
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleListing = async () => {
        const price = Math.floor(parseFloat(listPrice) * 10 ** 9)
        if (!isNaN(price) && address) {
            setLoading(true)
            const { transaction } = await listNft(listingId, price, PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID, tokenId)

            try {
                const result = await signAndExecuteTransaction({
                    transaction: transaction,
                });

                if (result) {
                    toast.success("Nft Listed Successfully!");
                    updateNftDet({ nftId })
                    queryClient.invalidateQueries({ queryKey: ['unlisted-nfts'], exact: false })
                    setLoading(false);
                    setDialogOpen(false) 
                }
            } catch (txError: any) {
                console.error("Transaction execution error:", txError);
                toast.error("Transaction execution error")
            }
        } else {
            toast.error("Please enter a valid price");
            setLoading(false);
        }
    }

    return (
        <Dialog open={dialogOpen}>
            <DialogTrigger asChild className='border-t' onClick={() => setDialogOpen(true)}>
                <Button
                    variant="default"
                    className="flex rounded-none flex-col items-center py-5 bg-black text-white hover:text-white text-xs"
                >
                    New Listing
                </Button>
            </DialogTrigger>
            {!loading ? (
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
            ) : (
                <DialogContent className="sm:max-w-md">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-t-[#1b263b] border-[#f1f3f5] rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Rocket />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold mt-6 mb-2">NFT Listing in Progress</h3>
                            <p className="text-[#616161] text-center">We are currently listing your NFT for sale. This may take a moment.</p>
                        </motion.div>
                    </AnimatePresence>
                </DialogContent>
            )}
        </Dialog>
    )
}

export default ListNFTButton