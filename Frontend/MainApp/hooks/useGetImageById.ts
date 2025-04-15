// hooks/useGetData.ts
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export function useGetImageById(id: string) {
  return useQuery({
    queryKey: ["authenticated-image", id],
    queryFn: () => axiosInstance.get(`/${id}`).then((res) => res.data),
  });
}
