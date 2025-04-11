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
 * Verify an image on the blockchain
 * @param {string} tokenId - NFT token ID
 * @param {string} sha256Hash - SHA-256 hash of the image
 * @returns {Promise<boolean>} - Verification result
 */
export const verifyImage = async (tokenId: string, sha256Hash: string): Promise<boolean> => {
  try {
    // Get object data from Sui
    const objectData = await client.getObject({
      id: tokenId,
      options: { showContent: true }
    });
    
    // Extract hash from object content
    const content = objectData.data?.content as any;
    const storedHash = content?.fields?.sha256_hash;
    
    // Convert storedHash from Sui's base64 format to hex string for comparison
    const storedHashHex = Buffer.from(fromBase64(storedHash || '')).toString('hex');
    
    // Compare hashes
    return storedHashHex === sha256Hash;
  } catch (error) {
    console.error('Error verifying image:', error);
    return false;
  }
};