import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/bcs';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { bcs } from '@mysten/sui/bcs';

// use getFullnodeUrl to define Devnet RPC location
const rpcUrl = getFullnodeUrl('testnet');

// create a client connected to devnet
const client = new SuiClient({ url: rpcUrl });

// Sui contract configuration - extract package ID and module name from the fully qualified name
const PACKAGE_ID_WITH_MODULE = process.env.SUI_PACKAGE_ID || '';
const PACKAGE_ID = PACKAGE_ID_WITH_MODULE.split('::')[0];
const MODULE_NAME = (PACKAGE_ID_WITH_MODULE.split('::')[1] || 'sigillum_nft');
const FUNCTION_NAME = 'register_photo';
const REGISTRY_ID = process.env.SUI_REGISTRY_ID?.split('::')[0] || '';
const ADMIN_CAP = process.env.SUI_ADMIN_CAP || '';

// Marketplace contract configuration
const MARKETPLACE_PACKAGE_ID = process.env.MARKETPLACE_PACKAGE_ID?.split('::')[0] || '';
const MARKETPLACE_MODULE = process.env.MARKETPLACE_PACKAGE_ID?.split('::')[1] || 'sigillum_marketplace';
const MARKETPLACE_OBJECT_ID = process.env.MARKETPLACE_OBJECT_ID || '';
const CREATE_SOFT_LISTING_FUNCTION = 'create_soft_listing';
const MARKETPLACE_ADMIN_CAP = process.env.MARKETPLACE_ADMIN_CAP || '';


export interface ListingOptions {
  owner: string;
  minBid?: number;
  description?: string;
  endTime?: number; // Epoch time in seconds
  metadataCID?: string;
}

export interface VerificationResult {
  isAuthentic: boolean;
  exactMatch: boolean;
  perceptualMatch?: boolean;
  similarityScore?: number;
  tokenDetails: {
    tokenId: string;
    creator: string;
    timestamp: number;
    metadata: string;
    imageUrl: string;
  };
  registryResults?: {
    similarNFTs: Array<{
      id: string;
      distance: number;
    }>;
  };
}

/**
 * Mint an NFT with the image metadata and optionally create a soft listing
 * @param {string} creatorAddress - Blockchain address of the creator
 * @param {string} imageUrl - Image URL
 * @param {string} vectorCid - Vector CID of the image
 * @param {string} watermarkCID - Watermark CID of the image
 * @param {string} metadataCID - Metadata CID of the image
 * @returns {Promise<Object>} - Minting result including transaction hash and token ID
 */
export const mintNFT = async (
  creatorAddress: string, 
  imageUrl: string,
  vectorCid: string,
  watermarkCID: string,
  metadataCID: string,
) => {
  try {
    // Validate inputs
      if (!creatorAddress || !imageUrl || !vectorCid || !watermarkCID || !metadataCID) {
      throw new Error('Creator address, image URL, vector CID, watermark CID, and metadata CID are required');
    }

    // Get private key from environment
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('SUI_PRIVATE_KEY environment variable is not set');
    }
    
    // Create keypair from private key
    const watermarkId = watermarkCID || '';
    
    // Create keypair from private key
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    
    // Serialize data for transaction
    const txData = {
      registryId: REGISTRY_ID,
      imageUrl: bcs.vector(bcs.u8()).serialize(new TextEncoder().encode(imageUrl)),
      vectorUrl: bcs.vector(bcs.u8()).serialize(new TextEncoder().encode(vectorCid)),
      watermarkId: bcs.vector(bcs.u8()).serialize(new TextEncoder().encode(watermarkId)),
      metadata: bcs.string().serialize(`https://${process.env.PINATA_GATEWAY}/ipfs/${metadataCID}`)
    };
    
    // Create the transaction
    const tx = new Transaction();
    
    // Add the register_photo call
    tx.moveCall({
      package: PACKAGE_ID,
      module: MODULE_NAME,
      function: FUNCTION_NAME,
      typeArguments: [],
      arguments: [
        tx.object(ADMIN_CAP),
        tx.object(REGISTRY_ID),
        tx.pure(txData.imageUrl),
        tx.pure.address(creatorAddress),
        tx.pure(txData.vectorUrl),
        tx.pure(txData.watermarkId),
        tx.pure(txData.metadata)
      ],
    });
        // Sign and execute the transaction
        const result = await client.signAndExecuteTransaction({
          transaction: tx,
          signer: keypair,
          options: {
            showEffects: true,
            showEvents: true
      }
    });
    return {
      transactionHash: result.digest,
      tokenId: (result.events?.[0]?.parsedJson as { photo_id: string })?.photo_id || ''
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw error;
  }
};

/**
 * Soft listing
 * @param {string} tokenId - NFT token ID
 * @param {ListingOptions} listingOptions - Listing options
 * @returns {Promise<string>} - Listing ID
 */
export const createSoftListing = async (tokenId: string, listingOptions: ListingOptions) => {
  try {
    // Validate inputs
    if (!tokenId || !listingOptions) {
      throw new Error('Token ID and listing options are required');
    }

    // Get private key from environment
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('SUI_PRIVATE_KEY environment variable is not set');
    }

      // Create keypair from private key
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    // Create the transaction
    const tx = new Transaction();
    // Add the create_soft_listing call
    tx.moveCall({
      package: MARKETPLACE_PACKAGE_ID,
      module: MARKETPLACE_MODULE,
      function: CREATE_SOFT_LISTING_FUNCTION,
      typeArguments: [],
      arguments: [
        tx.object(MARKETPLACE_ADMIN_CAP),
        tx.object(MARKETPLACE_OBJECT_ID),
        tx.pure.address(tokenId),
        tx.pure.address(listingOptions.owner),
        tx.pure(bcs.u64().serialize(BigInt(listingOptions.minBid || 0))),
        tx.pure(bcs.string().serialize(listingOptions.description || '')),
        tx.pure(bcs.string().serialize(JSON.stringify({ ipfs: listingOptions.metadataCID }))),
        tx.pure(bcs.u64().serialize(BigInt(listingOptions.endTime || 0)))
      ],
    });

    // Sign and execute the transaction
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showEvents: true
      }
    });

    return (result.events?.[0]?.parsedJson as { listing_id: string })?.listing_id || '';
  } catch (error) {
    console.error('Error creating soft listing:', error);
    throw error;
  }
};