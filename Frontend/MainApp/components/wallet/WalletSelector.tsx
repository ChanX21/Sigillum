import { useWallet } from '@suiet/wallet-kit'
import React from 'react'
import { Button } from '../ui/button'

const WalletSelector = () => {
  const { configuredWallets, allAvailableWallets, detectedWallets,select } = useWallet()

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
  return (
    <div className='relative mt-10 md:px-10 px-15 flex flex-col overflow-y-scroll md:max-h-[85%]'>
      {[...configuredWallets, ...allAvailableWallets, ...detectedWallets].map((wallet,index) => (
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