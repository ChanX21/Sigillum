"use client"

import { useState, useEffect } from "react"

interface TypewriterProps {
  text: string
  typingSpeed?: number
  className?: string
}

export default function Typewriter({
  text,
  typingSpeed = 100,
  className = "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-center mb-4 tracking-tight",
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState(text)
  
  
  return (
    <h1 className={`${className} md:max-w-4/6`}>
      {displayedText}
      <span className="inline-block animate-[pulse_500ms_ease-in-out_infinite] opacity-100">_</span>
    </h1>
  )
}
