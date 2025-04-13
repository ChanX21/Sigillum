import Image from "next/image";
import { useMemo } from "react";

interface UserAvatarProps {
  src?: string;
  alt: string;
  size?: number;
  walletAddress?: string; // New prop for wallet address
}

export const UserAvatar = ({
  src,
  alt,
  size = 40,
  walletAddress,
}: UserAvatarProps) => {
  // Generate avatar URL from wallet address if no src is provided
  const avatarSrc = useMemo(() => {
    if (src) return src;
    if (walletAddress) {
      // Use DiceBear's avataaars style with valid parameters
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        walletAddress.toLowerCase()
      )}&c0aede,d1d4f9&radius=50`;
    }
    return "/user.png"; // Fallback default avatar
  }, [src, walletAddress]);

  return (
    <div
      className="rounded-full overflow-hidden bg-stone-300 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Use unoptimized for SVGs from external sources */}
      <Image
        alt={alt}
        src={avatarSrc}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        unoptimized={true}
        priority
      />
    </div>
  );
};
