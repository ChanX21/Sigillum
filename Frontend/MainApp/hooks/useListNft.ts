import { useMutation } from "@tanstack/react-query";
import { Transaction } from '@mysten/sui/transactions';
import { listNft } from "@/utils/blockchainServices";
import { client } from "@/lib/suiClient";

// Define the types for the parameters
type ListNftParams = {
    softListingId: string;
    listPrice: number;
    signTransaction: ({ transaction }: { transaction: Transaction }) => Promise<any>;
};

export function useListNft() {
    return useMutation({
        mutationKey: ["list-nft"], // Unique key for the mutation
        mutationFn: async ({ softListingId, listPrice, signTransaction }: ListNftParams) => {
            try {
                // Create a new transaction block for the listing
                const tx = listNft({ softListingId, listPrice });

                // Sign the transaction block
                const sign = await signTransaction({
                    transaction: tx
                });

                if (!sign) {
                    throw new Error("Transaction signing failed");
                }

                // Execute the signed transaction on the client
                const result = await client.executeTransactionBlock({
                    transactionBlock: sign.bytes,
                    signature: sign.signature,
                    options: {
                        showEffects: true,
                        showEvents: true,
                    },
                });

                // Return the result
                return result;
            } catch (error) {
                console.error("Error in transaction:", error);
                throw error; // Re-throw the error to be caught by React Query's error handling
            }
        },
        onError: (error) => {
            console.error("Mutation failed:", error);
        },
        onSuccess: (data) => {
            console.log("NFT listed successfully:", data);
        }
    });
}
