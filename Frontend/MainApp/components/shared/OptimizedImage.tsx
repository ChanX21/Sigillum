import Image, { ImageProps } from "next/image";
import { useState, useCallback, memo } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  imageName?: string;
  isProfile?: boolean;
  fallbackSrc?: string;
}

function OptimizedImage({
  src,
  alt,
  imageName,
  priority,
  sizes = "100vw",
  loading = "lazy",
  quality = 80,
  fallbackSrc = "/fallback.png",
  className = "",
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const handleLoadingComplete = () => {
    setLoaded(true);
  };

  const handleError = useCallback(() => {
    if (!useFallback && fallbackSrc !== src) {
      setUseFallback(true); // switch to fallback only once
      setLoaded(false); // reset loaded state for fallback
    }
  }, [useFallback, fallbackSrc, src]);

  const imageSrc = useFallback ? fallbackSrc : src;
  
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="w-12 h-12 rounded-full animate-pulse bg-gray-300" />
        </div>
      )}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        loading={loading}
        quality={quality}
        className={` rounded-4xl transition-opacity duration-500 ${className} ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoadingComplete={handleLoadingComplete}
        onError={handleError}
        {...props}
      />
    </div>
  );
}

export default memo(OptimizedImage);
