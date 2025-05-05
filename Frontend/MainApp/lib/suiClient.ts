import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

const rpcUrl = "https://rpc-testnet.suiscan.xyz"; //getFullnodeUrl("testnet");

// SUI CLIENT
export const client = new SuiClient({ url: rpcUrl });
