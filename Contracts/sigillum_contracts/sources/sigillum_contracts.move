// ███████ ██  ██████  ██ ██      ██      ██    ██ ███    ███     ███    ██ ███████ ████████ ███████ 
// ██      ██ ██       ██ ██      ██      ██    ██ ████  ████     ████   ██ ██         ██    ██      
// ███████ ██ ██   ███ ██ ██      ██      ██    ██ ██ ████ ██     ██ ██  ██ █████      ██    ███████ 
//      ██ ██ ██    ██ ██ ██      ██      ██    ██ ██  ██  ██     ██  ██ ██ ██         ██         ██ 
// ███████ ██  ██████  ██ ███████ ███████  ██████  ██      ██     ██   ████ ██         ██    ███████ 
                                                                                                  
                                                                                                  



module sigillum_contracts::sigillum_nft {
    use std::string::{String};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};
    use sui::vec_set::{Self, VecSet};

     // Capability for NFT stamping 
    public struct AdminCap has key, store {
        id: UID
    }

    
    // Main PhotoNFT struct
    public struct PhotoNFT has key, store {
        id: UID,
        creator: address,
        image_url: vector<u8>,       // IPFS/Arweave URL
        // sha256_hash: vector<u8>,     // Exact binary hash
        // phash: vector<u8>,           // Perceptual hash
        // dhash: vector<u8>,           // Difference hash (another perceptual hash variant)
        vector_url: vector<u8>,      // Vector url of the image
        watermark_id: vector<u8>,    // ID embedded in steganographic watermark
        timestamp: u64,              // Creation timestamp
        metadata: String,            // Additional photo metadata (JSON string)
    }

    // Registry to track NFTs by pHash
    public struct Registry has key {
        id: UID,
        // Maps phash to a set of NFT IDs (since multiple similar images may have the same phash)
        vector_url_to_nfts: Table<vector<u8>, VecSet<address>>,
    }

    // Events
    public struct PhotoRegistered has copy, drop {
        photo_id: address,
        creator: address,
        nft_owner: address,
        timestamp: u64,
    }

    // === Initialization ===
    fun init(ctx: &mut TxContext) {
        // Create and share the Registry
        let registry = Registry {
            id: object::new(ctx),
            vector_url_to_nfts: table::new(ctx),
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
        owner: address,
        // sha256_hash: vector<u8>,
        // phash: vector<u8>,
        // dhash: vector<u8>,
        vector_url:vector<u8>,
        // asset_id: vector<u8>,
        watermark_id: vector<u8>,
        metadata: String,
        ctx: &mut TxContext
    ) {
        let photo_nft = PhotoNFT {
            id: object::new(ctx),
            creator: owner,
            image_url,
            // sha256_hash,
            // phash,
            // dhash,
            vector_url,
            // asset_id,
            watermark_id,
            timestamp: tx_context::epoch(ctx),
            metadata,
        };
        
        let photo_id = object::uid_to_address(&photo_nft.id);
        
        // Register the NFT in the registry by pHash
        if (!table::contains(&registry.vector_url_to_nfts, vector_url)) {
            table::add(&mut registry.vector_url_to_nfts, vector_url, vec_set::empty<address>());
        };
        
        let nft_set = table::borrow_mut(&mut registry.vector_url_to_nfts, vector_url);
        vec_set::insert(nft_set, photo_id);
        
        event::emit(PhotoRegistered {
            photo_id,
            creator: tx_context::sender(ctx),
            nft_owner: owner,
            timestamp: tx_context::epoch(ctx),
        });
        
        transfer::transfer(photo_nft, owner);
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
    public fun get_nfts_by_vector_url(
        registry: &Registry,
        vector_url: vector<u8>
    ): vector<address> {
        if (!table::contains(&registry.vector_url_to_nfts, vector_url)) {
            return vector::empty<address>()
        };
        
        let nft_set = table::borrow(&registry.vector_url_to_nfts, vector_url);
        vec_set::into_keys(*nft_set)
    }
    
    // Get a single NFT ID matching a pHash (returns the first match if multiple exist)
    public fun get_first_nft_by_vector_url(
        registry: &Registry,
        vector_url: vector<u8>
    ): (bool, address) {
        if (!table::contains(&registry.vector_url_to_nfts, vector_url)) {
            return (false, @0x0)
        };
        
        let nft_set = table::borrow(&registry.vector_url_to_nfts, vector_url);
        let nft_ids = vec_set::into_keys(*nft_set);
        
        if (vector::is_empty(&nft_ids)) {
            (false, @0x0)
        } else {
            (true, *vector::borrow(&nft_ids, 0))
        }
    }
    
    
    // Helper function to directly check if an NFT exists with the given pHash
    public fun exists_by_vector_url(
        registry: &Registry,
        vector_url: vector<u8>
    ): bool {
        table::contains(&registry.vector_url_to_nfts, vector_url)
    }

    // === View Functions ===


    // Get photo creator
    public fun get_creator(photo: &PhotoNFT): address {
        photo.creator
    }

    // Get creation timestamp
    public fun get_timestamp(photo: &PhotoNFT): u64 {
        photo.timestamp
    }
    
    public fun get_vector_url(photo: &PhotoNFT): vector<u8>{
        photo.vector_url
    }
}