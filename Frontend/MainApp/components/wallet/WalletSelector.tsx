import { useWallet } from '@suiet/wallet-kit'
import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { useWalletSession } from '@/hooks/useWalletSession'
import { useGetNonce } from '@/hooks/useSessionAuth'
import axiosInstance from '@/lib/axios'
import { toast } from 'sonner'

const WalletSelector = () => {
  const { connected, connecting, address, configuredWallets, allAvailableWallets, detectedWallets, select } = useWallet()
  const { data, isPending, isSuccess, mutate: createWalletSession } = useWalletSession()
  const [nonce, setNonce] = useState<any>()

  const handleWalletClick = async (wallet: any) => {
    if (wallet.installed) {
      await select(wallet.name)
    } else {
      console.log(wallet)
      // Redirect to wallet website or show a message
      if (wallet.downloadUrl?.browserExtension) {
        window.open(wallet.downloadUrl.browserExtension, '_blank')
      } else {
        alert(`Please install ${wallet.name} wallet.`)
      }
    }
  }

  useEffect(() => {
    if (address && connected) {
      console.log("nonce")
      axiosInstance.get(`/nonce/${address}`)
        .then((res) => {
          setNonce(res.data);
          createWalletSession({ nonce: res.data.nonce })
        })
        .catch((error) => {
          console.error('Error fetching nonce:', error);
        });
    }
  }, [address, connected]);


  useEffect(() => {
    console.log(isSuccess,isPending)
    if (isSuccess) {
      toast.success("User Authenticated Successfully")
    }
  }, [isSuccess,isPending])
  return (
    <div className='relative mt-10 md:px-10 px-15 flex flex-col overflow-y-scroll md:max-h-[85%]'>
      {[...configuredWallets, ...allAvailableWallets, ...detectedWallets].map((wallet, index) => (
        <Button
          key={index}
          onClick={() => handleWalletClick(wallet)}
          variant={'ghost'}
          className="w-full z-50"
        >
          <img src={wallet?.iconUrl} alt={wallet.name} className="inline-block w-5 h-5 mr-2" />
          {wallet.name}
        </Button>
      ))}
    </div>
  )
}

export default WalletSelector