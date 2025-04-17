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
 * @param {string} sha256Hash - SHA256 hash of the image
 * @param {string} pHash - Perceptual hash of the image
 * @param {string} dHash - dHash of the image
 * @param {string} watermarkCID - Watermark CID of the image
 * @param {string} metadataCID - Metadata CID of the image
 * @returns {Promise<Object>} - Minting result including transaction hash and token ID
 */
export const mintNFT = async (
  creatorAddress: string, 
  imageUrl: string,
  sha256Hash: string,
  pHash: string,
  dHash: string,
  watermarkCID: string,
  metadataCID: string,
) => {
  try {
    // Validate inputs
    if (!creatorAddress || !imageUrl || !sha256Hash || !pHash || !dHash || !watermarkCID || !metadataCID) {
      throw new Error('Creator address, image URL, SHA256 hash, perceptual hash, dHash, watermark CID, and metadata CID are required');
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
      sha256Hash: bcs.vector(bcs.u8()).serialize(new TextEncoder().encode(sha256Hash)),
      pHash: bcs.vector(bcs.u8()).serialize(new TextEncoder().encode(pHash)),
      dHash: bcs.vector(bcs.u8()).serialize(new TextEncoder().encode(dHash)),
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
        tx.pure(txData.sha256Hash),
        tx.pure(txData.pHash),
        tx.pure(txData.dHash),
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
      tokenId: result.effects?.created?.[0]?.reference?.objectId || ''
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

    // Get private key from environmen  t
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

    return result.effects?.created?.[0]?.reference?.objectId || '';
  } catch (error) {
    console.error('Error creating soft listing:', error);
    throw error;
  }
};

/**
 * Safely convert a field value to string, handling both base64 and byte arrays
 * @param fieldValue - The field value from the blockchain (may be byte array or base64 string)
 * @param encoding - The encoding to use for the output ('hex', 'utf8', etc)
 * @param defaultValue - Default value to return if conversion fails
 * @returns The converted string or default value
 */
function safeFieldToString(fieldValue: any, encoding: BufferEncoding = 'utf8', defaultValue: string = ''): string {
  if (!fieldValue) {
    return defaultValue;
  }

  try {
    // If it's already an array of numbers (bytes), convert directly
    if (Array.isArray(fieldValue)) {
      return Buffer.from(fieldValue).toString(encoding);
    }
    
    // If it's a base64 string, try to decode it
    if (typeof fieldValue === 'string') {
      try {
        return Buffer.from(fromBase64(fieldValue)).toString(encoding);
      } catch (error) {
        // If base64 decoding fails, just return the string as is
        return fieldValue;
      }
    }
    
    // For other types, stringify
    return String(fieldValue);
  } catch (error) {
    console.error('Error converting field to string:', error, 'Original value:', fieldValue);
    return defaultValue;
  }
}

/**
 * Comprehensive verification of an image using the Sui contract
 * @param {string} tokenId - NFT token ID
 * @param {string} sha256Hash - Image hash for verification
 * @param {string} pHash - Perceptual hash for verification
 * @returns {Promise<VerificationResult>} - Detailed verification result
 */
export const verifyImageByHash = async (
  tokenId: string, 
  sha256Hash: string,
  pHash: string,
): Promise<VerificationResult> => {
  try {
    // Get object data from Sui
    const objectData = await client.getObject({
      id: tokenId,
      options: { showContent: true }
    });
    
    if (!objectData.data?.content) {
      throw new Error('NFT data not found');
    }
    
    const content = objectData.data.content as any;
    const fields = content.fields;
    // Convert stored fields to strings
    const storedSha256Hash = safeFieldToString(fields.sha256_hash, 'utf8');
    const storedPHash = safeFieldToString(fields.phash, 'utf8');
    const storedImageUrl = safeFieldToString(fields.image_url, 'utf8')
    // 1. Exact hash match (verify_exact_match)
    const exactMatch = storedSha256Hash === sha256Hash;
    
    // 2. Calculate perceptual hash similarity (if we have valid hashes)
    let similarityScore = 0; // Default to no similarity
    let perceptualMatch = false;
    
    if (storedPHash && pHash) {
      const hammingDistance = calculateHammingDistance(storedPHash, pHash);
      const maxDistance = Math.max(storedPHash.length, pHash.length);
      similarityScore = Math.round(((maxDistance - hammingDistance) / maxDistance) * 100);
      perceptualMatch = similarityScore > 90; // Threshold for similarity (>90% similar)
    }
    
    // 3. Simplified registry check (skipping the actual call to find_similar_nfts)
    const similarNFTs: Array<{id: string, distance: number}> = [];
    
    return {
      isAuthentic: exactMatch,
      exactMatch,
      perceptualMatch,
      similarityScore,
      tokenDetails: {
        tokenId,
        creator: fields.creator,
        timestamp: parseInt(safeFieldToString(fields.timestamp, 'utf8', '0'), 10),
        metadata: safeFieldToString(fields.metadata, 'utf8', ''),
        imageUrl: storedImageUrl
      },
      registryResults: {
        similarNFTs
      }
    };
  } catch (error) {
    console.error('Error verifying image with Sui contract:', error);
    throw error;
  }
};


/**
 * Calculate Hamming distance between two hash strings
 * Simulates the contract's calculate_hash_similarity function
 * @param {string} hash1 - First hash string
 * @param {string} hash2 - Second hash string
 * @returns {number} - Hamming distance
 */
function calculateHammingDistance(hash1: string, hash2: string): number {
  // Ensure hashes are of same length
  const minLength = Math.min(hash1.length, hash2.length);
  let distance = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  // Add remaining length difference to distance
  distance += Math.abs(hash1.length - hash2.length);
  
  return distance;
}