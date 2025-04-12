import { Button } from '@/components/ui/button'
import { ChevronRight, Clock, Download, FileWarning, History, Share2, Shield, User, X, Check } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { motion } from "framer-motion"
import { VerificationResponse } from '@/store/useDataStore'
import { format } from 'date-fns'
interface VerificationProps {
    image: string | null
    verificationError: string | null,
    verificationData: VerificationResponse,
    isVerifying: boolean
    verificationResult: {
        authentic: boolean
        creator: {
            name: string
            id: string
        }
        creationDate: string
        modified: boolean
        provenance: Array<{
            event: string
            date: string
        }>
    } | null
    resetState: () => void
}
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
}
const Verification = ({ image, verificationError, verificationData, isVerifying, verificationResult, resetState }: VerificationProps) => {
    return (
        <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-6">
                <Button variant="ghost" onClick={resetState} className="p-2">
                    <X className="w-4 h-4 mr-1" />
                    Back
                </Button>
                <div className="text-sm text-[#616161] flex items-center">
                    <span>Home</span>
                    <ChevronRight className="w-3 h-3 mx-1" />
                    <span>Verification</span>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="relative aspect-square">
                            <Image src={image || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
                        </div>
                        {!verificationError && !isVerifying && (
                            <div className="p-4 border-t border-[#f1f3f5]">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#f1f3f5] flex items-center justify-center">
                                            <Image
                                                src="/placeholder.svg?height=24&width=24"
                                                alt="Creator"
                                                width={24}
                                                height={24}
                                                className="rounded-full"
                                            />
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium">{verificationData?.verificationResult?.tokenDetails?.creator}</p>
                                            <p className="text-xs text-[#616161]">Creator</p>
                                        </div>

                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-[#616161]">Created</p>
                                        <p className="text-sm">{verificationData ? format(new Date(verificationData?.verificationResult?.tokenDetails?.timestamp * 1000), 'dd MMM yyyy, HH:mm'):null}</p>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <div className="bg-white rounded-xl shadow-sm h-full">
                        <div className="p-6 border-b border-[#f1f3f5]">
                            <h2 className="text-2xl font-bold mb-1">Verification Results</h2>
                            <p className="text-[#616161]">Analysis of your image's authenticity and history</p>
                        </div>

                        <div className="p-6">
                            {isVerifying ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="relative w-20 h-20">
                                        <div className="absolute inset-0 border-4 border-t-[#1b263b] border-[#f1f3f5] rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Shield className="w-8 h-8 text-[#1b263b]" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium mt-6 mb-2">Verifying Image</h3>
                                    <p className="text-[#616161]">Analyzing authenticity and provenance...</p>
                                </div>
                            ) : verificationData && verificationResult ? (
                                <div className="space-y-8">
                                    <div className={`flex items-center gap-4 p-4 rounded-lg bg-[#f6ffed] border ${verificationResult.authentic ? 'border-[#b7eb8f]' : 'border-[#f5222d]'}`}>
                                        {verificationResult.authentic ? (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                                                    <Check className="w-6 h-6 text-[#52c41a]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-[#52c41a]">Authentic Image</h3>
                                                    <p className="text-sm">This image has been verified as authentic</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                                                    <FileWarning className="w-6 h-6 text-[#f5222d]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-[#f5222d]">Verification Failed</h3>
                                                    <p className="text-sm">This image could not be verified</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-[#e6f7ff] flex items-center justify-center mt-1">
                                                <User className="w-5 h-5 text-[#0070f3]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-medium mb-2">Creator Information</h4>
                                                <div className="bg-[#f9f9f9] p-3 rounded-lg">
                                                    <p className="text-sm font-medium">{verificationResult.creator.name}</p>
                                                    <p className="text-xs text-[#616161] mt-1">{verificationData?.verificationResult?.tokenDetails?.creator}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-[#fff7e6] flex items-center justify-center mt-1">
                                                <Clock className="w-5 h-5 text-[#fa8c16]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-medium mb-2">Creation Date</h4>
                                                <div className="bg-[#f9f9f9] p-3 rounded-lg">
                                                    <p className="text-sm">{verificationData ? format(new Date(verificationData?.verificationResult?.tokenDetails.timestamp * 1000), 'dd MMM yyyy, HH:mm'):null}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-[#f6ffed] flex items-center justify-center mt-1">
                                                <FileWarning className="w-5 h-5 text-[#52c41a]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-medium mb-2">Modifications</h4>
                                                <div className="bg-[#f9f9f9] p-3 rounded-lg">
                                                    <p className="text-sm">
                                                        {verificationResult.modified
                                                            ? "Image has been modified"
                                                            : "No modifications detected"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-[#f9f0ff] flex items-center justify-center mt-1">
                                                <History className="w-5 h-5 text-[#722ed1]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-medium mb-2">Provenance History</h4>
                                                <div className="bg-[#f9f9f9] p-3 rounded-lg">
                                                    <ul className="space-y-3">
                                                        {verificationResult.provenance.map((event: any, index: number) => (
                                                            <li key={index} className="relative pl-6">
                                                                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#1b263b]"></div>
                                                                <p className="text-sm font-medium">{event.event}</p>
                                                                <p className="text-xs text-[#616161]">{formatDate(event.date)}</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-[#f1f3f5]">
                                        <Button className="md:flex-1 w-[50%] px-3 bg-[#1b263b] hover:bg-[#2d3748] text-white gap-2 md:py-6 py-3">
                                            <Download className="w-4 h-4" />
                                            Download Report
                                        </Button>
                                        <Button variant="outline" className="md:flex-1 w-[50%] px-3 gap-2 md:py-6 py-3 border-[#1b263b] text-[#1b263b]">
                                            <Share2 className="w-4 h-4" />
                                            Share Results
                                        </Button>
                                    </div>
                                </div>
                            ) : verificationError ? (
                                <div className={`flex items-center gap-4 p-4 rounded-lg bg-[#f6ffed] border  border-[#f5222d]`}>
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                                        <FileWarning className="w-6 h-6 text-[#f5222d]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-[#f5222d]">Verification Failed</h3>
                                        <p className="text-sm">{verificationError}</p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Verification