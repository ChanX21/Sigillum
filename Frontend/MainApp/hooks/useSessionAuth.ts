import axiosInstance from "@/lib/axios";
import { MediaRecord } from "@/types";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const useGetNonce = (address: string) => {
    return useQuery({
        queryKey: ["get-nonce", address],
        queryFn: ({ queryKey }) => {
            const [_, address] = queryKey;
            return axiosInstance.get(`/nonce/${address}`).then((res) => res.data)
        },
    });
}

export const useCreateSession = () => {
    return useMutation({
        mutationKey: ['create-session'],
        mutationFn: ({ address, message, signature }: { address: string, message: string, signature: string }) => {
            return axiosInstance.post(`/session`, {
                address,
                signature,
                message
            }, {
                withCredentials: true
            })
            .then((res) => {
                console.log("Session",res)
            })
            .catch((error) => {
                console.log(error)
                const axiosErr = error as AxiosError<{ message?: string }>;
                const message =
                    axiosErr.response?.data?.message || axiosErr.message || "Upload failed";
                throw new Error(message);
            })
        }
    })
}