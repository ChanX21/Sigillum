import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export const UploadArea = ({
  setStep,
}: {
  setStep: (step: number) => void;
}) => {
  const [image, setImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    console.log(image)
  }, [image])
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
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

      }
      reader.readAsDataURL(file)
    }
  }
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
        <div className="w-full flex justify-center">
        <div className="relative md:w-[50%] w-full aspect-square">
          <Image src={image || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
        </div>
        </div>
      )}

      <div className="text-right mt-10 mb-10">
        <Button onClick={() => setStep(1)} variant="default">
          Secure & Mint
        </Button>
      </div>
    </div>
  );
};
