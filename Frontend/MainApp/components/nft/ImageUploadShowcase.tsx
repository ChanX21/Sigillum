"use client";
import React, { useEffect, useRef, useState } from "react";
import { IoIosAddCircleOutline } from "react-icons/io";
import Image from "next/image";
import { Button } from "../ui/button";
import { Shield, X } from "lucide-react";
import { useAuthenticateImage } from "@/hooks/useAuthenticateImage";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import SecureCarousel from "./SecureCarousel";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const nftFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
});

type NFTFormValues = z.infer<typeof nftFormSchema>;

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
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { address, connected } = useWallet();
  const {
    error,
    isSuccess,
    isError,
    isPending,
    mutate: authenticateImage,
  } = useAuthenticateImage();

  const form = useForm<NFTFormValues>({
    resolver: zodResolver(nftFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const checkPlagiarism = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 3000);
    });
  };

  const onSubmit = async (data: NFTFormValues) => {
    if (!connected) {
      toast.error("Please Connect Wallet");
      return;
    }
    if (!imageFile) {
      toast.error("Could not find any media");
      return;
    }
    if (imageFile && connected) {
      setShowForm(false);
      setIsCheckingPlagiarism(true);
      try {
        await checkPlagiarism();
        setIsCheckingPlagiarism(false);
        const { name, description } = data;
        authenticateImage({ image: imageFile, name, description });
      } catch (error) {
        setIsCheckingPlagiarism(false);
        toast.error("Plagiarism check failed");
        setShowForm(true);
      }
    }
  };

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

  useEffect(() => {
    if (isPending || isCheckingPlagiarism) {
      setStepLoading(true);
    } else {
      setStepLoading(false);
    }
    if (isError) {
      toast.error(error.message);
      setShowForm(true);
    }
    if (isSuccess) {
      toast.success("Image Authenticated Successfully");
      setStep(1);
    }
  }, [error, isSuccess, isPending, isCheckingPlagiarism]);

  return (
    <div
      className={`${image
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
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`${isDragging && "backdrop-blur-[11px]"
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
          <div className="w-full flex md:flex-row flex-col  gap-10 h-full justify-center relative md:gap-10">
            <div className="relative md:max-w-[43%] md:mt-0 mt-20 w-full aspect-square">
              <Image
                src={image || "/placeholder.svg"}
                alt="Uploaded image"
                fill
                className="object-cover"
              />
            </div>

            {showForm ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:w-[30%]">
                <h2 className="text-2xl font-bold mb-6">NFT Details</h2>

                <div className="space-y-6 h-full flex flex-col items-between">
                  <div className="flex flex-col justify-center gap-10">
                    <div className="space-y-2">
                      <Label htmlFor="name">NFT Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter a name for your NFT"
                        className="border border-gray-300"
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                      )}
                      <p className="text-xs text-gray-500">Give your NFT a unique and memorable name</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your NFT..."
                        className="border border-gray-300"
                        rows={4}
                        {...form.register("description")}
                      />
                      {form.formState.errors.description && (
                        <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
                      )}
                      <p className="text-xs text-gray-500">Add details about your NFT's story, features or significance</p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="rounded-none w-full mt-auto"
                    variant="default"
                  >
                    Secure & Mint
                  </Button>
                </div>
              </form>
            ) : (
              <>
                {/* Plagiarism Loader */}
                {isCheckingPlagiarism && (
                  <div className="flex flex-col items-center justify-center md:max-w-[30%] py-16">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 border-4 border-t-[#1b263b] border-[#f1f3f5] rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-[#1b263b]" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mt-6 mb-2">Checking Plagiarism</h3>
                    <p className="text-[#616161] text-center">Analyzing image for potential duplicates and unauthorized copies...</p>
                  </div>
                )}

                {/* Securing Image Loader */}
                {isPending && (
                  <div className="flex flex-col items-center justify-center md:max-w-[30%] py-16">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 border-4 border-t-[#1b263b] border-[#f1f3f5] rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-[#1b263b]" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mt-6 mb-2">Securing Image</h3>
                    <p className="text-[#616161] text-center">Encrypting and storing your image securely on the blockchain...</p>
                  </div>
                )}
              </>
            )}

            <Button
              onClick={() => {
                setImage(null);
                setImageFile(null);
                setShowForm(true);
                form.reset();
              }}
              variant={"secondary"}
              className="absolute top-0 md:-top-5 right-0"
            >
              <X />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
