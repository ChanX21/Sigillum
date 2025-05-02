import type React from "react"
import type { Metadata } from "next"
import { Albert_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const albertSans = Albert_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SIGILLUM - Image Verification",
  description: "Verify the authenticity and provenance of images",
  icons: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      url: 'icons/light/favicon.ico',
      media: '(prefers-color-scheme: light)',
    },
    {
      rel: 'icon',
      type: 'image/x-icon',
      url: 'icons/dark/favicon.ico',
      media: '(prefers-color-scheme: dark)',
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${albertSans.className} bg-white`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster /> 
        </ThemeProvider>
      </body>
    </html>
  )
}