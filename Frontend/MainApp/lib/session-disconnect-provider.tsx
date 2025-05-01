import { ReactNode, useEffect } from "react";
import { useWallet } from "@suiet/wallet-kit";
 
const TIMEOUT_DURATION = 24 * 60 * 60 * 1000; // One day in milliseconds

export const SessionDisconnect = ({children}:{children:ReactNode}) => {
    const {connected,disconnect} =useWallet()

    useEffect(() => {
        // Trigger disconnection after the timeout period
        const timeoutId = setTimeout(() => {
          disconnect();
        }, TIMEOUT_DURATION);
    
        // Clean up the timeout when the component unmounts or when the wallet is connected
        return () => clearTimeout(timeoutId);
      }, [connected]);
    return (
        <>
            {children}
        </>
    )
}