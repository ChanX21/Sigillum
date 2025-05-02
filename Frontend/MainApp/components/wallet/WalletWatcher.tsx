import { useEffect, useState } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { useGetProfile } from '@/hooks/useProfile';
import axiosInstance from '@/lib/axios';
import { useWalletSession } from '@/hooks/useWalletSession';
import { toast } from 'sonner';

export default function WalletWatcher() {
  const { connected, account, address } = useWallet();
  const { isError: sessionFailed, error: sessionError } = useGetProfile()
  const { data, isPending, isSuccess, mutate: createWalletSession } = useWalletSession()
  
  
  const [nonce, setNonce] = useState<any>()

  useEffect(() => {
    if (sessionError) {
      if (account && connected) {
        console.log("Session Failed")
        axiosInstance.get(`/nonce/${address}`)
          .then((res) => {
            setNonce(res.data);
            createWalletSession({ nonce: res.data.nonce })
          })
          .catch((error) => {
            console.error('Error fetching nonce:', error);
          });
      }
    }

  }, [connected, account, sessionError, sessionFailed]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("User Authenticated Successfully")
    }
  }, [isSuccess])
  

  return null; 
}
