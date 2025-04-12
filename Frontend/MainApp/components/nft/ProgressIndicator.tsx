import { GoCheck } from "react-icons/go";

export const ProgressIndicator = ({ step }: { step: number }) => {
  return (
    <div className="mb-16">
      <div className="flex items-center justify-between text-xs">
        <p>Upload</p>
        <p>Result</p>
        <p>List NFT</p>
      </div>
      <div className="h-4 relative flex items-center px-4">
        <div className="absolute inset-0 flex justify-between">
          <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center">
            <GoCheck size={10} />
          </div>
          <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center">
            {step > 0 && <GoCheck size={10} />}
          </div>
          <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center">
            {step > 1 && <GoCheck size={10} />}
          </div>
        </div>
        <div className="border-primary border w-full"></div>
      </div>
    </div>
  );
};
