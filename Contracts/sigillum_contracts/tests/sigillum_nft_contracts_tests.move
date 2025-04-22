/*
#[test_only]
module sigillum_contracts::sigillum_contracts_tests;
// uncomment this line to import the module
// use sigillum_contracts::sigillum_contracts;

const ENotImplemented: u64 = 0;

#[test]
fun test_sigillum_contracts() {
    // pass
}

#[test, expected_failure(abort_code = ::sigillum_contracts::sigillum_contracts_tests::ENotImplemented)]
fun test_sigillum_contracts_fail() {
    abort ENotImplemented
}
*/

/*
#[test_only]
module sigillum_contracts::photo_nft_tests {
    use sui::test_scenario::{Self, Scenario};
    use std::string::{Self};
    use std::vector;
    use sui::vec_map;
    
    use sigillum_contracts::sigillum_nft::{Self, PhotoNFT, Registry, AdminCap};

    // Test addresses
    const CREATOR: address = @0xA;
    const RECIPIENT: address = @0xB;

    // Test data
    const IMAGE_URL: vector<u8> = b"ipfs://QmHash";
    const SHA256_HASH: vector<u8> = b"1234567890abcdef1234567890abcdef";
    const PHASH: vector<u8> = b"phash_data_here";
    const DHASH: vector<u8> = b"dhash_data_here";
    const WATERMARK_ID: vector<u8> = b"watermark_123";
    const METADATA_STR: vector<u8> = b"{\"title\":\"Test Photo\",\"description\":\"Test\"}";

    // Helper function to set up the test environment
    fun setup_test(): Scenario {
        let mut scenario = test_scenario::begin(CREATOR);
        
        // Initialize the Registry and AdminCap
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            sigillum_nft::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        
        scenario
    }

    #[test]
    fun test_register_photo() {
        let mut scenario = setup_test();

        // Get the Registry and AdminCap
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<Registry>(&scenario);
            
            // Register a photo as CREATOR
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                SHA256_HASH,
                PHASH, 
                DHASH,
                WATERMARK_ID,
                string::utf8(METADATA_STR),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
        };
        
        // Verify the NFT was created and owned by CREATOR
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let nft = test_scenario::take_from_sender<PhotoNFT>(&scenario);
            let creator = sigillum_nft::get_creator(&nft);
            assert!(creator == CREATOR, 0);
            
            // Verify all fields are set correctly
            assert!(sigillum_nft::verify_exact_match(&nft, SHA256_HASH), 1);
            
            test_scenario::return_to_sender(&scenario, nft);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_transfer_photo() {
        let mut scenario = setup_test();
        
        // Register a photo as CREATOR
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                SHA256_HASH,
                PHASH, 
                DHASH,
                WATERMARK_ID,
                string::utf8(METADATA_STR),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
        };
        
        // Transfer the NFT to RECIPIENT
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let nft = test_scenario::take_from_sender<PhotoNFT>(&scenario);
            sigillum_nft::transfer_photo(nft, RECIPIENT);
        };
        
        // Verify the NFT is now owned by RECIPIENT
        test_scenario::next_tx(&mut scenario, RECIPIENT);
        {
            let nft = test_scenario::take_from_sender<PhotoNFT>(&scenario);
            // Creator should still be original creator
            assert!(sigillum_nft::get_creator(&nft) == CREATOR, 0);
            test_scenario::return_to_sender(&scenario, nft);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_verify_exact_match() {
        let mut scenario = setup_test();
        
        // Register a photo
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                SHA256_HASH,
                PHASH, 
                DHASH,
                WATERMARK_ID,
                string::utf8(METADATA_STR),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
        };
        
        // Test exact match verification
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let nft = test_scenario::take_from_sender<PhotoNFT>(&scenario);
            
            // Should match with original hash
            assert!(sigillum_nft::verify_exact_match(&nft, SHA256_HASH), 0);
            
            // Should not match with different hash
            let different_hash = b"different_hash_value_here";
            assert!(!sigillum_nft::verify_exact_match(&nft, different_hash), 1);
            
            test_scenario::return_to_sender(&scenario, nft);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_calculate_hash_similarity() {
        // Test hash similarity calculation
        let hash1 = b"\x00\x00\x00\x00"; // All zeros
        let hash2 = b"\xFF\xFF\xFF\xFF"; // All ones
        
        // These hashes should be maximally different - 32 bits difference
        let distance = sigillum_nft::calculate_hash_similarity(hash1, hash2);
        assert!(distance == 32, 0);
        
        // Test with hashes that are one bit different
        let hash1 = b"\x00\x00\x00\x00";
        let hash2 = b"\x01\x00\x00\x00"; // Just one bit different
        
        let distance = sigillum_nft::calculate_hash_similarity(hash1, hash2);
        assert!(distance == 1, 1);
        
        // Test with identical hashes
        let hash1 = b"\xAA\xBB\xCC\xDD";
        let hash2 = b"\xAA\xBB\xCC\xDD";
        
        let distance = sigillum_nft::calculate_hash_similarity(hash1, hash2);
        assert!(distance == 0, 2); // Should be zero for identical hashes
    }
    
    #[test]
    fun test_timestamp() {
        let mut scenario = setup_test();
        
        // Register a photo
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                SHA256_HASH,
                PHASH, 
                DHASH,
                WATERMARK_ID,
                string::utf8(METADATA_STR),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
        };
        
        // Verify timestamp
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let nft = test_scenario::take_from_sender<PhotoNFT>(&scenario);
            let timestamp = sigillum_nft::get_timestamp(&nft);
            // In test environment, epoch might start at 0
            assert!(timestamp >= 0, 0);
            test_scenario::return_to_sender(&scenario, nft);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_registry_lookup() {
        let mut scenario = setup_test();
        
        // Register a photo
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut registry = test_scenario::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                SHA256_HASH,
                PHASH, 
                DHASH,
                WATERMARK_ID,
                string::utf8(METADATA_STR),
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_shared(registry);
        };
        
        // Test lookup by pHash
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            let registry = test_scenario::take_shared<Registry>(&scenario);
            let nft = test_scenario::take_from_sender<PhotoNFT>(&scenario);
            
            // Get the pHash from the NFT
            let phash = sigillum_nft::get_phash(&nft);
            
            // Check that the NFT exists in the registry
            assert!(sigillum_nft::exists_by_phash(&registry, phash), 0);
            
            // Get all NFTs with this pHash
            let nft_ids = sigillum_nft::get_nfts_by_phash(&registry, phash);
            assert!(vector::length(&nft_ids) == 1, 1);
            
            // Get first NFT with this pHash
            let (found, _) = sigillum_nft::get_first_nft_by_phash(&registry, phash);
            assert!(found, 2);
            
            // Find similar NFTs
            let similar_nfts = sigillum_nft::find_similar_nfts(&registry, phash, 0);
            assert!(vec_map::size(&similar_nfts) == 1, 3);
            
            test_scenario::return_to_sender(&scenario, nft);
            test_scenario::return_shared(registry);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_admin_cap() {
        let mut scenario = test_scenario::begin(CREATOR);
        
        // Initialize the Registry and AdminCap
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            sigillum_nft::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        
        // Verify AdminCap was created and transferred to CREATOR
        test_scenario::next_tx(&mut scenario, CREATOR);
        {
            // This should not abort if AdminCap was properly created and transferred
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };
        
        test_scenario::end(scenario);
    }
}
*/

