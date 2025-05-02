import { Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Header = () => {
    return (
        <header className="top-0 z-10 flex items-center justify-between shadow-sm">
            <Link
            href="/"
            target='_blank'
            className="flex items-center gap-2 px-3 h-full font-bold text-[#0d0d0d]"
          >
            <Image alt="Sigillum" width={140} height={30} src={'/icons/SIGILLUM_LOGO.png'} />
          </Link>



            <div className="flex items-center gap-4 bg-white h-full rounded-full ">

                <Link href={`${process.env.NEXT_PUBLIC_MAIN_APP_URL}/secure`} className='h-full'>
                    <button className="px-4 py-3 text-sm font-medium text-white rounded-none bg-[#000] hover:bg-gray-950 transition-colors h-full">
                        Secure image
                    </button>
                </Link>
            </div>
        </header>
    )
}

export default Header