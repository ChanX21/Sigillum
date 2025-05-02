"use client";

import Link from "next/link";
import { Button } from "./ui/button";

export function LandingCta() {
  return (
    <section className="flex flex-col items-center mt-24 mb-12 md:mb-20 w-full">
      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">
        Ready to Secure Your Digital Assets?
      </h2>
      <p className="text-gray-500 text-center mb-6 max-w-xl">
        Join thousands of creators and collectors who trust AUTHNFT for their
        digital authentication needs.
      </p>
      <div className="flex gap-4">
        <Link href="/secure">
          <Button className="bg-black text-white px-6 py-2 rounded-none shadow hover:bg-gray-900 text-sm">
            Get Started Now
          </Button>
        </Link>
        <Link href="https://verifier.sigillum.digital/" target="_blank">
          <Button className="bg-white border border-gray-400 px-6 py-2 text-primary rounded-none shadow text-sm hover:bg-gray-100">
            Verify Your Vision
          </Button>
        </Link>
      </div>
    </section>
  );
}
