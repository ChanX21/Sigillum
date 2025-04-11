import Image from "next/image";
import { NFTDetails } from "./NFTDetails";
import { ListForm } from "./ListForm";

export const ListArea = () => {
  return (
    <div>
      <div className="min-h-[550px] rounded-lg p-10 grid grid-cols-2 w-full gap-36">
        <div className="col-span-1 flex flex-col gap-10">
          <div className="w-full aspect-[16/9] relative overflow-hidden h-[90%] max-h-[300px]">
            <Image
              alt="nft"
              src="/image.png"
              fill
              className="rounded-4xl object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>
          <NFTDetails compact />
        </div>

        <div className="col-span-1 flex flex-col border border-primary rounded-xl shadow-lg p-6">
          <div>
            <p className="font-semibold text-xl">List NFT</p>
            <p className="text-sm text-gray-500 font-medium">
              List your nft on marketplace
            </p>
          </div>
          <div className="flex pt-12 flex-1 flex-col gap-3">
            <ListForm />
          </div>
        </div>
      </div>
    </div>
  );
};
