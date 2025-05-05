import { useWallet } from "@suiet/wallet-kit";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAuth() {
  const router = useRouter();
  const { connected: walletConnected, connecting } = useWallet();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Debounce the wallet state changes
    const timer = setTimeout(() => {
      if (!walletConnected && !connecting) {
        router.replace("/");
      }
      setIsLoading(false);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [walletConnected, connecting, router]);

  return {
    isAuthenticated: walletConnected && !connecting,
    isLoading,
  };
}
