// hooks/useGetData.ts
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { MediaRecord } from "@/types";

import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { getObjectDetails } from "@/utils/blockchainServices";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { ListingDataResponse } from "@/types";

export function useGetMyNfts(
  owner: string,
  options?: Omit<UseQueryOptions<MediaRecord[], Error>, "queryKey" | "queryFn">
) {
  return useQuery<MediaRecord[], Error>({
    queryKey: ["unlisted-nfts", owner],
    queryFn: async ({ queryKey }) => {
      const [_, owner] = queryKey;
      const provider = new SuiClient({ url: getFullnodeUrl("testnet") });

      // First get all NFTs from backend
      const response = await axiosInstance.get("/all");
      const allNfts = response.data;

      // First filter: NFTs where user is the owner
      const userOwnedNfts = allNfts.filter(
        (nft: MediaRecord) => nft.user.walletAddress === owner
      );

      // Second filter: NFTs where listing owner matches
      const listingOwnedNfts = await Promise.all(
        allNfts.map(async (nft: MediaRecord) => {
          if (!nft.blockchain.listingId) return null;

          const listingId = nft.blockchain.listingId as string;
          const details = (await getObjectDetails(
            provider,
            PACKAGE_ID,
            MODULE_NAME,
            MARKETPLACE_ID,
            listingId,
            owner as string
          )) as ListingDataResponse | null;

          if (
            details &&
            typeof details.owner === "string" &&
            details.owner === owner
          ) {
            return nft;
          }
          return null;
        })
      );

      // Combine both sets of NFTs while removing duplicates using token ID
      const combinedNfts = [...userOwnedNfts, ...listingOwnedNfts]
        .filter((nft): nft is MediaRecord => nft !== null)
        .reduce((uniqueNfts: MediaRecord[], nft) => {
          if (
            !uniqueNfts.some(
              (existing) =>
                existing.blockchain.tokenId === nft.blockchain.tokenId
            )
          ) {
            uniqueNfts.push(nft);
          }
          return uniqueNfts;
        }, []);

      // Return the combined and unique NFTs
      return combinedNfts;
    },
    ...options,
  });
}
