import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";
import { Provider } from "./Provider";
import { Toaster } from "sonner";


const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGILLUM",
  description: "Secure your digital assets with blockchain technology",
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${albertSans.variable} antialiased bg-white`}>
        <Provider>
          {children}
        </Provider>
        <Toaster />
      </body>
    </html>
  );
}
