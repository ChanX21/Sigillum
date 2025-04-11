"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
// Components
import Header from '@/app/components/Header'
import Info from '@/app/components/Info'
import Footer from '@/app/components/Footer'
import HeroSection from "@/app/components/HeroSection"
import Verification from "@/app/components/Verification"
import UploadElem from "@/app/components/UploadElem"

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        verifyImage()
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        verifyImage()
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0)
      const imageDataUrl = canvas.toDataURL("image/jpeg")
      setImage(imageDataUrl)
      stopCamera()
      verifyImage()
    }
  }

  const verifyImage = () => {
    setIsVerifying(true)
    // Simulate API call to verify image
    setTimeout(() => {
      setVerificationResult({
        authentic: false,
        creator: {
          id: "0x9E64c9F7a0497c289d8a420348",
        },
        creationDate: "2023-09-15T14:30:22Z",
        modified: false,
        provenance: [
          { date: "2023-09-15T14:30:22Z", event: "Created by Alex Johnson" },
          { date: "2023-09-15T15:45:10Z", event: "Registered on blockchain" },
          { date: "2023-10-02T09:12:45Z", event: "Verified by SIGILLUM" },
        ],
      })
      setIsVerifying(false)
    }, 2000)
  }

  const resetState = () => {
    setImage(null)
    setVerificationResult(null)
    if (activeTab === "camera") {
      startCamera()
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "camera") {
      startCamera()
    } else {
      stopCamera()
    }
  }

  

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [activeTab])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection image={image} fileInputRef={fileInputRef} setActiveTab={setActiveTab} handleFileUpload={handleFileUpload} />
      {/* Main Content */}
      <main className="flex-1 container max-w-5xl mx-auto py-8 px-4">
        {!image ? (
          <>
            <Info />

            <UploadElem
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              setIsDragging={setIsDragging}
              handleDrop={handleDrop}
              setActiveTab={setActiveTab}
              videoRef={videoRef}
              capturePhoto={capturePhoto}
            />
          </>
        ) : (
          <Verification
            image={image}
            isVerifying={isVerifying}
            verificationResult={verificationResult}
            resetState={resetState}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
