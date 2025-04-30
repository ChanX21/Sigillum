"use client";
import Image from "next/image";

const images = [
  "/carousel1.jpg",
  "/carousel2.jpg",
  "/carousel3.jpg",
  "/carousel4.jpg",
  "/carousel5.jpg",
];

export function ImageCarouselShowcase() {
  return (
    <section className="flex flex-col items-center w-full mb-10">
      <div className="relative w-full flex justify-center">
        <div className="border-2 border-purple-400 rounded-2xl bg-white px-2 py-6 flex items-center gap-2 shadow-lg" style={{minHeight: 260}}>
          {images.map((src, idx) => (
            <div
              key={idx}
              className={`transition-all duration-300 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 shadow ${idx === 2 ? 'w-64 h-64 z-10 scale-110' : 'w-44 h-44 opacity-80'} ${idx === 0 || idx === 4 ? 'hidden md:block' : ''}`}
              style={{ boxShadow: idx === 2 ? '0 4px 24px rgba(80,0,200,0.08)' : undefined }}
            >
              <Image src={src} alt="carousel" fill className="object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute left-1/2 -bottom-8 transform -translate-x-1/2">
          <span className="bg-purple-500 text-white rounded-lg px-4 py-1 text-base font-bold shadow">1300 Hug × 480 Hug</span>
        </div>
      </div>
    </section>
  );
}
