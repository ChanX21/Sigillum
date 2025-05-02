import { useEffect } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { useGetProfile } from '@/hooks/useProfile';
import axiosInstance from '@/lib/axios';

export default function WalletWatcher() {
  const {connected,account,address} = useWallet();
  const { isError: sessionFailed, error: sessionError } = useGetProfile()
  useEffect(() => {
    if (sessionError) {
        if (account && connected) {
          console.log("Session Failed")
          axiosInstance.get(`/nonce/${address}`)
            .then((res) => {
            //   setNonce(res.data);
            //   createWalletSession({ nonce: res.data.nonce })
            })
            .catch((error) => {
              console.error('Error fetching nonce:', error);
            });
        }
      }
    if (connected && account) {
      
    }
  }, [connected, account]);

  const handlePostAutoConnect = (address: string) => {
    console.log('Auto-connected to wallet:', address);
    // 🚀 Your custom logic here (e.g. fetch user data, sync backend, etc.)
  };

  return null; // This can be a hidden component or part of your main layout
}
