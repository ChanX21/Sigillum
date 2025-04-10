/*
/// Module: sigillum_contracts
module sigillum_contracts::sigillum_contracts;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module sigillum_contracts::photo_nft {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{String};
    use sui::event;

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

    // Events
    public struct PhotoRegistered has copy, drop {
        photo_id: address,
        creator: address,
        timestamp: u64,
    }

    // === Initialization ===
    fun init(ctx: &mut TxContext) {
        // Empty initialization - no display config or admin features
    }

    // === Core Functions ===

    // Register a new photo and mint NFT
    public entry fun register_photo(
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
}