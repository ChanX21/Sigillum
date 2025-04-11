import { Button } from "@/components/ui/button";

import { Footer } from "@/components/shared/Footer";

import { Header } from "@/components/shared/Header";
import { GoCheck } from "react-icons/go";

export default function Upload() {
  return (
    <>
      <Header />

      <main className="flex flex-col w-full min-h-screen pt-24 px-4 md:px-10">
        <div className="w-full max-w-4xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-16">
            <div className="flex items-center justify-between  text-xs">
              <p>Upload</p>
              <p>Result</p>
              <p>List NFT</p>
            </div>
            <div className="h-4 relative flex items-center px-4">
              <div className="absolute  inset-0 flex justify-between">
                <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center">
                  <GoCheck size={10} />
                </div>
                <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center"></div>
                <div className="rounded-full w-4 h-4 bg-primary text-white flex items-center justify-center"></div>
              </div>
              <div className="border-primary border w-full"></div>
            </div>
          </div>

          {/* Upload area */}
          {/* <div>
            <div className="border-2 border-dashed border-primary h-[400px] rounded-lg p-10 flex flex-col justify-center">
              <div className="flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-semibold mb-2">
                  Drag file to upload
                </h2>
                <Button
                  variant="outline"
                  className="mt-4 rounded-full border-primary w-32"
                >
                  Upload
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Supported file types: JPG, PNG, GIF, SVG
                </p>
              </div>
            </div>

            <div className="text-right mt-10  ">
              <Button variant="default">Secure & Mint</Button>
            </div>
          </div> */}
          {/* Result area */}
          <div>
            <div className="border-2 border-dashed border-primary h-[400px] rounded-lg p-10 flex flex-col justify-center">
              <div className="flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-semibold mb-2">
                  Drag file to upload
                </h2>
                <Button
                  variant="outline"
                  className="mt-4 rounded-full border-primary w-32"
                >
                  Upload
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Supported file types: JPG, PNG, GIF, SVG
                </p>
              </div>
            </div>

            <div className="text-right mt-10  ">
              <Button variant="default">Secure & Mint</Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