// This is a placeholder module with a basic test as a substitute for the commented-out tests
#[test_only]
module sigillum_contracts::basic_test {
    
    #[test]
    public fun test_basic() {
        // Just a placeholder test that will pass
        assert!(true, 0);
    }
}

#[test_only]
module sigillum_contracts::sigillum_nft_tests {
    use sui::test_scenario as ts;
    use sui::tx_context::TxContext;
    use std::string::{Self, String};
    use std::vector;
    use sui::vec_set;
    use sui::object;
    
    use sigillum_contracts::sigillum_nft::{
        Self, 
        PhotoNFT, 
        Registry, 
        AdminCap, 
        get_creator, 
        get_timestamp,
        get_vector_url,
        get_nfts_by_vector_url,
        get_first_nft_by_vector_url,
        exists_by_vector_url
    };

    // Test addresses
    const ADMIN: address = @0xAD;
    const CREATOR: address = @0xC1;
    const RECIPIENT: address = @0xC2;

    // Test data
    const IMAGE_URL: vector<u8> = b"ipfs://QmImageHash";
    const VECTOR_URL: vector<u8> = b"ipfs://QmVectorHash";
    const WATERMARK_ID: vector<u8> = b"watermark123";
    const METADATA_STR: vector<u8> = b"{\"title\":\"Test Photo\",\"description\":\"Test Description\"}";

    // Test initialization
    #[test]
    public fun test_initialization() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the Registry and AdminCap
        {
            let ctx = ts::ctx(&mut scenario);
            sigillum_nft::init_for_testing(ctx);
        };
        
        // Verify admin received AdminCap
        {
            ts::next_tx(&mut scenario, ADMIN);
            assert!(ts::has_most_recent_for_sender<AdminCap>(&scenario), 0);
        };
        
        // Verify Registry was created and shared
        {
            ts::next_tx(&mut scenario, ADMIN);
            assert!(ts::has_most_recent_shared<Registry>(), 0);
            let registry = ts::take_shared<Registry>(&scenario);
            ts::return_shared(registry);
        };
        
