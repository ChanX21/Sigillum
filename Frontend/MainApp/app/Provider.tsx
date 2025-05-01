'use client'
import { WalletProvider } from "@suiet/wallet-kit";
import QueryProvider from "@/lib/query-provider";
import React from "react";
import { SessionDisconnect } from "@/lib/session-disconnect-provider";


export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <WalletProvider autoConnect={true}>
                <SessionDisconnect>
                {children}
                </SessionDisconnect>
            </WalletProvider>
        </QueryProvider>
    )
}