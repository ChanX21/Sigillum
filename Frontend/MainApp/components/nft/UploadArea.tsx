import { Button } from "@/components/ui/button";

export const UploadArea = ({
  setStep,
}: {
  setStep: (step: number) => void;
}) => {
  return (
    <div>
      <div className="border-2 border-dashed border-primary h-[400px] rounded-lg p-10 flex flex-col justify-center">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-semibold mb-2">Drag file to upload</h2>
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

      <div className="text-right mt-10">
        <Button onClick={() => setStep(1)} variant="default">
          Secure & Mint
        </Button>
      </div>
    </div>
  );
};
