"use client";

import { useEffect, useRef, useState } from "react";
import { IoCloseSharp, IoSearchSharp } from "react-icons/io5";
import { Shield, User } from "lucide-react";
import Link from "next/link";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAccountBalance, useWallet } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import WalletModal from "../wallet/WalletModal";
import { shortenAddress } from "@/utils/shortenAddress";
import { SiSui } from "react-icons/si";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useGetProfile } from "@/hooks/useProfile";
import Image from "next/image";
const MIST_PER_SUI = 1_000_000_000;

export const Header = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { connected: walletConnected, address, disconnect } = useWallet();
  const { balance, loading } = useAccountBalance();
  const { data: profile } = useGetProfile()
  const readableSui = (rawBalance: bigint | number) => {
    return (Number(rawBalance) / MIST_PER_SUI).toFixed(2);
  };

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
      setShowWalletModal(false);
    }
  }, [walletConnected]);

  return (
    <>
      {/* Wallet Modal */}
      <header className={`fixed top-0 z-50 w-full h-12 ${walletConnected && profile?.data?.name ? 'md:pr-3' : 'md:px-0'} bg-background border-b border-stone-300`}>
        {showWalletModal && (
          <WalletModal setShowWalletModal={setShowWalletModal} />
        )}
        <div className="flex items-center justify-between h-full w-full gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex bg-black items-center gap-2 px-3 h-full font-bold text-[#0d0d0d]"
          >
            <Image alt="Sigillum"  width={140} height={30} src={'/icons/SIGILLUM_LOGO.png'} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center h-full border-l ">
            {/* Search */}
            {walletConnected ? (
              <>
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
                <Link href={"/secure"} className="h-full block">
                  <Button
                    variant="default"
                    className="rounded-none text-sm px-4 py-2  h-12"
                  >
                    Secure image
                  </Button>
                </Link>

                {/* Balance */}

                {address && (
                  <DropdownMenu>
                    {profile?.data?.name ? (
                      <DropdownMenuTrigger className="flex justify-around rounded-full items-center text-sm px-2 outline-none py-2 cursor-pointer border border-gray-100 hover:bg-gray-100 transition-all">
                        <User size={20} className="text-gray-700" />
                      </DropdownMenuTrigger>
                    ) : (
                      <DropdownMenuTrigger className="rounded-none outline-none text-sm h-full px-2 cursor-pointer hover:bg-gray-100 transition-all">
                        {shortenAddress(address)}
                      </DropdownMenuTrigger>
                    )}
                    <DropdownMenuContent>
                      <DropdownMenuLabel className="cursor-pointer">My Account</DropdownMenuLabel>
                      <DropdownMenuLabel>
                        <div className="flex items-center gap-2 bg-background py-0 rounded-full">
                          <div className="bg-white rounded-full flex items-center justify-center">
                            <SiSui size={15} className="text-gray-700" />
                          </div>
                          <p className="text-sm font-semibold whitespace-nowrap">
                            {balance && readableSui(balance)}
                            {loading && (
                              <div className="relative w-5 h-5">
                                <div className="absolute inset-0 border-2 border-t-[#1b263b] border-[#fff] rounded-full animate-spin"></div>
                              </div>
                            )}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href={"/my-nfts/unlisted"}>
                        <DropdownMenuItem className="cursor-pointer">My Nft's</DropdownMenuItem>
                      </Link>
                      <Link href={"/profile"}>
                        <DropdownMenuItem className="cursor-pointer" >Profile</DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => disconnect()}>
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  className="rounded-none h-full text-sm px-4 py-2"
                  onClick={() => setShowWalletModal(true)}
                >
                  Connect Wallet
                </Button>
              </>
            )}
          </nav>
          {/* Mobile nav */}
          <div className="flex items-center justify-between md:hidden gap-3 h-full">
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
              <>
                <div className="relative">
                  {address && (
                    <DropdownMenu>
                      {profile?.data?.name ? (
                        <DropdownMenuTrigger className="flex justify-around rounded-full items-center text-sm px-2 outline-none py-2 cursor-pointer border border-gray-100 hover:bg-gray-100 transition-all">
                          <User size={20} className="text-gray-700" />
                        </DropdownMenuTrigger>
                      ) : (
                        <DropdownMenuTrigger className="rounded-full text-sm px-4 py-2 border border-gray-300 cursor-pointer hover:bg-gray-100 transition-all">
                          {shortenAddress(address)}
                        </DropdownMenuTrigger>
                      )}
                      <DropdownMenuContent>
                        <DropdownMenuLabel className="cursor-pointer">My Account</DropdownMenuLabel>
                        <DropdownMenuLabel>
                          <div className="flex items-center gap-2 bg-background py-0 rounded-full">
                            <div className="bg-white rounded-full flex items-center justify-center">
                              <SiSui size={15} className="text-gray-700" />
                            </div>
                            <p className="text-sm font-semibold whitespace-nowrap">
                              {balance && readableSui(balance)}
                              {loading && (
                                <div className="relative w-5 h-5">
                                  <div className="absolute inset-0 border-2 border-t-[#1b263b] border-[#fff] rounded-full animate-spin"></div>
                                </div>
                              )}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={"/my-nfts/unlisted"}>
                          <DropdownMenuItem className="cursor-pointer">My Nft's</DropdownMenuItem>
                        </Link>
                        <Link href={"/profile"}>
                          <DropdownMenuItem className="cursor-pointer" >Profile</DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => disconnect()}>
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <Link href={"/secure"} className="w-1/2 h-full">
                  <Button
                    variant="default"
                    className="rounded-none text-sm px-4 py-2 w-full h-full"
                  >
                    Secure image
                  </Button>
                </Link>
              </>
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
    </>
  );
};
