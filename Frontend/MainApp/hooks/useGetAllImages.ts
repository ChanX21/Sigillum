// hooks/useGetData.ts
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui/client";
import { getObjectDetails } from "@/utils/blockchainServices";
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_ID } from "@/lib/suiConfig";
import { ListingDataResponse, MediaRecord } from "@/types";
import { client } from "@/lib/suiClient";

export async function getActiveNfts(owner: string): Promise<MediaRecord[]> {
  const provider = client; //new SuiClient({ url: getFullnodeUrl("testnet") });

  // First get all NFTs from backend
  const response = await axiosInstance.get("/all");
  const allNfts = response.data;

  // Filter for active listings
  const activeNfts = await Promise.all(
    allNfts.map(async (nft: MediaRecord) => {
      if (!nft.blockchain.listingId) return null;

      const listingId = nft.blockchain.listingId as string;
      const details = (await getObjectDetails(
        provider,
        PACKAGE_ID,
        MODULE_NAME,
        MARKETPLACE_ID,
        listingId,
        owner
      )) as ListingDataResponse | null;

      if (details && details.active) {
        return nft;
      }
      return null;
    })
  );

  // Filter out null values
  return activeNfts.filter((nft): nft is MediaRecord => nft !== null);
}

export function useGetAllImages(
  isActiveOnly: boolean = true,
  owner?: string,
  options?: Omit<UseQueryOptions<MediaRecord[], Error>, "queryKey" | "queryFn">
) {
  return useQuery<MediaRecord[], Error>({
    queryKey: ["nfts", { isActiveOnly, owner }],
    queryFn: async () => {
      // if (isActiveOnly && owner) {
      //   return getActiveNfts(owner);
      // }
      const response = await axiosInstance.get("/all");
      return response.data;
    },
    ...options,
  });
}
