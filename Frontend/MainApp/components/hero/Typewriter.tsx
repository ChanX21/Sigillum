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
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const typeText = () => {
      if (isTyping) {
        if (displayedText.length < text.length) {
          timeoutId = setTimeout(() => {
            setDisplayedText(text.substring(0, displayedText.length + 1))
          }, typingSpeed)
        } else {
          setTimeout(() => setIsTyping(false), 1000)
        }
      } else {
        if (displayedText.length > 0) {
          timeoutId = setTimeout(() => {
            setDisplayedText(text.substring(0, displayedText.length - 1))
          }, typingSpeed / 2)
        } else {
          setTimeout(() => setIsTyping(true), 500)
        }
      }
    }

    typeText()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [displayedText, isTyping, text, typingSpeed])

  return (
    <h1 className={`${className} md:max-w-4/6`}>
      {displayedText}
      <span className="inline-block animate-pulse">_</span>
    </h1>
  )
}
