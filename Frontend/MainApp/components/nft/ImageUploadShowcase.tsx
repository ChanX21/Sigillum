"use client";
import React from "react";
import { IoIosAddCircleOutline } from "react-icons/io";
import Image from "next/image";
// Dummy images for the carousel; replace with real image URLs as needed
const carouselImages = [
  "/image.png",
  "/image2.png",
  "/image.png",
  "/image2.png",
  "/image.png",
  "/image2.png",
  "/image.png",
  "/image2.png",
];

export function ImageUploadShowcase({
  onUpload,
}: {
  onUpload?: (file: File) => void;
}) {
  // TODO: Implement drag-and-drop and file input logic
  return (
    <div className="flex flex-col items-center w-full h-[80vh] justify-end relative ">
      <div className="flex gap-4 mb-8 w-full justify-center overflow-auto">
        {carouselImages.map((src, idx) => (
          <div
            key={idx}
            className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-xl overflow-hidden shadow-md flex-shrink-0"
          >
            <Image
              src={src}
              alt="carousel"
              fill
              className="object-cover"
              priority
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center absolute top-1/3 md:top-1/2   left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <h1 className="text-3xl font-bold text-center mb-2">
          Protect What You Create
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Drag and drop your image, or click to upload
        </p>
        <label
          htmlFor="img-upload"
          className="rounded-xl w-64 h-72 flex flex-col items-center justify-center cursor-pointer transition  hover:border-primary bg-[rgba(255,255,255,0.2)] backdrop-blur-[5px] border-[1px] border-dashed border-gray-300"
        >
          <span className="text-4xl text-gray-400 mb-2">
            <IoIosAddCircleOutline size={24} />
          </span>
          <span className="text-gray-400">Upload Image</span>
          <input
            id="img-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0] && onUpload) {
                onUpload(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
