// hooks/useGetData.ts
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { MediaRecord } from "@/types";

export function useGetImageById(id: string) {
  return useQuery<MediaRecord, Error>({
    queryKey: ["authenticated-image", id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/${id}`);
      return response.data as MediaRecord;
    },
  });
}
