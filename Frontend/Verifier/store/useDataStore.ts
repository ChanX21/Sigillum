// store/useDataStore.ts
import { create } from 'zustand';
import { authenticateImage } from '@/lib/api';


export interface VerificationResult {
    isAuthentic: boolean;
    exactMatch: boolean;
    perceptualMatch: boolean;
    similarityScore: number;
    tokenDetails: {
        tokenId: string;
        creator: string;
        timestamp: number;
        metadata: string;
        imageUrl: string;
    };
    registryResults: {
        similarNFTs: Array<{ id: string, distance: number }>; // Replace `any` with a more specific type if known
    };
}

export interface DatabaseRecord {
    blockchain: {
        creator: string;
        listingId: string;
        tokenId: string;
        transactionHash: string
    };
    createdAt:string;
    metadataCID:string;
    original:string;
    score:number;
    status:string;
}

export interface VerificationResponse {
    message: string;
    verifications:Array<DatabaseRecord>
}
export interface DataState {
    data: VerificationResponse;
    loading: boolean;
    error: string | null;
    fetchData: (imageFile: File | null) => Promise<void>;
}



export const useDataStore = create((set) => ({
    data: null,
    loading: false,
    error: null,
    fetchData: async (imageFile: File) => {
        set({ loading: true, error: null });
        try {
            const data = await authenticateImage(imageFile);
            set({ data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            console.log(error)
        }
    },
}));
