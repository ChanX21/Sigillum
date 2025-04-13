/*
/// Module: sigillum_contracts
module sigillum_contracts::sigillum_contracts;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

// contract cleanup required 


module sigillum_contracts::sigillum_nft {
    // use sui::object::{Self, UID};
    // use sui::transfer;
    // use sui::tx_context::{Self, TxContext};
    use std::string::{String};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};
    use sui::vec_set::{Self, VecSet};
    // use sui::test_utils::{Self};

     // Capability for NFT stamping 
    public struct AdminCap has key, store {
        id: UID
    }

    
    // Main PhotoNFT struct
    public struct PhotoNFT has key, store {
        id: UID,
        creator: address,
        image_url: vector<u8>,       // IPFS/Arweave URL
        sha256_hash: vector<u8>,     // Exact binary hash
        phash: vector<u8>,           // Perceptual hash
        dhash: vector<u8>,           // Difference hash (another perceptual hash variant)
        watermark_id: vector<u8>,    // ID embedded in steganographic watermark
        timestamp: u64,              // Creation timestamp
        metadata: String,            // Additional photo metadata (JSON string)
    }

    // Registry to track NFTs by pHash
    public struct Registry has key {
        id: UID,
        // Maps phash to a set of NFT IDs (since multiple similar images may have the same phash)
        phash_to_nfts: Table<vector<u8>, VecSet<address>>,
    }

    // Events
    public struct PhotoRegistered has copy, drop {
        photo_id: address,
        creator: address,
        timestamp: u64,
    }

    // === Initialization ===
    fun init(ctx: &mut TxContext) {
        // Create and share the Registry
        let registry = Registry {
            id: object::new(ctx),
            phash_to_nfts: table::new(ctx),
        };

        transfer::transfer(
            AdminCap { id: object::new(ctx) },
            tx_context::sender(ctx)
        );
        
        transfer::share_object(registry);
    }
    
    // For testing purposes only
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }

    // === Core Functions ===

    // Register a new photo and mint NFT
    public entry fun register_photo(
        _: &AdminCap,
        registry: &mut Registry,
        image_url: vector<u8>,
        sha256_hash: vector<u8>,
        phash: vector<u8>,
        dhash: vector<u8>,
        watermark_id: vector<u8>,
        metadata: String,
        ctx: &mut TxContext
    ) {
        let photo_nft = PhotoNFT {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            image_url,
            sha256_hash,
            phash,
            dhash,
            watermark_id,
            timestamp: tx_context::epoch(ctx),
            metadata,
        };
        
        let photo_id = object::uid_to_address(&photo_nft.id);
        
        // Register the NFT in the registry by pHash
        if (!table::contains(&registry.phash_to_nfts, phash)) {
            table::add(&mut registry.phash_to_nfts, phash, vec_set::empty<address>());
        };
        
        let nft_set = table::borrow_mut(&mut registry.phash_to_nfts, phash);
        vec_set::insert(nft_set, photo_id);
        
        event::emit(PhotoRegistered {
            photo_id,
            creator: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx),
        });
        
        transfer::transfer(photo_nft, tx_context::sender(ctx));
    }

    // Transfer ownership of a photo NFT
    public entry fun transfer_photo(
        photo: PhotoNFT,
        recipient: address
    ) {
        transfer::transfer(photo, recipient);
    }
    
    // === Lookup Functions ===
    
    // Get all NFT IDs matching a pHash
    public fun get_nfts_by_phash(
        registry: &Registry,
        phash: vector<u8>
    ): vector<address> {
        if (!table::contains(&registry.phash_to_nfts, phash)) {
            return vector::empty<address>()
        };
        
        let nft_set = table::borrow(&registry.phash_to_nfts, phash);
        vec_set::into_keys(*nft_set)
    }
    
    // Get a single NFT ID matching a pHash (returns the first match if multiple exist)
    public fun get_first_nft_by_phash(
        registry: &Registry,
        phash: vector<u8>
    ): (bool, address) {
        if (!table::contains(&registry.phash_to_nfts, phash)) {
            return (false, @0x0)
        };
        
        let nft_set = table::borrow(&registry.phash_to_nfts, phash);
        let nft_ids = vec_set::into_keys(*nft_set);
        
        if (vector::is_empty(&nft_ids)) {
            (false, @0x0)
        } else {
            (true, *vector::borrow(&nft_ids, 0))
        }
    }
    
    // Find similar NFTs using perceptual hash (for exact phash match only)
    // For a real implementation, you would need an off-chain indexer to find similar hashes
    public fun find_similar_nfts(
        registry: &Registry,
        phash: vector<u8>,
        similarity_threshold: u64
    ): VecMap<address, u64> {
        let mut result = vec_map::empty<address, u64>();
        
        // In a real implementation, finding similar hashes requires
        // either a specialized index or an off-chain service
        //
        // Here we only check for exact phash matches
        if (table::contains(&registry.phash_to_nfts, phash)) {
            let nft_set = table::borrow(&registry.phash_to_nfts, phash);
            let nft_ids = vec_set::into_keys(*nft_set);
            
            let mut j = 0;
            let nfts_len = vector::length(&nft_ids);
            
            while (j < nfts_len) {
                let nft_id = *vector::borrow(&nft_ids, j);
                vec_map::insert(&mut result, nft_id, 0); // Exact match = 0 distance
                j = j + 1;
            };
        };
        
        result
    }
    
    // Helper function to directly check if an NFT exists with the given pHash
    public fun exists_by_phash(
        registry: &Registry,
        phash: vector<u8>
    ): bool {
        table::contains(&registry.phash_to_nfts, phash)
    }

    // === View Functions ===

    // Check if an image hash matches a registered photo
    public fun verify_exact_match(
        photo: &PhotoNFT,
        hash_to_check: vector<u8>
    ): bool {
        photo.sha256_hash == hash_to_check
    }

    // Calculate hamming distance between two hashes (for perceptual matching)
    public fun calculate_hash_similarity(
        hash1: vector<u8>,
        hash2: vector<u8>
    ): u64 {
        let len = vector::length(&hash1);
        assert!(len == vector::length(&hash2), 0);
        
        let mut distance = 0u64;
        let mut i = 0;
        
        while (i < len) {
            let byte1 = *vector::borrow(&hash1, i);
            let byte2 = *vector::borrow(&hash2, i);
            let xor_result = byte1 ^ byte2;
            
            // Count set bits in XOR result (Hamming weight)
            let mut count = 0u8;
            let mut temp = xor_result;
            
            while (temp > 0) {
                count = count + (temp & 1);
                temp = temp >> 1;
            };
            
            distance = distance + (count as u64);
            i = i + 1;
        };
        
        distance
    }

    // Get photo creator
    public fun get_creator(photo: &PhotoNFT): address {
        photo.creator
    }

    // Get creation timestamp
    public fun get_timestamp(photo: &PhotoNFT): u64 {
        photo.timestamp
    }
    
    // Get pHash from a photo
    public fun get_phash(photo: &PhotoNFT): vector<u8> {
        photo.phash
    }
}