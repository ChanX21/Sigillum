// "use client";
// import { Footer } from "@/components/shared/Footer";

// import { Header } from "@/components/shared/Header";
// import { ProgressIndicator } from "@/components/nft/ProgressIndicator";

// import { ListArea } from "@/components/nft/ListArea";
// import { useState } from "react";
// import { UploadArea } from "@/components/nft/UploadArea";
// import { ResultArea } from "@/components/nft/ResultArea";

// export default function Upload() {
//   const [step, setStep] = useState<number>(0);
//   const [stepLoading, setStepLoading] = useState<Boolean>(false);
//   return (
//     <>
//       <Header />

//       <main className="flex flex-col w-full min-h-screen pt-24 px-4 md:px-10 mb-12 ">
//         <div className="w-full max-w-5xl mx-auto">
          
//           <ProgressIndicator step={step} stepLoading={stepLoading}/>

//           {step == 0 && <UploadArea setStep={setStep} setStepLoading={setStepLoading}/>}
//           {step == 1 && <ResultArea setStep={setStep} />}
//           {step == 2 && <ListArea />}
//         </div>
//       </main>

//       <Footer />
//     </>
//   );
// }


export default function Upload() {
  return (
    <>
    Upload
    </>
  )
}