import axiosInstance from "@/lib/axios"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useGetProfile = () => {
    return useQuery({
        queryKey: ['get-profile'],
        queryFn: () => {
            return axiosInstance.get('/profile', {
                withCredentials: true
            })
        }
    })
}

export const useUpdateProfile = () => {
    return useMutation({
        mutationKey: ['update-profile'],
        mutationFn: (name: string) => {
            return axiosInstance.post('/profile', {
                name
            }, {
                withCredentials: true
            })
        }
    })
}