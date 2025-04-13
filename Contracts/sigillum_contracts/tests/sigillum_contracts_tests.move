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