        ts::end(scenario);
    }

    // Test photo registration (minting NFT)
    #[test]
    public fun test_register_photo() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the Registry and AdminCap
        {
            let ctx = ts::ctx(&mut scenario);
            sigillum_nft::init_for_testing(ctx);
        };
        
        // Register a photo
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            
            let metadata = string::utf8(METADATA_STR);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                VECTOR_URL,
                WATERMARK_ID,
                metadata,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };
        
        // Verify the NFT was created and sent to ADMIN
        {
            ts::next_tx(&mut scenario, ADMIN);
            assert!(ts::has_most_recent_for_sender<PhotoNFT>(&scenario), 0);
            
            let photo_nft = ts::take_from_sender<PhotoNFT>(&scenario);
            
            // Check NFT properties
            assert!(get_creator(&photo_nft) == ADMIN, 1);
            assert!(get_vector_url(&photo_nft) == VECTOR_URL, 2);
            let timestamp = get_timestamp(&photo_nft);
            assert!(timestamp >= 0, 3); // Timestamp should be non-negative in tests
            
            ts::return_to_sender(&scenario, photo_nft);
        };
        
        ts::end(scenario);
    }

    // Test photo transfer
    #[test]
    public fun test_transfer_photo() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the Registry and AdminCap
        {
            let ctx = ts::ctx(&mut scenario);
            sigillum_nft::init_for_testing(ctx);
        };
        
        // Register a photo
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            
            let metadata = string::utf8(METADATA_STR);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                VECTOR_URL,
                WATERMARK_ID,
                metadata,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };
        
        // Transfer the NFT to RECIPIENT
        {
            ts::next_tx(&mut scenario, ADMIN);
            let photo_nft = ts::take_from_sender<PhotoNFT>(&scenario);
            
            sigillum_nft::transfer_photo(photo_nft, RECIPIENT);
        };
        
        // Verify RECIPIENT has the NFT now
        {
            ts::next_tx(&mut scenario, RECIPIENT);
            assert!(ts::has_most_recent_for_sender<PhotoNFT>(&scenario), 0);
            
            let photo_nft = ts::take_from_sender<PhotoNFT>(&scenario);
            
            // Creator should still be the original creator (ADMIN)
            assert!(get_creator(&photo_nft) == ADMIN, 1);
            
            ts::return_to_sender(&scenario, photo_nft);
        };
        
        ts::end(scenario);
    }

    // Test registry lookup functions
    #[test]
    public fun test_registry_lookup() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the Registry and AdminCap
        {
            let ctx = ts::ctx(&mut scenario);
            sigillum_nft::init_for_testing(ctx);
        };
        
        // Register a photo
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            
            let metadata = string::utf8(METADATA_STR);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                VECTOR_URL,
                WATERMARK_ID,
                metadata,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };
        
        // Test lookup functions
        {
            ts::next_tx(&mut scenario, ADMIN);
            let registry = ts::take_shared<Registry>(&scenario);
            let photo_nft = ts::take_from_sender<PhotoNFT>(&scenario);
            
            // Check existence by vector URL
            assert!(exists_by_vector_url(&registry, VECTOR_URL), 0);
            
            // Get NFTs by vector URL
            let nft_ids = get_nfts_by_vector_url(&registry, VECTOR_URL);
            assert!(vector::length(&nft_ids) == 1, 1);
            
            // Get the first NFT by vector URL
            let (found, _) = get_first_nft_by_vector_url(&registry, VECTOR_URL);
            assert!(found, 2);
            
            // Try looking up a non-existent vector URL
            let non_existent_url = b"non_existent_url";
            assert!(!exists_by_vector_url(&registry, non_existent_url), 3);
            
            let nft_ids_empty = get_nfts_by_vector_url(&registry, non_existent_url);
            assert!(vector::length(&nft_ids_empty) == 0, 4);
            
            let (found_empty, _) = get_first_nft_by_vector_url(&registry, non_existent_url);
            assert!(!found_empty, 5);
            
            ts::return_to_sender(&scenario, photo_nft);
            ts::return_shared(registry);
        };
        
        ts::end(scenario);
    }

    // Test multiple photos with the same vector URL
    #[test]
    public fun test_multiple_photos_same_vector() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the Registry and AdminCap
        {
            let ctx = ts::ctx(&mut scenario);
            sigillum_nft::init_for_testing(ctx);
        };
        
        // Register first photo
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            
            let metadata = string::utf8(METADATA_STR);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                VECTOR_URL, // Same vector URL
                WATERMARK_ID,
                metadata,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };
        
        // Register second photo with same vector URL
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            
            let metadata = string::utf8(b"{\"title\":\"Second Photo\",\"description\":\"Another test\"}");
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                b"ipfs://QmSecondImageHash", // Different image URL
                VECTOR_URL, // Same vector URL
                b"watermark456", // Different watermark
                metadata,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(registry);
        };
        
        // Verify both photos are in the registry under the same vector URL
        {
            ts::next_tx(&mut scenario, ADMIN);
            let registry = ts::take_shared<Registry>(&scenario);
            
            // Get all NFTs with this vector URL
            let nft_ids = get_nfts_by_vector_url(&registry, VECTOR_URL);
            assert!(vector::length(&nft_ids) == 2, 0);
            
            ts::return_shared(registry);
        };
        
        ts::end(scenario);
    }
}



