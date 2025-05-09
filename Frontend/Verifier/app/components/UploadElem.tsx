import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X } from 'lucide-react'

const UploadElem = ({
    activeTab,
    handleTabChange,
    isDragging,
    fileInputRef,
    setIsDragging,
    handleDrop,
    setActiveTab,
    videoRef,
    capturePhoto
}: {
    activeTab: string;
    handleTabChange: (value: string) => void;
    isDragging: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    setIsDragging: React.Dispatch<React.SetStateAction<boolean>>,
    handleDrop: (e: React.DragEvent) => void;
    setActiveTab: (value: string) => void;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    capturePhoto: () => void;
}) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Set up camera with rear-facing preference on mobile
       
        return () => {
            window.removeEventListener('resize', checkMobile);
            // Cleanup camera stream
        };
    }, [isMobile]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    return (
        <Card className={`bg-white rounded-none shadow-sm overflow-hidden border-0 ${isMobile && activeTab === 'camera' ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}`}>
            <CardContent className={`p-0 ${isMobile && activeTab === 'camera' ? 'h-screen' : ''}`}>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full">
                    <TabsContent value="upload" className="m-0">
                        <div
                            className={`border-2 border-dashed ${isDragging ? 'border-[#1b263b] bg-[#fff]' : 'border-[#d9d9d9] bg-[#fff]'} rounded-b-lg p-16 text-center cursor-pointer hover:border-[#1b263b] transition-colors`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Upload className="w-10 h-10 text-[#8c8c8c]" />
                                </div>
                                <h3 className="text-xl font-medium mb-3">Upload an image to verify</h3>
                                <p className="text-[#616161] mb-6">Drag and drop or click to browse your files</p>
                                <div className="flex justify-center items-center gap-2">
                                    <Button
                                        className="bg-[#000] hover:bg-gray-950 text-white px-6 py-6 rounded-none text-sm "
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            fileInputRef.current?.click()
                                        }}
                                    >
                                        Select Image
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="bg-transparent text-black border-black hover:bg-black/10 hover:text-black px-6 py-6 rounded-none font-medium text-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab("camera");
                                        }}
                                    >
                                        <Camera className="w-5 h-5 mr-2" />
                                        Take Photo
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </TabsContent>

                    <TabsContent value="camera" className={`m-0 ${isMobile ? 'h-full' : ''}`}>
                        <div className={`relative rounded-b-lg overflow-hidden bg-black ${isMobile ? 'h-full' : 'aspect-video'}`}>
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <Button
                                onClick={() => setActiveTab("upload")}
                                className="absolute top-4 right-4 bg-white/80 hover:bg-white text-[#1b263b] rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                            <div className="absolute md:bottom-0 inset-x-0 p-6 flex justify-center bottom-12">
                                <Button
                                    onClick={capturePhoto}
                                    className="bg-white text-[#1b263b] hover:bg-[#f1f3f5] rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg"
                                >
                                    <Camera className="w-8 h-8" />
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

export default UploadElem