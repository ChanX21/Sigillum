import { Button } from "@/components/ui/button";
import { useAuthenticateImage } from "@/hooks/useAuthenticateImage";
import { useWallet } from "@suiet/wallet-kit";
import { X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const UploadArea = ({
  setStep,
  setStepLoading
}: {
  setStep: (step: number) => void;
  setStepLoading: React.Dispatch<React.SetStateAction<Boolean>>
}) => {
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { error, isSuccess, isError, isPending, mutate: authenticateImage } = useAuthenticateImage()
  const { address, connected } = useWallet()
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        setImageFile(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        setImageFile(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMint = () => {
    if (!connected) {
      toast.error("Please Connect Wallet")
    }
    if (!imageFile) {
      toast.error("Could not find any media")
    }
    if (imageFile && connected) {
      authenticateImage({ image: imageFile })
    }
  }

  useEffect(() => {
    if (isPending) {
      setStepLoading(true)
    } else {
      setStepLoading(false)
    }
    if (isError) {
      toast.error(error.message)
    }
    if (isSuccess) {
      toast.success("Image Authenticated Successfully")
      setStep(1)
    }
  }, [error, isSuccess, isPending])


  return (
    <div>
      {!image ? (
        <div
          className={`${isDragging ? 'border-[#1b263b] bg-[#f1f3f5]' : 'border-[#d9d9d9] bg-[#fafafa]'} cursor-pointer border-2 border-dashed  h-[400px] rounded-lg p-10 flex flex-col justify-center`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-semibold mb-2">Drag file to upload</h2>
            <Button
              variant="outline"
              className="mt-4 rounded-full border-primary w-32"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              Upload
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Supported file types: JPG, PNG, GIF, SVG
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center relative">
          <div className="relative md:w-[50%] w-full aspect-square">
            <Image src={image || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
          </div>
          <Button
            onClick={() => {
              setImage(null)
              setImageFile(null)
            }}
            variant={'secondary'} className="absolute top-0 md:-top-5 right-0">
            <X />
          </Button>
        </div>
      )}

      <div className="text-right mt-10 mb-10">
        <Button onClick={handleMint} variant="default">
          {isPending ? (
            <div className="relative w-6 h-6 bg-[#1b263b] rounded-full">
              <div className="absolute inset-0 border-2 border-[#1b263b]  border-t-[#fff] rounded-full animate-spin m-0.5"></div>
            </div>
          ) : (
            'Secure & Mint'
          )}
        </Button>
      </div>
    </div>
  );
};
