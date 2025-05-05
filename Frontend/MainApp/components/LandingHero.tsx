"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { FiCheck, FiShoppingCart } from "react-icons/fi";
import { TfiWallet } from "react-icons/tfi";
import Typewriter from "./hero/Typewriter";
import { useWallet } from "@suiet/wallet-kit";
import { useState } from "react";
import { useEffect } from "react";
import WalletModal from "./wallet/WalletModal";

export function LandingHero() {
  const { connected: walletConnected, connecting } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isWalletDisconnected, setIsWalletDisconnected] = useState(true);

  useEffect(() => {
    // Only update state when we're not in connecting state
    if (!connecting) {
      setIsWalletConnected(walletConnected);
      setIsWalletDisconnected(!walletConnected);
    }
  }, [walletConnected, connecting]);

  return (
    <section className="flex flex-col items-center justify-center mt-12 mb-10">
      {showWalletModal && (
        <WalletModal setShowWalletModal={setShowWalletModal} />
      )}
      <Typewriter text="CELEBRATING AUTHENTIC MOMENTS" typingSpeed={150} />

      <p className="text-gray-500 text-center max-w-[600px] mb-6 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
        A new home for real photos.
        <br className="hidden sm:block" />
        Where authenticity is valued and every image tells its true story.
      </p>
      {isWalletConnected && (
        <div className="flex items-center justify-center space-x-4">
          <Link href={"https://verifier.sigillum.digital/"} target="_blank">
            <Button
              className="bg-black text-white font-medium px-4 py-2 rounded-none shadow hover:bg-gray-900 transition text-sm flex items-center gap-2"
              style={{ width: "160px" }}
            >
              <FiCheck className="text-lg" />
              Verify your vision
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button
              variant="outline"
              className="bg-white border border-gray-400 px-4 py-2 text-primary rounded-none shadow text-sm hover:bg-gray-100 flex items-center gap-2"
              style={{ width: "150px" }}
            >
              <FiShoppingCart className="text-lg" />
              Marketplace
            </Button>
          </Link>
        </div>
      )}
      {isWalletDisconnected && (
        <div className="flex items-center justify-center space-x-4">
          <Button
            className="bg-black text-white font-medium px-4 py-2 rounded-none shadow hover:bg-gray-900 transition text-sm flex items-center gap-2"
            style={{ width: "160px" }}
            onClick={() => {
              setShowWalletModal(true);
            }}
          >
            <TfiWallet className="text-lg" />
            Connect wallet
          </Button>
        </div>
      )}
    </section>
  );
}
