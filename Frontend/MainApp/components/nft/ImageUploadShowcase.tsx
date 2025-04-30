"use client";
import React, { useEffect, useRef, useState } from "react";
import { IoIosAddCircleOutline } from "react-icons/io";
import Image from "next/image";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { useAuthenticateImage } from "@/hooks/useAuthenticateImage";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import SecureCarousel from "./SecureCarousel";
// Dummy images for the carousel; replace with real image URLs as needed

const carouselImages = [
  "/image1.jpg",
  "/image2.jpg",
  "/image3.jpg",
  "/image4.jpg",
  "/image5.jpg",
];

export function ImageUploadShowcase({
  setStep,
  setStepLoading,
}: {
  setStep: (step: number) => void;
  setStepLoading: React.Dispatch<React.SetStateAction<Boolean>>;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { address, connected } = useWallet();
  const {
    error,
    isSuccess,
    isError,
    isPending,
    mutate: authenticateImage,
  } = useAuthenticateImage();
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleMint = () => {
    if (!connected) {
      toast.error("Please Connect Wallet");
    }
    if (!imageFile) {
      toast.error("Could not find any media");
    }
    if (imageFile && connected) {
      authenticateImage({ image: imageFile });
    }
  };

  useEffect(() => {
    if (isPending) {
      setStepLoading(true);
    } else {
      setStepLoading(false);
    }
    if (isError) {
      toast.error(error.message);
    }
    if (isSuccess) {
      toast.success("Image Authenticated Successfully");
      setStep(1);
    }
  }, [error, isSuccess, isPending]);

  return (
    <div
      className={`${
        image
          ? ""
          : "flex flex-col items-center w-full h-[80vh] justify-end relative"
      }`}
    >
      {!image ? (
        <>
          <SecureCarousel />
          <div className="flex flex-col items-center absolute top-1/3 md:top-1/2   left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-3xl font-bold text-center mb-2">
              Protect What You Create
            </h1>
            <p className="text-gray-500 text-center mb-6">
              Drag and drop your image, or click to upload
            </p>
            <label
              htmlFor="img-upload"
              // className={` cursor-pointer border-2 border-dashed  h-[400px] rounded-lg p-10 flex flex-col justify-center`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`${
                isDragging && "backdrop-blur-[11px]"
              } rounded-xl w-64 h-72 flex flex-col items-center justify-center cursor-pointer transition  hover:backdrop-blur-[11px] bg-[rgba(255,255,255,0.2)] backdrop-blur-[10px] border-[1px] border-dashed border-[#8e8e8e]`}
            >
              <span className="text-4xl text-gray-400 mb-2">
                <IoIosAddCircleOutline size={24} color="black" />
              </span>
              <span className="text-black">Upload Image</span>
              <input
                id="img-upload"
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </>
      ) : (
        <>
          <div className="w-full flex justify-center relative ">
            <div className="relative md:w-[35%] w-full aspect-square">
              <Image
                src={image || "/placeholder.svg"}
                alt="Uploaded image"
                fill
                className="object-cover"
              />
            </div>
            <Button
              onClick={() => {
                setImage(null);
                setImageFile(null);
              }}
              variant={"secondary"}
              className="absolute top-0 md:-top-5 right-0"
            >
              <X />
            </Button>
          </div>
          <div className="text-right mt-10 mb-10">
            <Button
              onClick={handleMint}
              className="rounded-none"
              variant="default"
            >
              {isPending ? (
                <div className="relative w-6 h-6 bg-[#1b263b] rounded-full">
                  <div className="absolute inset-0 border-2 border-[#1b263b]  border-t-[#fff] rounded-full animate-spin m-0.5"></div>
                </div>
              ) : (
                "Secure & Mint"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
