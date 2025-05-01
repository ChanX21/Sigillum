// hooks/useGetData.ts
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { useImageAuthStore } from "../store/useImageAuthStore";
import { AxiosError } from "axios";

export function useAuthenticateImage() {
    const setResult = useImageAuthStore((s) => s.setResult);
    const setError = useImageAuthStore((s) => s.setError);
    return useMutation({
        mutationKey: ["authenticate-image"],
        mutationFn: ({ image, name, description }: { image: File, name: string, description: string }) => {
            const formData = new FormData();
            formData.append("image", image);
            formData.append('metadata', JSON.stringify({ name, description }));

            return axiosInstance
                .post(`/authenticate`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true
                })
                .then((res) => res.data)
                .catch((error) => {
                    const axiosErr = error as AxiosError<{ message?: string }>;
                    const message =
                        axiosErr.response?.data?.message || axiosErr.message || "Upload failed";
                    throw new Error(message);
                })
        },
        onSuccess: (data) => {
            setResult(data); // Store in Zustand
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || "Unknown error";
            setError(errorMessage);
        },
    });
}

