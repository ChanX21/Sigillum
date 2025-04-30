// hooks/useGetData.ts
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { MediaRecord } from "@/types";

export function useGetMyNfts(creator: string, options?: Omit<UseQueryOptions<MediaRecord[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery<MediaRecord[], Error>({
        queryKey: ["unlisted-nfts", creator],
        queryFn: ({ queryKey }) => {
            const [_, creator] = queryKey;
            return axiosInstance.get("/all").then((res) => {
                const filteredNfts = res.data.filter((nft: MediaRecord) => nft.user.walletAddress === creator)
                return filteredNfts
            })
        },
        ...options
    });
}
