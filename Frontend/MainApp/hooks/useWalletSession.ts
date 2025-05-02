import { useWallet } from '@suiet/wallet-kit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCreateSession, useGetNonce } from './useSessionAuth';

export function useWalletSession() {
    const { connected, address, signPersonalMessage } = useWallet();
    const { mutate: createSessionMutation } = useCreateSession();
    const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ['wallet-session'],
        mutationFn: async ({ nonce }: { nonce: string }) => {
            if (!connected || !address) return false;

            try {
                // 1. Get nonce

                if (!nonce) throw new Error('No nonce available');

                const message = `Sign this message to authenticate: ${nonce}`;

                // 2. Sign the message
                const { signature } = await signPersonalMessage({
                    message: new TextEncoder().encode(message)
                });

                // 3. Send to backend
                await createSessionMutation({
                    address,
                    message,
                    signature
                });
            } catch (err: any) {
                console.log(err)
                console.error('❌ Session creation failed:', err.response?.data || err.message);
                return false;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['get-profile'], exact: false })
        }
    });
}
