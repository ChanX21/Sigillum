#[test_only]
module sigillum_contracts::sigillum_nft_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::test_utils::{assert_eq};
    use sui::object::{Self, ID};
    use std::string;
    use std::vector;
    use sigillum_contracts::sigillum_nft::{Self, PhotoNFT, Registry, AdminCap};

    // Test addresses
    const ADMIN: address = @0xA1;
    const USER_1: address = @0xB1;
    const USER_2: address = @0xC1;

    // Test data
    const IMAGE_URL: vector<u8> = b"ipfs://QmImageHash";
    const VECTOR_URL_1: vector<u8> = b"https://vector.storage/image1";
    const VECTOR_URL_2: vector<u8> = b"https://vector.storage/image2";
    const WATERMARK_ID: vector<u8> = b"watermark123";
    const METADATA: vector<u8> = b"{\"name\":\"Test Photo\",\"description\":\"A test photo\"}";
    const BLOB1: vector<u8> = b"blob1";

    // Helper function to set up the test environment
    fun setup_test(): Scenario {
        let mut scenario = ts::begin(ADMIN);
        {
            sigillum_nft::init_for_testing(ts::ctx(&mut scenario));
        };
        scenario
    }

    #[test]
    fun test_initialization() {
        let mut scenario = setup_test();
        
        // Verify the registry and admin cap were created
        ts::next_tx(&mut scenario, ADMIN);
        {
            assert!(ts::has_most_recent_shared<Registry>(), 0);
            assert!(ts::has_most_recent_for_address<AdminCap>(ADMIN), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_register_photo() {
        let mut scenario = setup_test();
        
        // Register a photo as ADMIN for USER_1
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                USER_1,
                VECTOR_URL_1,
                BLOB1,
                WATERMARK_ID,
                string::utf8(METADATA),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(registry);
        };
        
        // Verify USER_1 received the NFT
        ts::next_tx(&mut scenario, USER_1);
        {
            assert!(ts::has_most_recent_for_address<PhotoNFT>(USER_1), 0);
            
            let registry = ts::take_shared<Registry>(&scenario);
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_1);
            
            // Check photo properties
            assert_eq(sigillum_nft::get_creator(&photo), USER_1);
            assert_eq(sigillum_nft::get_vector_url(&photo), VECTOR_URL_1);
            
            // Check registry lookup
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_1), 0);
            let (exists, _) = sigillum_nft::get_first_nft_by_vector_url(&registry, VECTOR_URL_1);
            assert!(exists, 0);
            
            ts::return_to_address(USER_1, photo);
            ts::return_shared(registry);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_photos_with_different_vectors() {
        let mut scenario = setup_test();
        
        // Register first photo
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                USER_1,
                VECTOR_URL_1,
                 BLOB1,
                WATERMARK_ID,
                string::utf8(METADATA),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(registry);
        };
        
        // Register second photo with different vector
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                USER_2,
                VECTOR_URL_2,
                BLOB1,
                WATERMARK_ID,
                string::utf8(METADATA),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(registry);
        };
        
        // Verify lookup works correctly
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            
            // Both vector URLs should exist
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_1), 0);
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_2), 0);
            
            // Each should return the correct NFTs
            let nfts_1 = sigillum_nft::get_nfts_by_vector_url(&registry, VECTOR_URL_1);
            let nfts_2 = sigillum_nft::get_nfts_by_vector_url(&registry, VECTOR_URL_2);
            
            assert_eq(vector::length(&nfts_1), 1);
            assert_eq(vector::length(&nfts_2), 1);
            
            ts::return_shared(registry);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_transfer_photo() {
        let mut scenario = setup_test();
        
        // Register a photo
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                USER_1,
                VECTOR_URL_1,
                 BLOB1,
                WATERMARK_ID,
                string::utf8(METADATA),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(registry);
        };
        
        // Transfer photo from USER_1 to USER_2
        ts::next_tx(&mut scenario, USER_1);
        {
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_1);
            sigillum_nft::transfer_photo(photo, USER_2);
        };
        
        // Verify USER_2 now has the photo
        ts::next_tx(&mut scenario, USER_2);
        {
            assert!(ts::has_most_recent_for_address<PhotoNFT>(USER_2), 0);
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_2);
            ts::return_to_address(USER_2, photo);
        };
        
        // Verify USER_1 no longer has the photo
        ts::next_tx(&mut scenario, USER_1);
        {
            assert!(!ts::has_most_recent_for_address<PhotoNFT>(USER_1), 0);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_photos_same_vector() {
        let mut scenario = setup_test();
        
        // Register first photo with VECTOR_URL_1
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                USER_1,
                VECTOR_URL_1,
                 BLOB1,
                WATERMARK_ID,
                string::utf8(METADATA),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(registry);
        };
        
        // Register second photo with same VECTOR_URL_1
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut registry = ts::take_shared<Registry>(&scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                IMAGE_URL,
                USER_2,
                VECTOR_URL_1,
                BLOB1,
                WATERMARK_ID,
                string::utf8(METADATA),
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(registry);
        };
        
        // Verify both NFTs are registered under the same vector URL
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            
            let nfts = sigillum_nft::get_nfts_by_vector_url(&registry, VECTOR_URL_1);
            assert_eq(vector::length(&nfts), 2);
            
            ts::return_shared(registry);
        };
        
        ts::end(scenario);
    }
}
