'use client'

import { useGetAllImages } from '@/hooks/useGetAllImages';
import { MediaRecord, NFTMetadata } from '@/types';
import Link from 'next/link'
import Fuse from 'fuse.js'
import React, { useEffect, useMemo, useState } from 'react'
import { fetchMetadata } from '@/utils/web2';
import { shortenAddress } from '@/utils/shortenAddress';
import { Loader2, SearchIcon } from 'lucide-react';


interface MappedImage extends MediaRecord {
    title: string;
    metadata: NFTMetadata | null
}

export default function NftSearch({ query }: { query: string }) {
    const { data: images, isLoading: imagesLoading } = useGetAllImages(true);
    const [mappedImages, setMappedImages] = useState<MappedImage[]>([]);
    const [searching, setSearching] = useState(false);
    const [filtered, setFiltered] = useState<MappedImage[]>([]);
    useEffect(() => {
        console.log(filtered)
    }, [filtered])
    // Fetch metadata only once when images are ready
    useEffect(() => {
        if (!images || images.length === 0) return;

        const fetchAllMetadata = async () => {
            setSearching(true)
            const results = await Promise.all(
                images.map(async (img: MediaRecord) => {
                    try {
                        const metadata = await fetchMetadata(
                            `${process.env.NEXT_PUBLIC_PINATA_URL}${img.metadataCID}`
                        );
                        return {
                            ...img,
                            title: metadata?.name || "Untitled",
                            metadata,
                        };
                    } catch (err) {
                        return { ...img, title: "Unknown", metadata: null };
                    }
                })
            );
            setMappedImages(results);
            setSearching(false)
        };

        fetchAllMetadata();
    }, [images]);

    // Memoize Fuse instance
    const fuse = useMemo(() => {
        return new Fuse(mappedImages, {
            keys: ["title"],
            threshold: 0.3, // lower = stricter
        });
    }, [mappedImages]);

    // Efficient debounce search
    useEffect(() => {
        setSearching(true);
        const timeout = setTimeout(() => {
            if (!query.trim()) {
                setFiltered([]);
            } else {
                const results = fuse.search(query).map((r) => r.item);
                setFiltered(results);
            }
            setSearching(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [query, fuse, mappedImages]);

    return searching || mappedImages.length === 0 ? (
        <div className='w-full h-full flex justify-center items-center'>
            <Loader2 className='animate-spin w-10 h-10' />
        </div>
    ) : (
        <>
            {filtered && filtered.length !== 0 ? filtered.map((image) => (
                <Link href={`/detail/${image._id}`} key={image._id}>
                    <div
                        className="flex items-center gap-4 p-2 hover:bg-gray-100 rounded-xl cursor-pointer"
                    >
                        <img
                            src={`${image.metadata?.image}` || "/fallback.png"}
                            alt={image.title}
                            className="w-12 h-12 rounded-md object-cover"
                        />
                        <div className="flex flex-col">
                            <span className="font-medium text-xl text-gray-900">{image.title}</span>
                            <span className="text-xs text-gray-500">@{image.user.name ? image.user.name : shortenAddress(image.user.walletAddress)}</span>
                        </div>
                    </div>
                </Link>
            )) : (
                <div className="flex flex-col items-center h-full gap-3 justify-center py-16 text-center">
                    <SearchIcon className='w-10 h-10' />
                    <h2 className="text-xl font-semibold text-gray-700">No NFTs Found</h2>
                    <p className="text-sm text-gray-500 mt-1">Try a different search keyword.</p>
                </div>
            )}

        </>
    )
}
