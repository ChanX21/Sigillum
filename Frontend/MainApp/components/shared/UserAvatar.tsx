import Image from "next/image";

interface UserAvatarProps {
  src: string;
  alt: string;
  size?: number;
}

export const UserAvatar = ({ src, alt, size = 40 }: UserAvatarProps) => (
  <div
    className="rounded-full overflow-hidden bg-stone-300 flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    <Image
      alt={alt}
      src={src}
      width={size}
      height={size}
      className="object-cover w-full h-full"
    />
  </div>
);
