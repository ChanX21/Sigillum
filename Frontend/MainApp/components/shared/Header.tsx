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
import axiosInstance from "@/lib/axios";
import NftSearch from "../nft/NftSearch";
const MIST_PER_SUI = 1_000_000_000;

export const Header = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { connected: walletConnected, address, disconnect } = useWallet();
  const [query, setQuery] = useState<string>("")
  const { balance, loading } = useAccountBalance();
  const { data: profile } = useGetProfile();
  const readableSui = (rawBalance: bigint | number) => {
    return (Number(rawBalance) / MIST_PER_SUI).toFixed(2);
  };

  const disconnectWallet = () => {
    disconnect();
    axiosInstance
      .post(
        "/clear-session",
        {},
        {
          withCredentials: true,
        }
      )
      .then((res) => { })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (walletConnected) {
      setShowWalletModal(false);
    }
  }, [walletConnected]);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);


  return (
    <>

      {/* Wallet Modal */}
      <header
        className={`fixed z-50 top-0 w-full h-12 ${walletConnected && profile?.data?.name ? "md:pr-3" : "md:px-0"
          } bg-background border-b border-stone-300`}
      >
        {showWalletModal && (
          <WalletModal setShowWalletModal={setShowWalletModal} />
        )}
        <div className="flex items-center justify-between h-full w-full gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 h-full font-bold text-[#0d0d0d]"
          >
            <Image
              alt="Sigillum"
              width={140}
              height={30}
              src={"/icons/SIGILLUM_LOGO.png"}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center h-full border-l ">
            {/* Search */}
            {walletConnected ? (
              <>
                <div className="flex z-50 items-center rounded-full w-[250px] bg-background h-10 relative">
                  <IoSearchSharp size={15} className="absolute z-50 top-3.5 left-2 text-gray-500" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    value={query || ''}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search NFTs"
                    className="pl-8 pr-2 h-full text-sm shadow-none"
                    onFocus={() => setShowSearchOverlay(true)}
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
                      <DropdownMenuTrigger className="flex md:ml-3  justify-around rounded-full items-center text-sm px-2 outline-none py-2 cursor-pointer border border-gray-100 hover:bg-gray-100 transition-all">
                        <User size={20} className="text-gray-700" />
                      </DropdownMenuTrigger>
                    ) : (
                      <DropdownMenuTrigger className="rounded-none outline-none text-sm h-full px-2 cursor-pointer hover:bg-gray-100 transition-all">
                        {shortenAddress(address)}
                      </DropdownMenuTrigger>
                    )}
                    <DropdownMenuContent className="w-[200px]">
                      <DropdownMenuLabel className="cursor-pointer">
                        {profile?.data?.name ? profile.data.name : "My Account"}
                      </DropdownMenuLabel>
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
                        <DropdownMenuItem className="cursor-pointer">
                          My Nft's
                        </DropdownMenuItem>
                      </Link>
                      <Link href={"/marketplace"}>
                        <DropdownMenuItem className="cursor-pointer">
                          Marketplace
                        </DropdownMenuItem>
                      </Link>
                      <Link href={"/profile"}>
                        <DropdownMenuItem className="cursor-pointer">
                          Profile
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => disconnectWallet()}
                      >
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
              onClick={() => {setShowSearch((prev) => !prev)
                setShowSearchOverlay(false)
              }}
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
                        <DropdownMenuLabel className="cursor-pointer">
                          {profile?.data?.name
                            ? profile.data.name
                            : "My Account"}
                        </DropdownMenuLabel>
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
                          <DropdownMenuItem className="cursor-pointer">
                            My Nft's
                          </DropdownMenuItem>
                        </Link>
                        <Link href={"/profile"}>
                          <DropdownMenuItem className="cursor-pointer">
                            Profile
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => disconnectWallet()}
                        >
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
            className="fixed top-16 left-0 w-full bg-white p-4 border-b border-gray-200 z-50"
          >
            <Input
              type="search"
              placeholder="Search NFTs"
              className="w-full"
              aria-label="Mobile Search NFTs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSearchOverlay(true)}
              autoFocus
            />
            <div className="w-full flex justify-center">
            <div className="absolute w-full r-50 md:mt-[55px] bg-white md:min-w-[550px] h-[450px] z-50 md:rounded-2xl p-5 overflow-scroll">
              <h2 className="text-md font-medium text-[#8e8e8e]">Nft's</h2>
              <div className="flex flex-col h-full gap-3">
                <NftSearch query={query} />
              </div>
            </div>
          </div>
          </div>
        )}
      </header>
      {showSearchOverlay && (
        <>
          <div className="w-full md:flex hidden justify-center">
            <div className="fixed w-full mt-36  r-50 md:mt-[55px] bg-white md:w-[550px] h-[450px] z-50 md:rounded-2xl p-5 overflow-scroll">
              <h2 className="text-md font-medium text-[#8e8e8e]">Nft's</h2>
              <div className="flex flex-col h-full gap-3">
                <NftSearch query={query} />
              </div>
            </div>
          </div>
          <div className="fixed flex justify-center inset-0 bg-black/60 z-10 " onClick={() => setShowSearchOverlay(false)}></div>
        </>
      )}
    </>
  );
};
