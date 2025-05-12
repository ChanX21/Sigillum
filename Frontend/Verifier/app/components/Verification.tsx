import { Button } from '@/components/ui/button'
import { ChevronRight, Clock, Download, FileWarning, History, Share2, Shield, User, X, Check, Copy, View, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { motion } from "framer-motion"
import { VerificationResponse } from '@/store/useDataStore'
import { format } from 'date-fns'
import { shortenAddress } from '@/lib/shortenAddress'
import { toast } from 'sonner'
import BeforeAfterSlide from './BeforeAfterSlide'
import axios from 'axios'
import { UserAvatar } from './UserAvatar'
import { displayNftEvents } from '@/utils/blockchainServices'
import Link from 'next/link'

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
    resetState: () => void,
    setSubmittedForVerification: React.Dispatch<React.SetStateAction<boolean>>
}
interface Provenance {
    ListingCreated: Array<{
        timestampMs: string,
        Transaction: string,
        sender: string,
        Data: {
            enf_time: string,
            listing_id: string,
            listing_type: number,
            min_bid: string,
            nft_id: string,
            owner: string,
            price: string,
            start_time: Date
        }
    }>,
    ListingCompleted: Array<{
        timestampMs: string,
        Transaction: string,
        sender: string,
        parsedJson: {
            buyer: string,
            final_price: string,
            listing_id: string,
            listing_type: number,
            nft_id: string,
            seller: string,
            success: boolean
        }
    }>,

}
function hasAnyProvenance(obj: any): obj is Partial<Provenance> {
    return (
        obj &&
        typeof obj === 'object' &&
        (Array.isArray(obj.ListingCreated) || Array.isArray(obj.ListingCompleted))
    );
}

const PINATA_URI = process.env.NEXT_PUBLIC_PINATA_URL
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
}
const Verification = ({ image, verificationError, verificationData, isVerifying, verificationResult, resetState, setSubmittedForVerification }: VerificationProps) => {
    const [authenticImage, setAuthenticImage] = useState('')
    const [provenance, setProvenance] = useState<Provenance | {}>({})
    const fetchMetadata = async () => {
        const response = await axios.get(`${PINATA_URI}${verificationData.verifications[0].metadataCID}`)

        return response.data
    }

    useEffect(() => {
        if (verificationData && verificationData.verifications) {
            console.log(verificationData)
            fetchMetadata().then((res) => {
                setAuthenticImage(res.image)
                displayNftEvents(verificationData.verifications[0].blockchain.tokenId).then(res => {

                    setProvenance(res)
                })
            }).catch(err => {
                console.log(err)
            })
        }
    }, [verificationData])

    useEffect(() => {
        console.log(hasAnyProvenance(provenance))
    }, [provenance])
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
                            {verificationData?.verifications.length !== 0 ? (
                                <BeforeAfterSlide afterImage={image as string} beforeImage={authenticImage as string} />
                            ) : (
                                <Image src={image || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
                            )}
                        </div>
                        {!verificationError && !isVerifying && (
                            <div className="p-4 border-t border-[#f1f3f5]">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#f1f3f5] flex items-center justify-center">
                                            <UserAvatar
                                                walletAddress={verificationData?.verifications[0]?.user?.walletAddress}
                                                alt={verificationData?.verifications[0]?.user?.walletAddress || "Creator"}
                                            />
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium">{shortenAddress(verificationData?.verifications[0]?.user?.name)}</p>
                                            <p className="text-xs text-[#616161]">Creator</p>
                                        </div>

                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-[#616161]">Created</p>
                                        <p className="text-sm">{verificationData ? format(new Date(verificationData?.verifications[0]?.createdAt), 'dd MMM yyyy, HH:mm') : null}</p>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <div className="bg-white rounded-xl shadow-sm h-full border border-1">
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
                            ) : verificationData && verificationData.verifications.length !== 0 ? (
                                <div className="space-y-8">
                                    <div className={`flex items-center gap-4 p-4 rounded-lg bg-[#f6ffed] border ${verificationData?.verifications.length !== 0 ? 'border-[#b7eb8f]' : 'border-[#f5222d]'}`}>
                                        {verificationData?.verifications.length !== 0 ? (
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
                                                <div className="bg-[#f9f9f9] p-3 rounded-lg flex justify-between items-center">
                                                    <p className="text-xs text-[#616161] mt-1">{shortenAddress(verificationData?.verifications[0]?.user?.walletAddress)}</p>
                                                    <Button variant='ghost' onClick={async () => {
                                                        await navigator.clipboard.writeText(verificationData?.verifications[0]?.user?.walletAddress)
                                                        toast.success("Copied to Clipboard")
                                                    }}>
                                                        <Copy />
                                                    </Button>
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
                                                    <p className="text-sm">{verificationData ? format(new Date(verificationData?.verifications[0]?.createdAt), 'dd MMM yyyy, HH:mm') : null}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-[#f6ffed] flex items-center justify-center mt-1">
                                                <FileWarning className="w-5 h-5 text-[#52c41a]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-medium mb-2">Sigillum Score</h4>
                                                <div className="bg-[#f9f9f9] p-3 rounded-lg">
                                                    <p className="text-sm">
                                                        {parseFloat(verificationData?.verifications[0].score.toFixed(4)) * 100} %
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
                                                        {hasAnyProvenance(provenance) && (
                                                            <>

                                                                {provenance.ListingCompleted?.map((event, index) => (
                                                                    <li key={`completed-${index}`} className="relative pl-6">
                                                                        <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#1b263b]"></div>
                                                                        <p className="text-sm font-medium">Image Purchased by {shortenAddress(event.parsedJson.buyer)} </p>
                                                                        <p className="text-xs text-[#616161]">{formatDate(new Date(Number(event.timestampMs)).toISOString())}</p>
                                                                    </li>
                                                                ))}
                                                                {provenance.ListingCreated?.map((event, index) => (
                                                                    <li key={`created-${index}`} className="relative pl-6">
                                                                        <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#1b263b]"></div>
                                                                        <p className="text-sm font-medium">Listed on the Sui Marketplace</p>
                                                                        <p className="text-xs text-[#616161]">{formatDate(new Date(Number(event.timestampMs)).toISOString())}</p>
                                                                    </li>
                                                                ))}
                                                            </>
                                                        )}

                                                        {[
                                                            { date: verificationData.verifications[0].updatedAt, event: `Verified by Sigillum` },
                                                            { date: verificationData.verifications[0].createdAt, event: `Registered on The Sui Chain` },
                                                            { date: verificationData.verifications[0].createdAt, event: `Created by ${verificationData.verifications[0].user.name ? verificationData.verifications[0].user.name : 'Anonymous'}` },
                                                        ].map((event: any, index: number) => (
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
                                        <Link href={`https://sigillum.digital/detail/${verificationData.verifications[0]._id}`} target='_blank' className='w-[50%] flex'>
                                            <Button className="md:flex-1 px-3 bg-[#000] hover:bg-gray-950 rounded-none text-white gap-2 md:py-6 py-3 border border-black">
                                                <ExternalLink className="w-4 h-4" />
                                                View Lisitng
                                            </Button>
                                        </Link>

                                        <Button variant="outline" className="md:flex-1 w-[50%] px-3 gap-2 md:py-6 py-3 border-[#000] text-[#000] rounded-none ">
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