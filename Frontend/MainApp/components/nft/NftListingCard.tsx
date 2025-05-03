import { MediaRecord, NFTMetadata } from "@/types";
import { fetchMetadata } from "@/utils/web2";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { UserAvatar } from "../shared/UserAvatar";
import { shortenAddress } from "@/utils/shortenAddress";
import OptimizedImage from "../shared/OptimizedImage";
import { useWallet } from "@suiet/wallet-kit";

import ListNFTButton from "./ListNFTButton";
import { Button } from "../ui/button";


interface NFTCardBrowseProps {
    nft: MediaRecord;
    idx: number;
    status?: string;
}

export const NftListingCard = ({
    nft,
    idx,
    status,
}: NFTCardBrowseProps) => {
    const [metadata, setMetadata] = useState<NFTMetadata | null>(null);

    const wallet = useWallet();


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchMetadata(
                    `${process.env.NEXT_PUBLIC_PINATA_URL}${nft.metadataCID}`
                );

                setMetadata(response);
            } catch (error) {
                console.error("Error fetching metadata:", error);
            }
        };

        if (nft?.metadataCID) {
            fetchData();
        }
    }, [nft]);



    return (
        <div
            className={`w-[320px] bg-white border-2  overflow-hidden flex flex-col`}
        >
            <div className="relative w-full aspect-square">
                <Link href={`/detail/${nft._id}`}>

                    <OptimizedImage
                        alt={metadata?.name || ""}
                        src={metadata?.image || "/fallback.png"}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        fill
                        className="object-cover rounded-none"
                    />
                </Link>
            </div>
            <div className={`flex flex-col items-center py-4  bg-white`}>
                <div className="flex items-center gap-2 mb-2">
                    <UserAvatar
                        walletAddress={nft.user.walletAddress}
                        alt={nft.user.walletAddress || "Creator"}
                    />
                    <span className={`text-xs  text-gray-800`}>
                        {" "}
                        {nft.user.name || shortenAddress(nft.user.walletAddress) || ""}
                    </span>
                </div>
                <Link href={`/detail/${nft._id}`}>
                    <h3 className={`text-lg font-bold text-center text-primary`}>
                        {metadata?.name || ""}
                    </h3>
                </Link>
            </div>

            {status === 'soft-listed' && (
                <ListNFTButton listingId={nft?.blockchain?.listingId} tokenId={nft?.blockchain?.tokenId} nftId={nft._id} />
            )}
            {status !== 'soft-listed' && (
                <Button
                    variant="default"
                    disabled
                    className="flex rounded-none flex-col items-center py-5 bg-black text-white hover:text-white text-xs"
                >
                    Listed
                </Button>
            )}

        </div>
    );
};

export default NftListingCard;
