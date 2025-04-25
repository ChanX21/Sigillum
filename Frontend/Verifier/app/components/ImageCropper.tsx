import React, { useState } from "react";
import { Cropper, ReactCropperElement } from "react-cropper";
import "react-cropper/node_modules/cropperjs/dist/cropper.css"; // Make sure to import CropperJS's CSS

interface Props {
    imageSrc: string;
    onCropComplete: (croppedImage: File) => void;
}

function ImageCropper({ imageSrc, onCropComplete }: Props) {
    const cropperRef = React.useRef<ReactCropperElement>(null)
    const [isImageReady, setIsImageReady] = useState(false)

    const getCroppedImage = () => {
        const cropper = cropperRef.current?.cropper
        if (cropper && isImageReady) {
            const canvas = cropper.getCroppedCanvas()

            if (!canvas) {
                console.error("Canvas is null")
                return
            }

            canvas.toBlob((blob:any) => {
                if (!blob) {
                    console.error("Failed to create blob")
                    return
                }
                const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" })
                onCropComplete?.(file)
            }, "image/jpeg",1)
        }
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            <Cropper
                src={imageSrc}
                style={{ height: 400, width: "100%" }}
                initialAspectRatio={1}
                viewMode={1}
                guides={true}
                cropBoxResizable={true}
                cropBoxMovable={true}
                dragMode="move"
                responsive={true}
                autoCropArea={1}
                ref={cropperRef}
                ready={() => setIsImageReady(true)} // ensures cropper is initialized
            />

            <button
                onClick={getCroppedImage}
                className="mt-4  text-white px-4 py-2 bg-[#1b263b] hover:bg-[#2d3748] transition-colors rounded disabled:opacity-50"
                disabled={!isImageReady}
            >
                Crop & Continue
            </button>
        </div>
    )
}

export default ImageCropper;
