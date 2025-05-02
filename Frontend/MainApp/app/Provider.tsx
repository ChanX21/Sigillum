'use client'
import { WalletProvider } from "@suiet/wallet-kit";
import QueryProvider from "@/lib/query-provider";
import React from "react";
import { SessionDisconnect } from "@/lib/session-disconnect-provider";
import WalletWatcher from "@/components/wallet/WalletWatcher";


export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <WalletProvider autoConnect={true}>
                <SessionDisconnect>
                    <WalletWatcher />
                    {children}
                </SessionDisconnect>
            </WalletProvider>
        </QueryProvider>
    )
}