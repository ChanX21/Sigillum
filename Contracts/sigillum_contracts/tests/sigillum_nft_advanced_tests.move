#[test_only]
module sigillum_contracts::sigillum_nft_advanced_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::test_utils::{assert_eq};
    use std::string;
    use std::vector;
    use sui::object;
    use sigillum_contracts::sigillum_nft::{Self, PhotoNFT, Registry, AdminCap};

    // Test addresses
    const ADMIN: address = @0xA1;
    const USER_1: address = @0xB1;
    const USER_2: address = @0xC1;
    const USER_3: address = @0xD1;

    // Test data
    const IMAGE_URL_1: vector<u8> = b"ipfs://QmImageHash1";
    const IMAGE_URL_2: vector<u8> = b"ipfs://QmImageHash2";
    const VECTOR_URL_1: vector<u8> = b"https://vector.storage/image1";
    const VECTOR_URL_2: vector<u8> = b"https://vector.storage/image2";
    const VECTOR_URL_3: vector<u8> = b"https://vector.storage/image3";
    const WATERMARK_ID_1: vector<u8> = b"watermark123";
    const WATERMARK_ID_2: vector<u8> = b"watermark456";
    const METADATA_1: vector<u8> = b"{\"name\":\"Test Photo 1\",\"description\":\"A test photo\"}";
    const METADATA_2: vector<u8> = b"{\"name\":\"Test Photo 2\",\"description\":\"Another test photo\"}";

    // Helper function to set up the test environment
    fun setup_test(): Scenario {
        let mut scenario = ts::begin(ADMIN);
        {
            sigillum_nft::init_for_testing(ts::ctx(&mut scenario));
        };
        scenario
    }

    // Helper function to register a photo
    fun register_test_photo(
        scenario: &mut Scenario, 
        admin: address,
        recipient: address,
        image_url: vector<u8>,
        vector_url: vector<u8>,
        watermark_id: vector<u8>,
        metadata: vector<u8>
    ) {
        ts::next_tx(scenario, admin);
        {
            let admin_cap = ts::take_from_address<AdminCap>(scenario, admin);
            let mut registry = ts::take_shared<Registry>(scenario);
            
            sigillum_nft::register_photo(
                &admin_cap,
                &mut registry,
                image_url,
                recipient,
                vector_url,
                watermark_id,
                string::utf8(metadata),
                ts::ctx(scenario)
            );
            
            ts::return_to_address(admin, admin_cap);
            ts::return_shared(registry);
        };
    }

    #[test]
    fun test_batch_registration() {
        let mut scenario = setup_test();
        
        // Register multiple photos for different users
        register_test_photo(&mut scenario, ADMIN, USER_1, IMAGE_URL_1, VECTOR_URL_1, WATERMARK_ID_1, METADATA_1);
        register_test_photo(&mut scenario, ADMIN, USER_2, IMAGE_URL_2, VECTOR_URL_2, WATERMARK_ID_2, METADATA_2);
        register_test_photo(&mut scenario, ADMIN, USER_3, IMAGE_URL_1, VECTOR_URL_3, WATERMARK_ID_1, METADATA_1);
        
        // Verify all users received their NFTs
        ts::next_tx(&mut scenario, USER_1);
        {
            assert!(ts::has_most_recent_for_address<PhotoNFT>(USER_1), 0);
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_1);
            ts::return_to_address(USER_1, photo);
        };
        
        ts::next_tx(&mut scenario, USER_2);
        {
            assert!(ts::has_most_recent_for_address<PhotoNFT>(USER_2), 0);
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_2);
            ts::return_to_address(USER_2, photo);
        };
        
        ts::next_tx(&mut scenario, USER_3);
        {
            assert!(ts::has_most_recent_for_address<PhotoNFT>(USER_3), 0);
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_3);
            ts::return_to_address(USER_3, photo);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_registry_lookup_multiple_vectors() {
        let mut scenario = setup_test();
        
        // Register multiple photos with different vector URLs
        register_test_photo(&mut scenario, ADMIN, USER_1, IMAGE_URL_1, VECTOR_URL_1, WATERMARK_ID_1, METADATA_1);
        register_test_photo(&mut scenario, ADMIN, USER_2, IMAGE_URL_2, VECTOR_URL_2, WATERMARK_ID_2, METADATA_2);
        register_test_photo(&mut scenario, ADMIN, USER_3, IMAGE_URL_1, VECTOR_URL_3, WATERMARK_ID_1, METADATA_1);
        
        // Verify registry lookups return correct results
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            
            // Check vector_url_1
            let nfts_1 = sigillum_nft::get_nfts_by_vector_url(&registry, VECTOR_URL_1);
            assert_eq(vector::length(&nfts_1), 1);
            
            // Check vector_url_2
            let nfts_2 = sigillum_nft::get_nfts_by_vector_url(&registry, VECTOR_URL_2);
            assert_eq(vector::length(&nfts_2), 1);
            
            // Check vector_url_3
            let nfts_3 = sigillum_nft::get_nfts_by_vector_url(&registry, VECTOR_URL_3);
            assert_eq(vector::length(&nfts_3), 1);
            
            // Get first NFT by vector URL
            let (exists, addr) = sigillum_nft::get_first_nft_by_vector_url(&registry, VECTOR_URL_1);
            assert!(exists, 0);
            
            // Check if vector URLs exist
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_1), 0);
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_2), 0);
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_3), 0);
            
            // Non-existent vector URL should return empty result
            let non_existent = b"https://vector.storage/nonexistent";
            let nfts_non_existent = sigillum_nft::get_nfts_by_vector_url(&registry, non_existent);
            assert_eq(vector::length(&nfts_non_existent), 0);
            
            let (exists_non, _) = sigillum_nft::get_first_nft_by_vector_url(&registry, non_existent);
            assert!(!exists_non, 0);
            
            ts::return_shared(registry);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_complex_transfer_chain() {
        let mut scenario = setup_test();
        
        // Register a photo for USER_1
        register_test_photo(&mut scenario, ADMIN, USER_1, IMAGE_URL_1, VECTOR_URL_1, WATERMARK_ID_1, METADATA_1);
        
        // Chain of transfers: USER_1 -> USER_2 -> USER_3 -> USER_1 (back to original owner)
        
        // USER_1 -> USER_2
        ts::next_tx(&mut scenario, USER_1);
        {
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_1);
            sigillum_nft::transfer_photo(photo, USER_2);
        };
        
        // USER_2 -> USER_3
        ts::next_tx(&mut scenario, USER_2);
        {
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_2);
            sigillum_nft::transfer_photo(photo, USER_3);
        };
        
        // USER_3 -> USER_1 (back to original)
        ts::next_tx(&mut scenario, USER_3);
        {
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_3);
            sigillum_nft::transfer_photo(photo, USER_1);
        };
        
        // Verify USER_1 has the NFT again
        ts::next_tx(&mut scenario, USER_1);
        {
            assert!(ts::has_most_recent_for_address<PhotoNFT>(USER_1), 0);
            let photo = ts::take_from_address<PhotoNFT>(&scenario, USER_1);
            
            // Even after transfers, the creator should still be USER_1
            assert_eq(sigillum_nft::get_creator(&photo), USER_1);
            
            ts::return_to_address(USER_1, photo);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_nfts_same_owner() {
        let mut scenario = setup_test();
        
        // Register 3 different photos all owned by USER_1
        register_test_photo(&mut scenario, ADMIN, USER_1, IMAGE_URL_1, VECTOR_URL_1, WATERMARK_ID_1, METADATA_1);
        register_test_photo(&mut scenario, ADMIN, USER_1, IMAGE_URL_2, VECTOR_URL_2, WATERMARK_ID_2, METADATA_2);
        register_test_photo(&mut scenario, ADMIN, USER_1, IMAGE_URL_1, VECTOR_URL_3, WATERMARK_ID_1, METADATA_1);
        
        // The test system can only track the most recent NFT created, so we need to check indirectly
        // by looking at the registry instead
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            
            // Check that all vector URLs exist
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_1), 0);
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_2), 0);
            assert!(sigillum_nft::exists_by_vector_url(&registry, VECTOR_URL_3), 0);
            
            ts::return_shared(registry);
        };
        
        ts::end(scenario);
    }
} 