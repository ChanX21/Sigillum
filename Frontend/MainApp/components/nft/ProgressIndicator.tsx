import { GoCheck } from "react-icons/go";

export const ProgressIndicator = ({ step, stepLoading }: { step: number, stepLoading: Boolean }) => {
  return (
    <div className=" mb-16">
      <div className="flex items-center justify-between text-xs">
        <p>Upload</p>
        <p>Result</p>
        <p>List NFT</p>
      </div>
      <div className="h-4 relative flex items-center px-4">
        <div className="absolute inset-0 flex justify-between">
          {stepLoading && step < 1 ? (
            <div className="relative w-6 h-6 bg-[#1b263b] rounded-full">
              <div className="absolute inset-0 border-2 border-[#1b263b]  border-t-[#fff] rounded-full animate-spin m-0.5"></div>
            </div>
          ) : (
            <div className="rounded-full w-6 h-6 bg-primary text-white flex items-center justify-center">
              {step === 1 && <GoCheck size={10} />}
            </div>
          )}
          {stepLoading && step > 0 ? (
            <div className="relative w-6 h-6 bg-[#1b263b] rounded-full">
              <div className="absolute inset-0 border-2 border-[#1b263b]  border-t-[#fff] rounded-full animate-spin m-0.5"></div>
            </div>
          ) : (
            <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center">
              {step > 1 && <GoCheck size={10} />}
            </div>
          )}
          {stepLoading && step > 0 ? (
            <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center">
              {step > 2 && <GoCheck size={10} />}
            </div>) : (
            <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center">
              {step > 0 && <GoCheck size={10} />}
            </div>
          )}
        </div>
        <div className="border-primary border w-full"></div>
      </div>
    </div>
  );
};
