// hooks/useGetData.ts
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export function useGetAllImages() {
  return useQuery({
    queryKey: ["authenticated-images"],
    queryFn: () => axiosInstance.get("/all").then((res) => res.data),
  });
}
