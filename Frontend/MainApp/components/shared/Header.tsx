import { IoSearchSharp } from "react-icons/io5";
import { Input } from "../ui/input";
import { FaEthereum } from "react-icons/fa";
import { Button } from "../ui/button";
import { UserAvatar } from "./UserAvatar";
import { Shield } from "lucide-react";
import Link from "next/link";

export const Header = () => (
  <header className="flex justify-between h-16 fixed z-50 w-full p-2 px-10 bg-background border-stone-300 border-b">
    <Link href="/" className="flex items-center gap-2 bg-white rounded-full p-3 font-bold text-[#0d0d0d]">
      <div className="flex items-center justify-center w-6 h-6 bg-[#1b263b] rounded-full">
        <Shield className="w-3 h-3 text-white" />
      </div>
      SIGILLUM
    </Link>
    <nav className="h-full bg-white rounded-full flex p-1 gap-2">
      <div className="flex rounded-full w-[250px] bg-background h-full relative items-center">
        <IoSearchSharp
          size={15}
          className="absolute top-3.5 left-2 text-gray-500"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search NFTs"
          className="pl-8 shadow-none"
          aria-label="Search NFTs"
        />
      </div>
      <div className="flex justify-between rounded-full w-[120px] bg-background h-full relative items-center px-2">
        <div className="h-fit w-fit p-2 rounded-full bg-white flex items-center">
          <FaEthereum size={15} className="text-gray-700" aria-hidden="true" />
        </div>
        <p className="font-semibold text-sm">1.433 ETH</p>
      </div>

      <Button variant="default" className="rounded-full cursor-pointer">
        Secure image
      </Button>

      <UserAvatar src="/user.png" alt="User profile" />
    </nav>
  </header>
);
