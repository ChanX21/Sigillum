import { Shield } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Footer = () => {
    return (
        <footer className="bg-[#1b263b] text-white mt-12">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
                                <Shield className="w-4 h-4 text-[#1b263b]" />
                            </div>
                            <h2 className="text-2xl font-bold">SIGILLUM</h2>
                        </div>
                        <p className="text-[#a0aec0]">Verify the authenticity and provenance of digital assets.</p>
                    </div>

                    <div className="flex gap-12">
                        <div>
                            <h3 className="text-sm font-medium mb-4 text-[#a0aec0]">COMPANY</h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="#" className="text-sm hover:text-[#d9d9d9] transition-colors">
                                        Careers
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-sm hover:text-[#d9d9d9] transition-colors">
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-sm hover:text-[#d9d9d9] transition-colors">
                                        Subscribe
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium mb-4 text-[#a0aec0]">CONTACT</h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="#" className="text-sm hover:text-[#d9d9d9] transition-colors">
                                        X
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-sm hover:text-[#d9d9d9] transition-colors">
                                        Instagram
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-[#2d3748] text-xs text-[#a0aec0]">
                    <div>© 2025 SIGILLUM</div>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link href="#" className="hover:text-[#d9d9d9] transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="hover:text-[#d9d9d9] transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer