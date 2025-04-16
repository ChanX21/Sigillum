import { Shield } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Header = () => {
    return (
        <header className="top-0 z-10 flex items-center justify-between px-6 py-4 shadow-sm">
            <Link href="/" className="flex items-center gap-2 font-bold text-[#0d0d0d] bg-white px-5 py-2 rounded-full">
                <div className="flex items-center justify-center w-6 h-6 bg-[#1b263b] rounded-full">
                    <Shield className="w-3 h-3 text-white" />
                </div>
                SIGILLUM
            </Link>



            <div className="flex items-center gap-4 bg-white p-1 rounded-full">

                <Link href={`${process.env.NEXT_PUBLIC_MAIN_APP_URL}/upload`}>
                    <button className="px-4 py-2 text-sm font-medium text-white rounded-full bg-[#1b263b] hover:bg-[#2d3748] transition-colors">
                        Secure image
                    </button>
                </Link>
            </div>
        </header>
    )
}

export default Header