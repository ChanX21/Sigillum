"use client";

import { useEffect, useRef, useState } from "react";
import { IoCloseSharp, IoSearchSharp } from "react-icons/io5";
import { FaEthereum } from "react-icons/fa";
import { Shield } from "lucide-react";
import Link from "next/link";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAccountBalance, useWallet } from '@suiet/wallet-kit'
import "@suiet/wallet-kit/style.css"
import WalletModal from "../wallet/WalletModal";
import { shortenAddress } from "@/utils/shortenAddress";


export const Header = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { connected: walletConnected, address, } = useWallet()
  const { balance, loading } = useAccountBalance()
  // Close search if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    if (showSearch) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch]);



  useEffect(() => {
    if (walletConnected) {
      setShowWalletModal(false)
    }
  }, [walletConnected])


  return (
    <>
      {/* Wallet Modal */}
      <header className="fixed top-0 z-50 w-full h-16 px-4 md:px-10 bg-background border-b border-stone-300">
        {showWalletModal && (
          <WalletModal setShowWalletModal={setShowWalletModal} />
        )}
        <div className="flex items-center justify-between h-full w-full gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 bg-white rounded-full px-3 py-2 font-bold text-[#0d0d0d]"
          >
            <div className="flex items-center justify-center w-6 h-6 bg-[#1b263b] rounded-full">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm sm:text-base">SIGILLUM</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3 bg-white p-1 rounded-full">
            {/* Search */}
            <div className="flex items-center rounded-full w-[250px] bg-background h-10 relative">
              <IoSearchSharp
                size={15}
                className="absolute top-3.5 left-2 text-gray-500"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search NFTs"
                className="pl-8 pr-2 h-full text-sm shadow-none"
                aria-label="Search NFTs"
              />
            </div>
            {walletConnected ? (
              <>
                {/* Balance */}
                <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-full">
                  <div className="bg-white p-1.5 rounded-full flex items-center justify-center">
                    <FaEthereum size={15} className="text-gray-700" />
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap">
                    {balance && (balance)}
                    {loading && (
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 border-2 border-t-[#1b263b] border-[#fff] rounded-full animate-spin"></div>
                      </div>
                    )}
                  </p>
                </div>

                <Button
                  variant="default"
                  className="rounded-full text-sm px-4 py-2"
                >
                  Secure image
                </Button>
                {address && (
                  <Button
                    variant="outline"
                    className="rounded-full text-sm px-4 py-2"
                  >
                    {shortenAddress(address)}
                  </Button>

                )}
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  className="rounded-full text-sm px-4 py-2"
                  onClick={() => setShowWalletModal(true)}
                >
                  Connect Wallet
                </Button>
              </>
            )}
          </nav>
          {/* Mobile nav */}
          <div className="flex items-center md:hidden gap-3">
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch((prev) => !prev)}
              className="p-2 rounded-full hover:bg-muted transition"
              aria-label={showSearch ? "Close search" : "Open search"}
            >
              {showSearch ? (
                <IoCloseSharp size={20} className="text-gray-700" />
              ) : (
                <IoSearchSharp size={20} className="text-gray-700" />
              )}
            </button>
            {walletConnected ? (
              <div className="relative">
                {address && (
                  <Button
                    variant="outline"
                    className="rounded-full text-sm px-4 py-2"
                  >
                    {shortenAddress(address)}
                  </Button>

                )}
              </div>
            ) : (
              <Button
                variant="default"
                className="rounded-full text-sm px-4 py-2"
                onClick={() => setShowWalletModal(true)}
              >
                Connect Wallet
              </Button>
            )}

          </div>
        </div>

        {/* Mobile floating search */}
        {showSearch && (
          <div
            ref={searchRef}
            className="absolute top-16 left-0 w-full bg-white p-4 border-b border-gray-200 z-50"
          >
            <Input
              type="search"
              placeholder="Search NFTs"
              className="w-full"
              aria-label="Mobile Search NFTs"
              autoFocus
            />
          </div>
        )}
      </header>
      {walletConnected && (
        <nav className="flex md:hidden items-center gap-3 bg-white p-1 rounded-full mt-16">
          {/* Balance */}
          <div className="flex w-1/2 items-center gap-2 bg-background px-3 py-2 rounded-full">
            <div className="bg-white p-1.5 rounded-full flex items-center justify-center">
              <FaEthereum size={15} className="text-gray-700" />
            </div>
            <p className="text-sm font-semibold whitespace-nowrap">{balance && (balance)}</p>
          </div>

          <Button
            variant="default"
            className="rounded-full text-sm px-4 py-2 w-1/2 h-10"
          >
            Secure image
          </Button>
        </nav>
      )}
    </>
  );
};
