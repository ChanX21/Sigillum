import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/bcs';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { bcs } from '@mysten/sui/bcs';

// use getFullnodeUrl to define Devnet RPC location
const rpcUrl = getFullnodeUrl('devnet');

// create a client connected to devnet
const client = new SuiClient({ url: rpcUrl });

// Sui contract configuration - extract package ID and module name from the fully qualified name
const PACKAGE_ID_WITH_MODULE = process.env.SUI_PACKAGE_ID || '';
const PACKAGE_ID = PACKAGE_ID_WITH_MODULE.split('::')[0];
const MODULE_NAME = (PACKAGE_ID_WITH_MODULE.split('::')[1] || 'sigillum_nft');
const FUNCTION_NAME = 'register_photo';

// Extract Registry object ID from env var (removing any module path if present)
const REGISTRY_ID_WITH_PATH = process.env.SUI_REGISTRY_ID || '';
const REGISTRY_ID = REGISTRY_ID_WITH_PATH.includes('::') 
  ? REGISTRY_ID_WITH_PATH.split('::')[0]  // If it has ::, take the object ID part
  : REGISTRY_ID_WITH_PATH;  // Otherwise use as is

export interface Metadata {
  metadataCID: string;
  image: string;
  sha256Hash: string;
  pHash: string;
  dHash: string;
  watermarkData: string;
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
 * Mint an NFT with the image metadata
 * @param {string} creatorAddress - Blockchain address of the creator
 * @param {string} metadataURI - IPFS URI of the metadata
 * @returns {Promise<Object>} - Minting result including transaction hash and token ID
 */
export const mintNFT = async (creatorAddress: string, metadata: Metadata) => {
  try {
    // Validate inputs
    if (!creatorAddress || !metadata) {
      throw new Error('Creator address and metadata are required');
    }

    // Get private key from environment
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('SUI_PRIVATE_KEY environment variable is not set');
    }
    // Extract required data from metadata
    const imageUrl = metadata.image || '';
    const sha256Hash = metadata.sha256Hash || '';
    const pHash = metadata.pHash || '';
    const dHash = metadata.pHash || ''; // Use pHash as dHash if not available
    const watermarkId = metadata.watermarkData || '';
    
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
      metadata: bcs.string().serialize(`https://${process.env.PINATA_GATEWAY}/ipfs/${metadata.metadataCID}`)
    };
    
    // Call register_photo function on the Sui contract
    const tx = new Transaction();
    tx.moveCall({
      package: PACKAGE_ID,
      module: MODULE_NAME,
      function: FUNCTION_NAME,
      typeArguments: [],
      arguments: [
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
    // Get the created object ID from the transaction response
    const tokenId = result.effects?.created?.[0]?.reference?.objectId || '';
    
    return {
      transactionHash: result.digest,
      tokenId,
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
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
 * @param {Metadata} metadata - Image metadata for verification
 * @returns {Promise<VerificationResult>} - Detailed verification result
 */
export const verifyImageComprehensive = async (
  tokenId: string, 
  metadata: Metadata
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
    const storedImageUrl = safeFieldToString(fields.image_url, 'utf8');
    // 1. Exact hash match (verify_exact_match)
    const exactMatch = storedSha256Hash === metadata.sha256Hash;
    
    // 2. Calculate perceptual hash similarity (if we have valid hashes)
    let similarityScore = 100; // Default to max difference
    let perceptualMatch = false;
    
    if (storedPHash && metadata.pHash) {
      similarityScore = calculateHammingDistance(storedPHash, metadata.pHash);
      perceptualMatch = similarityScore < 10; // Threshold for similarity
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
        creator: safeFieldToString(fields.creator, 'utf8', 'unknown'),
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
 * Find similar NFTs in the registry by pHash
 * @param {string} pHash - Perceptual hash to search for
 * @returns {Promise<Array<{id: string, distance: number}>>} - Array of similar NFTs
 */
async function findSimilarNFTsByPHash(pHash: string): Promise<Array<{id: string, distance: number}>> {
  try {
    // Call find_similar_nfts from the contract
    const pHashBytes = bcs.vector(bcs.u8()).serialize(new TextEncoder().encode(pHash));
    const similarityThreshold = 10; // Threshold value for similarity
    
    // Create a transaction to call the find_similar_nfts function
    const tx = new Transaction();
    tx.moveCall({
      package: PACKAGE_ID,
      module: MODULE_NAME,
      function: 'find_similar_nfts',
      typeArguments: [],
      arguments: [
        tx.object(REGISTRY_ID),
        tx.pure(pHashBytes),
        tx.pure(bcs.u64().serialize(similarityThreshold))
      ],
    });
    
    // We're not actually executing this transaction, just simulating the result
    // In a real implementation, you would use Sui's devInspectTransaction to get the result
    
    // For now, return an empty array (simulating no similar NFTs found)
    return [];
  } catch (error) {
    console.error('Error finding similar NFTs:', error);
    return [];
  }
}

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