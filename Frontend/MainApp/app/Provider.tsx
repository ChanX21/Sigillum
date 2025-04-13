'use client'
import { WalletProvider } from "@suiet/wallet-kit";
import QueryProvider from "@/lib/query-provider";
import React from "react";


export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <WalletProvider autoConnect={false}>{children}</WalletProvider>
        </QueryProvider>
    )
}