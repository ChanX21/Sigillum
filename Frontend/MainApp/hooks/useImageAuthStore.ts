// store/useAuthStore.ts
import { create } from "zustand";
import { imageAuthResponse } from '../types'

export type AuthState = {
    result: imageAuthResponse | null;
    error: string | null;
    setResult: (data: imageAuthResponse) => void;
    setError: (data: string) => void;
};

export const useImageAuthStore = create<AuthState>((set) => ({
    result: null,
    error: null,
    setResult: (data) => set({ result: data }),
    setError: (data) => set({ error: data }),
}));
