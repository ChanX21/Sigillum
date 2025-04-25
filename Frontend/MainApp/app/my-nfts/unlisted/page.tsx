'use client'

import { NFTCardBrowse } from '@/components/nft/NFTCardBrowse';
import { Footer } from '@/components/shared/Footer';
import { Header } from '@/components/shared/Header';
import { useGetMyNfts } from '@/hooks/useGetMyNfts';
import { MediaRecord } from '@/types';
import { useWallet } from '@suiet/wallet-kit';
import { Wallet } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import React, { useEffect, useState } from 'react'
import { emit } from 'process';

const UnlistedNfts = () => {
    const { connected, address } = useWallet()
    const [filteredNfts, setFilteredNfts] = useState<Array<MediaRecord>>()
    const { data, isLoading } = useGetMyNfts(address ?? "", {
        enabled: !!address
    });
    useEffect(() => {
        if (data) {
            console.log(data)
            setFilteredNfts(data)
        }
    }, [data])

    const filterNft = (filterType: string) => {
        const source = data ?? [];
    const filtered = filterType === 'all' ? source : source.filter(nft => nft.status === filterType);
    setFilteredNfts(filtered);
    }

    return (
        <div>
            <Header />
            <div className={`md:px-10 px-1 md:mt-32 min-h-screen pb-5 ${isLoading && 'flex justify-center items-center'}`}>
                {connected ? (
                    <>
                        {isLoading ? (
                            <>
                                <div className="relative w-10 h-10 rounded-full">
                                    <div className="absolute inset-0 border-2 border-[#fff]  border-t-[#1b263b] rounded-full animate-spin m-0.5"></div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mx-10 mt-10 md:mt-0 md:mx-0 flex justify-between items-center ">
                                    <h2 className='text-3xl font-semibold'>All Nft's</h2>
                                    <Select defaultValue='all' onValueChange={(value) => filterNft(value)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="All" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="soft-listed">Unlisted</SelectItem>
                                            <SelectItem value="listed">Listed</SelectItem>
                                        </SelectContent>
                                    </Select>

                                </div>
                                <div className="flex justify-center items-center mt-5">
                                    <div className='grid md:grid-cols-4 grid-cols-1 gap-x-10 gap-y-5 justify-items-center'>
                                        {filteredNfts?.map((nft: MediaRecord, index: number) => (
                                            <div key={index} className="snap-start">
                                                <NFTCardBrowse nft={nft} idx={index} status={nft.status} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>

                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted text-primary">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Wallet not connected</h2>
                            <p className="text-sm text-muted-foreground">
                                Connect your wallet to view and manage your assets.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}

export default UnlistedNfts