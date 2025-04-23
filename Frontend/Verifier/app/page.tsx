"use client"

import React, { useState, useRef, useEffect } from "react"
import Header from '@/app/components/Header'
import Info from '@/app/components/Info'
import Footer from '@/app/components/Footer'
import HeroSection from "@/app/components/HeroSection"
import Verification from "@/app/components/Verification"
import UploadElem from "@/app/components/UploadElem"
import { DataState, useDataStore } from "@/store/useDataStore"
import ImageCropper from "./components/ImageCropper"

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [imageBuffer, setImageBuffer] = useState<File | null>(null)
  const [submittedForVerification, setSubmittedForVerification] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { data, loading: isVerifying, error, fetchData } = useDataStore() as DataState

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
      setImageBuffer(file)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => setImage(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      const constraints = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        ? { video: { facingMode: { exact: "environment" } } }
        : { video: true }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
        .catch(() => navigator.mediaDevices.getUserMedia({ video: true }))

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    setImage(canvas.toDataURL("image/jpeg"))
    stopCamera()
  }

  const verifyImage = (image: File | null) => {
    if (image) fetchData(image)
  }

  const resetState = () => {
    setImage(null)
    setVerificationResult(null)
    setSubmittedForVerification(false)
    if (activeTab === "camera") startCamera()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    value === "camera" ? startCamera() : stopCamera()
  }

  const onCropComplete = (croppedImage: File) => {
    setSubmittedForVerification(true)
    if (!croppedImage?.type.startsWith("image/")) return

    const reader = new FileReader()
    reader.onload = (event) => setImage(event.target?.result as string)
    reader.readAsDataURL(croppedImage)

    // setImageBuffer(croppedImage)
    verifyImage(croppedImage)
  }

  useEffect(() => {
    if (activeTab === "camera") startCamera()
    return () => stopCamera()
  }, [activeTab])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <HeroSection
        image={image}
        fileInputRef={fileInputRef}
        setActiveTab={setActiveTab}
        handleFileUpload={handleFileUpload}
      />

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
        ) : submittedForVerification ? (
          <Verification
            image={image}
            verificationError={error}
            verificationData={data}
            isVerifying={isVerifying}
            verificationResult={verificationResult}
            resetState={resetState}
            setSubmittedForVerification={setSubmittedForVerification}
          />
        ) : (
          <ImageCropper imageSrc={image} onCropComplete={onCropComplete} />
        )}
      </main>

      <Footer />
    </div>
  )
}
