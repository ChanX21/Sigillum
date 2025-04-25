import axiosInstance from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useUpdateNftDets() {
    return useMutation({
        mutationKey: ['nft-det-update'],
        mutationFn: ({ nftId }: { nftId: string }) => {
            return axiosInstance.post(`/status-update/${nftId}`)
                .then((res) => res.data)
                .catch((error) => {
                    const axiosErr = error as AxiosError<{ message?: string }>;
                    const message =
                        axiosErr.response?.data?.message || axiosErr.message || "Upload failed";
                    throw new Error(message);
                })
        }
    })
}