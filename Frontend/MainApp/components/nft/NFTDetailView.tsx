import { Button } from "@/components/ui/button";
import { FaEthereum } from "react-icons/fa";
import { UserAvatar } from "../shared/UserAvatar";

export const NFTDetailView = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-4 border-b border-stone-300">
          Human Austrian Briar Art
        </h1>
        <div className="flex items-center ">
          <div className="bg-primary rounded-full p-1" />
          <div className=" text-primary px-3 py-1  text-sm">Live Auction</div>
        </div>
      </div>

      <div className="flex gap-8">
        <div>
          <p className="text-sm text-gray-500">Current Bid</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold">0.15 ETH</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Ends in</p>
          <p className="text-2xl font-semibold">4h 30m</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 border border-stone-300 rounded-xl p-4">
          <input
            type="number"
            className="flex-1 bg-transparent outline-none h-full "
            placeholder="0.165"
          />
          <span className="text-lg font-medium">ETH</span>
        </div>

        <Button className="w-full py-6 text-lg rounded-md" size="lg">
          Place a Bid
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-xs">
            All Bids{" "}
            <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded-full">
              2
            </span>
          </h2>
        </div>
        <div className="flex items-center justify-between py-4 border-t">
          <div className="flex items-center gap-3">
            <UserAvatar src="/user.png" alt="User avatar" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                0x9E64c91F7a0497c289...
              </span>
              <span className="text-xs bg-primary/10 w-fit text-primary px-2 py-0.5 rounded">
                1st bid
              </span>
            </div>
          </div>
          <p className="font-medium">0.15 ETH</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Description</h2>
        <p className="text-gray-600">
          I believe that during our lifetime. Once or twice in a while, there
          will be a magic moment. This piece was inspired by my special time. I
          think it would be good if I had magic.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Details</h2>
        <div className="">
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Blockchain</span>
            <div className="flex items-center gap-2">
              <FaEthereum />
              <span>Ethereum</span>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Token ID</span>
            <span>12</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-stone-300">
            <span className="text-gray-600">Contract</span>
            <div className="flex items-center gap-2">
              <span className="text-primary">0x9E64...280a20348</span>
              <button className="text-primary">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-b border-stone-300">
            <span className="text-gray-600">Metadata</span>
            <span className="text-primary">IPFS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
