"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeAlt?: string
  afterAlt?: string
  height?: number
  width?: number
}

export default function BeforeAfterSlide({
  beforeImage,
  afterImage,
  beforeAlt = "Before image",
  afterAlt = "After image",
  height = 400,
  width = 600,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

    setSliderPosition(percentage)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return

  const touch = e.touches[0]
  const rect = containerRef.current.getBoundingClientRect()
  const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width))
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

  setSliderPosition(percentage)
  }

  useEffect(() => {
    if (!isDragging) return

  const handleTouchMoveWithPrevent = (e: TouchEvent) => {
    e.preventDefault() // allowed only because passive is false
    handleTouchMove(e)
  }

  window.addEventListener("mousemove", handleMouseMove)
  window.addEventListener("mouseup", handleMouseUp)
  window.addEventListener("touchmove", handleTouchMoveWithPrevent, { passive: false })
  window.addEventListener("touchend", handleMouseUp)

  return () => {
    window.removeEventListener("mousemove", handleMouseMove)
    window.removeEventListener("mouseup", handleMouseUp)
    window.removeEventListener("touchmove", handleTouchMoveWithPrevent)
    window.removeEventListener("touchend", handleMouseUp)
  }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden h-full rounded-lg shadow-lg select-none"
      style={{ maxWidth: "100%" }}
    >
      {/* After Image (Full) */}
      <div className="absolute inset-0">
        <Image src={afterImage || "/placeholder.svg"} alt={afterAlt} fill style={{ objectFit: "cover" }} priority />
      </div>

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 h-full overflow-hidden"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <Image src={beforeImage || "/placeholder.svg"} alt={beforeAlt} fill style={{ objectFit: "cover" }} priority />
      </div>

      {/* Slider Control */}
      <div className="absolute inset-y-0" style={{ left: `calc(${sliderPosition}% - 2px)` }}>
        <div className="absolute inset-y-0 w-1 bg-white"></div>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <div className="flex items-center gap-0.5">
            <div className="w-0.5 h-4 bg-gray-400"></div>
            <div className="w-0.5 h-4 bg-gray-400"></div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 text-sm rounded">Authentic Image</div>
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 text-sm rounded">Verified Image</div>
    </div>
  )
}
