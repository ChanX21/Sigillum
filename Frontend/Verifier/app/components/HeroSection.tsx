import { Button } from '@/components/ui/button'
import { Camera, Upload } from 'lucide-react'
import React from 'react'

const HeroSection = ({ image, fileInputRef, setActiveTab, handleFileUpload }: {
    image: string | null,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
    setActiveTab: React.Dispatch<React.SetStateAction<string>>,
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
    return (
        <div>
            {!image && (
                <div className="relative mt-10 mx-5 bg-[#000] text-white py-16 overflow-hidden">
                    <div className="container max-w-5xl mx-auto px-4 relative z-10">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl font-bold mb-4">Verify Image Authenticity</h1>
                            <p className="text-lg opacity-90 mb-8">
                                Upload or capture an image to instantly verify its authenticity, creator information, and provenance
                                history.
                            </p>
                            <div className="flex lg:gap-4 gap-2">
                                <Button
                                    className="bg-white text-[#1b263b] hover:bg-[#f1f3f5] md:px-6 md:py-6 px-2 py-3 rounded-xl md:text-lg text-md font-medium"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-5 h-5 mr-2" />
                                    Upload Image
                                </Button>
                                <Button
                                    variant="outline"
                                    className="bg-transparent text-white border-white hover:bg-white/10 hover:text-white md:px-6 md:py-6 px-2 py-3 rounded-xl md:text-lg text-md font-medium"
                                    onClick={() => setActiveTab("camera")}
                                >
                                    <Camera className="w-5 h-5 mr-2" />
                                    Take Photo
                                </Button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HeroSection