import { getFullnodeUrl, SuiClient } from '@mysten/sui/client'

const rpcUrl = getFullnodeUrl('testnet')

// SUI CLIENT
export const client = new SuiClient({ url: rpcUrl })

