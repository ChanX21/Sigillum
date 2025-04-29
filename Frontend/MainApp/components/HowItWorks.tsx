"use client";
const steps = [
  {
    title: "Upload Your Image",
    desc: "Upload your digital artwork or image to our secure platform.",
  },
  {
    title: "Authenticate",
    desc: "Our system authenticates your image and creates a unique digital signature.",
  },
  {
    title: "Mint as NFT",
    desc: "Convert your authenticated image into an NFT with just a few clicks.",
  },
  {
    title: "List & Verify",
    desc: "List your NFT on our marketplace and use our app to verify authenticity anytime.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full flex flex-col items-center my-16">
      <h2 className="text-2xl md:text-3xl font-bold mb-10">HOW IT WORKS</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-5xl px-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-6 flex flex-col items-start bg-white shadow-sm"
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 font-bold text-lg mb-4">
              {idx + 1}
            </span>
            <h3 className="font-semibold mb-2 text-base">{step.title}</h3>
            <p className="text-xs text-gray-500">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
