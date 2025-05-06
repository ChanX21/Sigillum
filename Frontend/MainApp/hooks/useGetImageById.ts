// hooks/useGetData.ts
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { MediaRecord } from "@/types";

export function useGetImageById(id: string) {
  return useQuery<MediaRecord, Error>({
    queryKey: ["authenticated-image", id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/${id}`);
      // console.log("Id :", id, "Response: ", response);
      return response.data as MediaRecord;
    },
    enabled: !!id,
    refetchInterval: (data) => {
      // console.log("Refetching",data.state.data)

      // Keep polling if data is null, stop if we got it
      return data.state.data === null ? 7000 : false;
    },
  });
}
