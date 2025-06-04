// store/useAuthStore.ts
import { create } from "zustand";
import { imageAuthResponse } from '../types'
import { AxiosError } from "axios";

export type AuthState = {
    sessionId: string | null;
    result: imageAuthResponse | null;
    error: string | null;
    setResult: (data: imageAuthResponse) => void;
    setError: (data: string | null) => void;
    setSessionId: (data: string | null) => void;
    reset: () => void;
};

export const useImageAuthStore = create<AuthState>((set) => ({
    sessionId: null,
    result: null,
    error: null,

    setResult: (data) => set({ result: data }),
    setError: (data) => set({ error: data }),
    setSessionId: (data) => set({ sessionId: data }),
    
    reset: () => set({ sessionId: '', result: null }),
}));

