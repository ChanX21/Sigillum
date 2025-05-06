import Image from "next/image";

export function Loading() {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center z-50">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div
            className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow"
            style={{ animationDelay: "-2s" }}
          />
          <div
            className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-primary/30 rounded-full blur-[120px] animate-pulse-slow"
            style={{ animationDelay: "-4s" }}
          />
        </div>

        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)] animate-grid" />
      </div>

      <div className="relative text-center">
        {/* Main logo container with enhanced effects */}
        <div className="relative w-96 h-96 mx-auto mb-16">
          {/* Outer rotating rings with gradient */}
          <div className="absolute inset-0 rounded-full animate-spin-slow opacity-90">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 backdrop-blur-sm"></div>
            <div
              className="absolute inset-[20px] rounded-full border-2 border-primary/30 animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "15s",
              }}
            ></div>
            <div className="absolute inset-[40px] rounded-full border-2 border-primary/40"></div>
          </div>

          {/* Glowing background for logo */}
          <div className="absolute inset-[60px] rounded-full bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center backdrop-blur-sm">
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50 animate-gradient"></div>
            </div>

            {/* Pulsing glow effect */}
            <div className="absolute inset-4 rounded-full bg-primary/5 animate-pulse-slow"></div>

            {/* Logo wrapper with glass effect */}
            <div className="relative w-56 h-56 rounded-full flex items-center justify-center bg-background/70 backdrop-blur-md shadow-2xl">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-transparent"></div>
              {/* <img
                src="/assets/logotrnspt.png"
                alt="Memed Logo"
                className="w-48 h-48 object-contain transform hover:scale-105 transition-all duration-500 drop-shadow-2xl"
              /> */}

              <Image
                alt="Sigillum"
                width={140}
                height={30}
                priority={true}
                src={"/icons/SIGILLUM_LOGO.png"}
              />
            </div>
          </div>
        </div>

        {/* Enhanced loader section */}
        <div className="relative">
          {/* Animated loader bar */}
          <div className="relative h-1 w-64 mx-auto bg-primary/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary rounded-full animate-loader"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>

          {/* Dynamic loading text with fade effect */}
          <div className="mt-6 text-primary/90 font-light tracking-[0.2em] text-sm uppercase">
            <span className="inline-block animate-fade-in transition-all duration-300">
              Initializing
            </span>
            <span className="inline-block animate-bounce">.</span>
            <span
              className="inline-block animate-bounce"
              style={{ animationDelay: "0.2s" }}
            >
              .
            </span>
            <span
              className="inline-block animate-bounce"
              style={{ animationDelay: "0.4s" }}
            >
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
