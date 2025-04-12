// store/useDataStore.ts
import { create } from 'zustand';
import { authenticateImage } from '@/lib/api';



export const useDataStore = create((set) => ({
    data: [],
    loading: false,
    error: null,

    fetchData: async (userAddress: string, imageFile: File) => {
        set({ loading: true, error: null });
        try {
            const data = await authenticateImage(userAddress, imageFile);
            set({ data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
}));
