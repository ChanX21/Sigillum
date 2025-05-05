import React from 'react'
import WalletSelector from './WalletSelector'
import { X } from 'lucide-react'
import { Button } from '../ui/button'

const WalletModal = ({ setShowWalletModal }: { setShowWalletModal: React.Dispatch<React.SetStateAction<boolean>> }) => {
    return (
        <div className="absolute w-full z-10 h-screen left-0 top-0 flex justify-center items-center">
            <div className="w-full h-full absolute top-0 ring-0 bg-black opacity-20" />
            <div className="relative md:w-[30%] bg-white rounded-sm md:h-[60%] w-[95%] h-[65%] z-10 flex justify-center md:items-start items-start">
                <Button variant={'ghost'} className='absolute right-3 top-3' onClick={() => setShowWalletModal(false)}>
                    <X />
                </Button>
                <WalletSelector />
            </div>
        </div>
    )
}

export default WalletModal