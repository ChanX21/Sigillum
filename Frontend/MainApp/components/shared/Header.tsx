import { IoSearchSharp } from "react-icons/io5";
import { Input } from "../ui/input";
import { FaEthereum } from "react-icons/fa";
import { Button } from "../ui/button";
import { UserAvatar } from "./UserAvatar";

export const Header = () => (
  <header className="flex justify-between h-16 fixed z-50 w-full p-2 px-10 bg-background border-stone-300 border-b">
    <div className="h-full w-40 bg-white rounded-full" role="banner" />
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
