'use client'
import { WalletProvider } from "@suiet/wallet-kit";
import React from "react";


export function Provider({ children }: { children: React.ReactNode }) {
    return <WalletProvider autoConnect={false} >{children}</WalletProvider>
}