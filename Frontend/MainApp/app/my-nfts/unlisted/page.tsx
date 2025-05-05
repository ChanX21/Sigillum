'use client'

import { Footer } from '@/components/shared/Footer';
import { Header } from '@/components/shared/Header';
import { useGetMyNfts } from '@/hooks/useGetMyNfts';
import { MediaRecord } from '@/types';
import { useWallet } from '@suiet/wallet-kit';
import { LayoutGrid, Plus, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NftListingCard from '@/components/nft/NftListingCard';

const UnlistedNfts = () => {
    const { connected, address } = useWallet()
    const [filteredNfts, setFilteredNfts] = useState<Array<MediaRecord>>()
    const [filterType, setFilterType] = useState<string>()
    const { data, isLoading } = useGetMyNfts(address ?? "", {
        enabled: !!address
    });
    useEffect(() => {
        if (data) {
            setFilteredNfts(data)
            if (filterType) {
                filterNft(filterType as string)
            }
        }
    }, [data])

    const filterNft = (filterType: string) => {

        const source = data ?? [];
        setFilterType(filterType)

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
                            <Tabs defaultValue="all" className="w-full md:mt-0 mt-20 px-4 md:px-0" onValueChange={(value) => filterNft(value)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h2 className='text-3xl'>Your Nft's</h2>
                                    </div>
                                    <TabsList className='cursor-pointer'>
                                        <TabsTrigger value="all" className='cursor-pointer'>All NFTs</TabsTrigger>
                                        <TabsTrigger value="soft-listed" className='cursor-pointer'>Unlisted</TabsTrigger>
                                        <TabsTrigger value="listed" className='cursor-pointer'>Listed</TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="all" className="mt-6">
                                    {filteredNfts && filteredNfts.length != 0 ? (
                                        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                            <div className='grid md:grid-cols-4 grid-cols-1 gap-x-10 gap-y-5 justify-items-center'>
                                                {filteredNfts?.map((nft: MediaRecord, index: number) => (
                                                    <div key={index} className="snap-start">
                                                        <NftListingCard nft={nft} idx={index} status={nft.status} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                                <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                            <h2 className="mt-6 text-2xl font-semibold">No Secured Image Found</h2>
                                            <p className="mt-2 max-w-md text-muted-foreground">
                                                There are no secured images available in this collection. Secure your image or explore other collections.
                                            </p>
                                            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                                                <Link href={'/secure'}>
                                                    <Button >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Secure Image
                                                    </Button>
                                                </Link>
                                                <Link href={'/marketplace'}>

                                                    <Button variant="outline" asChild>
                                                        Explore Collections
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                    )}
                                </TabsContent>
                                <TabsContent value="soft-listed" className="mt-6">
                                    {filteredNfts && filteredNfts.length != 0 ? (
                                        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                            <div className='grid md:grid-cols-4 grid-cols-1 gap-x-10 gap-y-5 justify-items-center'>
                                                {filteredNfts?.map((nft: MediaRecord, index: number) => (
                                                    <div key={index} className="snap-start">
                                                        <NftListingCard nft={nft} idx={index} status={nft.status} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                                <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                            <h2 className="mt-6 text-2xl font-semibold">No Unlisted NFTs</h2>
                                            <p className="mt-2 max-w-md text-muted-foreground">
                                                There are no unlisted nfts
                                            </p>
                                            <div className="mt-6">
                                                <Link href={'/marketplace'}>
                                                    <Button variant="outline" asChild>
                                                        <Link href="#">Browse Marketplace</Link>
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="listed" className="mt-6">
                                    {filteredNfts && filteredNfts.length != 0 ? (
                                        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                            <div className='grid md:grid-cols-4 grid-cols-1 gap-x-10 gap-y-5 justify-items-center'>
                                                {filteredNfts?.map((nft: MediaRecord, index: number) => (
                                                    <div key={index} className="snap-start">
                                                        <NftListingCard nft={nft} idx={index} status={nft.status} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                                <LayoutGrid className="h-10 w-10 text-muted-foreground" />
                                            </div>
                                            <h2 className="mt-6 text-2xl font-semibold">No secured image found</h2>
                                            <p className="mt-2 max-w-md text-muted-foreground">
                                                You haven't secured any image yet. Start securing your unique digital assets.
                                            </p>
                                            <div className="mt-6">
                                                <Link href={'/secure'}>
                                                    <Button>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Create NFT
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
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