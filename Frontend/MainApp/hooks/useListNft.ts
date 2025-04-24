import { useMutation } from "@tanstack/react-query";
import { Transaction } from '@mysten/sui/transactions';
import { listNft } from "@/utils/blockchainServices";
import { client } from "@/lib/suiClient";

// Define the types for the parameters
type ListNftParams = {
    address: string;
    softListingId: string;
    listPrice: number;
    packageId: string;
    moduleName: string;
    marketplaceObjectId: string;
    nftId:string;
    signTransaction: ({ transaction }: { transaction: Transaction }) => Promise<any>;
};

export function useListNft() {
    return useMutation({
        mutationKey: ["list-nft"], // Unique key for the mutation
        mutationFn: async ({ address, softListingId, listPrice, packageId, moduleName, marketplaceObjectId, nftId, signTransaction }: ListNftParams) => {
            try {
                // Create a new transaction block for the listing
                const { transaction } = await listNft(address, softListingId, listPrice, packageId, moduleName, marketplaceObjectId, nftId);

                // Sign the transaction block
                const sign = await signTransaction({
                    transaction
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

                const txStatus = result.effects?.status?.status;
                if (txStatus !== 'success') {
                    const errorMsg = result.effects?.status?.error || 'Unknown Sui execution error';
                    throw new Error(`Transaction failed`);
                }
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
