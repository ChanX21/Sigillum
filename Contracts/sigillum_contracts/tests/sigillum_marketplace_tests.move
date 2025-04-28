#[test_only]
module sigillum_contracts::marketplace_tests {
    use sui::test_scenario::{Self as ts};
    use sui::tx_context::{Self, TxContext};
    use std::string;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::vector;
    use sui::object::{Self, UID};
    use sui::transfer;
    
    // Import mock NFT module
    use sigillum_contracts::mock_nft::{Self, MockNFT};
    
    // Import the marketplace module with all public functions
    use sigillum_contracts::sigillum_marketplace::{
        Self as marketplace,
        Marketplace, 
        AdminCap, 
        MarketplaceCap,
        get_listing_ids,
        get_listing_details,
        get_soft_listing_type,
        get_real_listing_type,
        is_listing_active,
        get_listing_type,
        get_bid_count,
        get_fee_percentage,
        get_total_volume,
        get_total_listings,
        place_bid,
        accept_bid,
        transfer_nft,
        stake_on_listing,
        withdraw_stake,
        update_staking_reward_rate,
        StakingPool
    };
    use sui::object::uid_to_address;

    // Test addresses
    const ADMIN: address = @0xAD;
    const SELLER: address = @0xA1;
    const BUYER1: address = @0xB1;
    const BUYER2: address = @0xB2;

    // Test constants
    const MIN_BID: u64 = 100;
    const LIST_PRICE: u64 = 500;
    const VERIFICATION_SCORE: u64 = 95;
    const FEE_PERCENTAGE: u64 = 250; // 2.5%

    // Helper to mint test coins
    fun mint_test_coin(amount: u64, ctx: &mut TxContext): Coin<SUI> {
        coin::mint_for_testing<SUI>(amount, ctx)
    }

    // Helper to create a marketplace with an admin
    fun setup_marketplace(scenario: &mut ts::Scenario) {
        ts::next_tx(scenario, ADMIN);
        let ctx = ts::ctx(scenario);
        marketplace::init_for_testing(ctx);
    }

    // Helper to create a soft listing
    fun create_test_soft_listing(
        scenario: &mut ts::Scenario,
        nft_id: address
    ): address {
        ts::next_tx(scenario, ADMIN);
        let mut marketplace_obj = ts::take_shared<Marketplace>(scenario);
        let admin_cap = ts::take_from_sender<AdminCap>(scenario);
        
        let description = string::utf8(b"Test NFT Description");
        let metadata = string::utf8(b"{\"artist\":\"Test Artist\"}");
        
        marketplace::create_soft_listing(
            &admin_cap,
            &mut marketplace_obj,
            nft_id,
            SELLER,
            MIN_BID,
            description,
            metadata,
            0, // No end time
            ts::ctx(scenario)
        );
        
        // Get the listing ID
        let (listing_ids, _) = get_listing_ids(&marketplace_obj, 0, 10, true, get_soft_listing_type());
        let listing_id = *vector::borrow(&listing_ids, 0);
        
        ts::return_to_sender(scenario, admin_cap);
        ts::return_shared(marketplace_obj);
        
        listing_id
    }

    // Test marketplace initialization
    #[test]
    public fun test_initialization() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the marketplace
        {
            let ctx = ts::ctx(&mut scenario);
            marketplace::init_for_testing(ctx);
        };
        
        // Verify admin received caps
        {
            ts::next_tx(&mut scenario, ADMIN);
            assert!(ts::has_most_recent_for_sender<AdminCap>(&scenario), 0);
            assert!(ts::has_most_recent_for_sender<MarketplaceCap>(&scenario), 0);
        };
        
        // Verify marketplace exists
        {
            ts::next_tx(&mut scenario, ADMIN);
            assert!(ts::has_most_recent_shared<Marketplace>(), 0);
            let marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            // Test default fee percentage
            assert!(get_fee_percentage(&marketplace_obj) == FEE_PERCENTAGE, 0);
            
            // Test initial listing count
            assert!(get_total_listings(&marketplace_obj) == 0, 0);
            
            // Test initial volume
            assert!(get_total_volume(&marketplace_obj) == 0, 0);
            
            // Return marketplace object
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

    // Test admin fee management
    #[test]
    public fun test_fee_management() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Admin updates fee percentage
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let marketplace_cap = ts::take_from_sender<MarketplaceCap>(&scenario);
            
            // Check initial fee
            assert!(get_fee_percentage(&marketplace_obj) == FEE_PERCENTAGE, 0);
            
            // Change fee to 5%
            let new_fee = 500; // 5%
            marketplace::update_fee_percentage(
                &marketplace_cap,
                &mut marketplace_obj,
                new_fee
            );
            
            // Verify fee was updated
            assert!(get_fee_percentage(&marketplace_obj) == new_fee, 0);
            
            ts::return_to_sender(&scenario, marketplace_cap);
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }
    
    // Test soft listing creation
    #[test]
    public fun test_soft_listing_creation() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create soft listing
        let nft_id = @0x123; // Mock NFT ID
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Verify listing details
        {
            ts::next_tx(&mut scenario, ADMIN);
            let marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let (owner, stored_nft_id, list_price, listing_type, min_bid, highest_bid, highest_bidder, active, verification_score, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(owner == SELLER, 0);
            assert!(stored_nft_id == nft_id, 0);
            assert!(list_price == 0, 0); // Not for sale initially
            assert!(listing_type == get_soft_listing_type(), 0);
            assert!(min_bid == MIN_BID, 0);
            assert!(highest_bid == 0, 0);
            assert!(highest_bidder == @0x0, 0);
            assert!(active == true, 0);
            assert!(verification_score == 0, 0);
            
            // Test listing count
            assert!(get_total_listings(&marketplace_obj) == 1, 0);
            
            // Test bid count
            assert!(get_bid_count(&marketplace_obj, listing_id) == 0, 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

    // Test real listing creation
    #[test]
    public fun test_real_listing_creation() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create soft listing
        let nft_id = @0x123; // Mock NFT ID
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Create a mock NFT for the seller
        {
            ts::next_tx(&mut scenario, SELLER);
            let ctx = ts::ctx(&mut scenario);
            let mock_nft = mock_nft::create(ctx);
            transfer::public_transfer(mock_nft, SELLER);
        };
        
        // Convert to real listing
        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let mock_nft = ts::take_from_sender<MockNFT>(&scenario);
            
            marketplace::convert_to_real_listing(
                &mut marketplace_obj,
                listing_id,
                LIST_PRICE,
                mock_nft,
                ts::ctx(&mut scenario)
            );
            
            // Verify the listing type has changed
            let listing_type = get_listing_type(&marketplace_obj, listing_id);
            assert!(listing_type == get_real_listing_type(), 0);
            
            // Verify the list price was set correctly
            let (_, _, list_price, _, _, _, _, _, _, _, _) = get_listing_details(&marketplace_obj, listing_id);
            assert!(list_price == LIST_PRICE, 0);
            
            // Verify listing is still active
            assert!(is_listing_active(&marketplace_obj, listing_id), 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

    // Test verification scoring
    #[test]
    public fun test_verification_score() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create soft listing
        let nft_id = @0x123; // Mock NFT ID
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Update verification score
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let marketplace_cap = ts::take_from_sender<MarketplaceCap>(&scenario);
            
            marketplace::update_verification_score(
                &marketplace_cap,
                &mut marketplace_obj,
                listing_id,
                VERIFICATION_SCORE,
                ts::ctx(&mut scenario)
            );
            
            // Verify score was updated
            let (_, _, _, _, _, _, _, _, score, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(score == VERIFICATION_SCORE, 0);
            
            ts::return_to_sender(&scenario, marketplace_cap);
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

    // Test bidding functionality
    #[test]
    public fun test_bidding() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create soft listing
        let nft_id = @0x123; // Mock NFT ID
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // First buyer places a bid
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 200;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            // Verify bid was recorded
            let (_, _, _, _, _, highest_bid, highest_bidder, _, _, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(highest_bid == bid_amount, 0);
            assert!(highest_bidder == BUYER1, 0);
            assert!(get_bid_count(&marketplace_obj, listing_id) == 1, 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        // Second buyer places a higher bid
        {
            ts::next_tx(&mut scenario, BUYER2);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 300;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            // Verify new high bid
            let (_, _, _, _, _, highest_bid, highest_bidder, _, _, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(highest_bid == bid_amount, 0);
            assert!(highest_bidder == BUYER2, 0);
            assert!(get_bid_count(&marketplace_obj, listing_id) == 2, 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        // First buyer updates their bid to be higher
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 400;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            // Verify updated high bid
            let (_, _, _, _, _, highest_bid, highest_bidder, _, _, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(highest_bid == bid_amount, 0);
            assert!(highest_bidder == BUYER1, 0);
            // Bid count should still be 2 as BUYER1 updated their bid
            assert!(get_bid_count(&marketplace_obj, listing_id) == 2, 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

     // Test accepting bid functionality
    #[test]
    public fun test_accepting_bid() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        
        // Create a mock NFT
        let nft_id: address;
        {
            ts::next_tx(&mut scenario, SELLER);
            let ctx = ts::ctx(&mut scenario);
            let mock_nft = mock_nft::create(ctx);
            nft_id = object::id_address(&mock_nft);
            transfer::public_transfer(mock_nft, SELLER);
        };

        
        
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);

        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let mock_nft = ts::take_from_sender<MockNFT>(&scenario);
            
            marketplace::convert_to_real_listing(
                &mut marketplace_obj,
                listing_id,
                LIST_PRICE,
                mock_nft,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // First buyer places a bid
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 200;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            // Verify bid was recorded
            let (_, _, _, _, _, highest_bid, highest_bidder, _, _, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(highest_bid == bid_amount, 0);
            assert!(highest_bidder == BUYER1, 0);
            assert!(get_bid_count(&marketplace_obj, listing_id) == 1, 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        // Second buyer places a higher bid
        {
            ts::next_tx(&mut scenario, BUYER2);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 300;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            // Verify new high bid
            let (_, _, _, _, _, highest_bid, highest_bidder, _, _, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(highest_bid == bid_amount, 0);
            assert!(highest_bidder == BUYER2, 0);
            assert!(get_bid_count(&marketplace_obj, listing_id) == 2, 0);
            
            ts::return_shared(marketplace_obj);
            
            
        };
        
        // First buyer updates their bid to be higher
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 400;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            // Verify updated high bid
            let (_, _, _, _, _, highest_bid, highest_bidder, _, _, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(highest_bid == bid_amount, 0);
            assert!(highest_bidder == BUYER1, 0);
            // Bid count should still be 2 as BUYER1 updated their bid
            assert!(get_bid_count(&marketplace_obj, listing_id) == 2, 0);
            
            ts::return_shared(marketplace_obj);
        };

        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
             
            marketplace::accept_bid<MockNFT>(
                &mut marketplace_obj,
                listing_id,
                ts::ctx(&mut scenario)
            );
            
            assert!(!is_listing_active(&marketplace_obj, listing_id), 0);
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

    // Test cancelling a listing
    #[test]
    public fun test_cancel_listing() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create soft listing
        let nft_id = @0x123; // Mock NFT ID
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Buyer places a bid
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 200;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Seller cancels the listing
        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            marketplace::cancel_listing(
                &mut marketplace_obj,
                listing_id,
                ts::ctx(&mut scenario)
            );
            
            // Verify listing is no longer active
            assert!(!is_listing_active(&marketplace_obj, listing_id), 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        // Check that bidder received their funds back
        {
            ts::next_tx(&mut scenario, BUYER1);
            assert!(ts::has_most_recent_for_sender<coin::Coin<SUI>>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

  

    // Test direct NFT transfer
    #[test]
    public fun test_nft_transfer() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create a mock NFT
        let nft_id: address;
        {
            ts::next_tx(&mut scenario, SELLER);
            let ctx = ts::ctx(&mut scenario);
            let mock_nft = mock_nft::create(ctx);
            nft_id = object::id_address(&mock_nft);
            transfer::public_transfer(mock_nft, SELLER);
        };
        
        // Create soft listing
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Convert to real listing (which stores the NFT in the marketplace)
        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let mock_nft = ts::take_from_sender<MockNFT>(&scenario);
            
            marketplace::convert_to_real_listing(
                &mut marketplace_obj,
                listing_id,
                LIST_PRICE,
                mock_nft,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Directly transfer the NFT to a recipient using transfer_nft
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            // Get the listing details to get the NFT ID
            let (_, nft_id, _, _, _, _, _, _, _, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            // Transfer the NFT to BUYER2
            marketplace::transfer_nft<MockNFT>(
                &mut marketplace_obj,
                nft_id,
                BUYER2,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Verify BUYER2 received the NFT
        {
            ts::next_tx(&mut scenario, BUYER2);
            assert!(ts::has_most_recent_for_sender<MockNFT>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

  
    // Test getter functions specifically
    #[test]
    public fun test_getter_functions() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create soft listing
        let nft_id = @0x123; // Mock NFT ID
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Test all getter functions
        {
            ts::next_tx(&mut scenario, ADMIN);
            let marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            // Test get_listing_details
            let (owner, stored_nft_id, list_price, listing_type, min_bid, highest_bid, highest_bidder, active, verification_score, start_time, end_time) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(owner == SELLER, 0);
            assert!(stored_nft_id == nft_id, 0);
            assert!(list_price == 0, 0);
            assert!(listing_type == get_soft_listing_type(), 0);
            assert!(min_bid == MIN_BID, 0);
            assert!(highest_bid == 0, 0);
            assert!(highest_bidder == @0x0, 0);
            assert!(active == true, 0);
            assert!(verification_score == 0, 0);
            // Skip start_time assertion as it depends on the test runtime
            assert!(end_time == 0, 0);
            
            // Test get_bid_count
            assert!(get_bid_count(&marketplace_obj, listing_id) == 0, 0);
            
            // Test get_fee_percentage
            assert!(get_fee_percentage(&marketplace_obj) == FEE_PERCENTAGE, 0);
            
            // Test get_total_volume
            assert!(get_total_volume(&marketplace_obj) == 0, 0);
            
            // Test get_total_listings
            assert!(get_total_listings(&marketplace_obj) == 1, 0);
            
            // Test get_listing_type
            assert!(get_listing_type(&marketplace_obj, listing_id) == get_soft_listing_type(), 0);
            
            // Test is_listing_active
            assert!(is_listing_active(&marketplace_obj, listing_id), 0);
            
            // Test get_listing_ids
            let (listing_ids, count) = get_listing_ids(&marketplace_obj, 0, 10, true, get_soft_listing_type());
            assert!(count == 1, 0);
            assert!(vector::length(&listing_ids) == 1, 0);
            assert!(*vector::borrow(&listing_ids, 0) == listing_id, 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

    // Test multiple bidding and handling previous bids
    #[test]
    public fun test_multiple_bidding() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create soft listing
        let nft_id = @0x123; // Mock NFT ID
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Buyer1 places a bid
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 200;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Buyer2 places a bid
        {
            ts::next_tx(&mut scenario, BUYER2);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 250;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Buyer1 updates their bid (should replace the old bid)
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let bid_amount = 300;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            // Check bid count remains 2
            assert!(get_bid_count(&marketplace_obj, listing_id) == 2, 0);
            
            // Check Buyer1 is now highest bidder
            let (_, _, _, _, _, highest_bid, highest_bidder, _, _, _, _) = 
                get_listing_details(&marketplace_obj, listing_id);
                
            assert!(highest_bid == bid_amount, 0);
            assert!(highest_bidder == BUYER1, 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        // Verify Buyer1 got refunded their first bid
        {
            ts::next_tx(&mut scenario, BUYER1);
            // The original bid should have been returned
            assert!(ts::has_most_recent_for_sender<coin::Coin<SUI>>(&scenario), 0);
        };
        
        ts::end(scenario);
    }

    // Test total_listings and listing count
    #[test]
    public fun test_listing_counts() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create multiple listings
        let nft_id1 = @0x123;
        let nft_id2 = @0x456;
        
        create_test_soft_listing(&mut scenario, nft_id1);
        create_test_soft_listing(&mut scenario, nft_id2);
        
        // Test get_listing_ids function and total_listings
        {
            ts::next_tx(&mut scenario, ADMIN);
            let marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            // Check total listings count
            assert!(get_total_listings(&marketplace_obj) == 2, 0);
            
            // Get listing IDs
            let (listing_ids, count) = get_listing_ids(&marketplace_obj, 0, 10, true, get_soft_listing_type());
            assert!(count == 2, 0);
            assert!(vector::length(&listing_ids) == 2, 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

    // Test basic staking functionality
    #[test]
    public fun test_staking_basics() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create a mock NFT and soft listing
        let nft_id = @0x123;
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // BUYER1 stakes on the listing
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let stake_amount = 150;
            let payment = mint_test_coin(stake_amount, ts::ctx(&mut scenario));
            
            marketplace::stake_on_listing(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            // We don't have a direct getter for staking amounts, so we'll just 
            // rely on the event emission and later tests to verify staking worked
            
            ts::return_shared(marketplace_obj);
        };
        
        // BUYER2 also stakes on the listing
        {
            ts::next_tx(&mut scenario, BUYER2);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let stake_amount = 250;
            let payment = mint_test_coin(stake_amount, ts::ctx(&mut scenario));
            
            marketplace::stake_on_listing(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }

    // Test staking withdrawal
    #[test]
    public fun test_stake_withdrawal() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create a mock NFT and soft listing with an end time for testing expiration
        let nft_id = @0x123;
        
        // Create soft listing with an end time
        let listing_id: address;
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            
            let description = string::utf8(b"Test NFT Description");
            let metadata = string::utf8(b"{\"artist\":\"Test Artist\"}");
            let end_time = 10; // Set an end time for testing expiration
            
            marketplace::create_soft_listing(
                &admin_cap,
                &mut marketplace_obj,
                nft_id,
                SELLER,
                MIN_BID,
                description,
                metadata,
                end_time,
                ts::ctx(&mut scenario)
            );
            
            // Get the listing ID
            let (listing_ids, _) = get_listing_ids(&marketplace_obj, 0, 10, true, get_soft_listing_type());
            listing_id = *vector::borrow(&listing_ids, 0);
            
            ts::return_to_sender(&mut scenario, admin_cap);
            ts::return_shared(marketplace_obj);
        };
        
        // BUYER1 stakes on the listing
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let stake_amount = 150;
            let payment = mint_test_coin(stake_amount, ts::ctx(&mut scenario));
            
            marketplace::stake_on_listing(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Fast forward to after end time
        {
            ts::next_tx(&mut scenario, BUYER1);
            // Set epoch to 11, after the end_time
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1);
            ts::next_epoch(&mut scenario, BUYER1); // Now at epoch 11
        };
        
        // BUYER1 withdraws stake after listing expires
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            marketplace::withdraw_stake(
                &mut marketplace_obj,
                listing_id,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Verify BUYER1 received their stake back
        {
            ts::next_tx(&mut scenario, BUYER1);
            assert!(ts::has_most_recent_for_sender<coin::Coin<SUI>>(&scenario), 0);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 150, 0); // Should get back the original 150
            ts::return_to_sender(&mut scenario, coin);
        };
        
        ts::end(scenario);
    }

    // Test stake rewards distribution during sale
    #[test]
    public fun test_stake_rewards_on_sale() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create a mock NFT
        let nft_id: address;
        {
            ts::next_tx(&mut scenario, SELLER);
            let ctx = ts::ctx(&mut scenario);
            let mock_nft = mock_nft::create(ctx);
            nft_id = object::id_address(&mock_nft);
            transfer::public_transfer(mock_nft, SELLER);
        };
        
        // Create soft listing
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Convert to real listing
        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let mock_nft = ts::take_from_sender<MockNFT>(&scenario);
            
            marketplace::convert_to_real_listing(
                &mut marketplace_obj,
                listing_id,
                LIST_PRICE,
                mock_nft,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Update the staking reward rate to a known value (20%)
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let marketplace_cap = ts::take_from_sender<MarketplaceCap>(&scenario);
            
            marketplace::update_staking_reward_rate(
                &marketplace_cap,
                &mut marketplace_obj,
                listing_id,
                2000, // 20%
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&mut scenario, marketplace_cap);
            ts::return_shared(marketplace_obj);
        };
        
        // BUYER1 stakes on the listing
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let stake_amount = 100;
            let payment = mint_test_coin(stake_amount, ts::ctx(&mut scenario));
            
            marketplace::stake_on_listing(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // BUYER2 stakes on the listing
        {
            ts::next_tx(&mut scenario, BUYER2);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let stake_amount = 300; // 3x more than BUYER1
            let payment = mint_test_coin(stake_amount, ts::ctx(&mut scenario));
            
            marketplace::stake_on_listing(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // A different buyer (ADMIN) places a high bid
      
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let bid_amount: u64 = 1000;
            let payment = mint_test_coin(bid_amount, ts::ctx(&mut scenario));
            
            marketplace::place_bid(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Seller accepts the bid, which should distribute rewards to stakers
        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            marketplace::accept_bid<MockNFT>(
                &mut marketplace_obj,
                listing_id,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Verify BUYER1 received rewards
        // 20% of 1000 = 200, divided proportionally: BUYER1 gets 1/4 * 200 = 50
        {
            ts::next_tx(&mut scenario, BUYER1);
            assert!(ts::has_most_recent_for_sender<coin::Coin<SUI>>(&scenario), 0);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 50, 0); 
            ts::return_to_sender(&mut scenario, coin);
        };
        
        // Verify BUYER2 received rewards
        // 20% of 1000 = 200, divided proportionally: BUYER2 gets 3/4 * 200 = 150
        {
            ts::next_tx(&mut scenario, BUYER2);
            assert!(ts::has_most_recent_for_sender<coin::Coin<SUI>>(&scenario), 0);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 150, 0); 
            ts::return_to_sender(&mut scenario, coin);
        };
        
        ts::end(scenario);
    }

    // Test stake refund on listing cancellation
    #[test]
    public fun test_stake_refund_on_cancel() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create a mock NFT and soft listing
        let nft_id = @0x123;
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // BUYER1 stakes on the listing
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let stake_amount = 200;
            let payment = mint_test_coin(stake_amount, ts::ctx(&mut scenario));
            
            marketplace::stake_on_listing(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Seller cancels the listing
        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            marketplace::cancel_listing(
                &mut marketplace_obj,
                listing_id,
                ts::ctx(&mut scenario)
            );
            
            // Verify listing is no longer active
            assert!(!is_listing_active(&marketplace_obj, listing_id), 0);
            
            ts::return_shared(marketplace_obj);
        };
        
        // Verify BUYER1 received their stake back
        {
            ts::next_tx(&mut scenario, BUYER1);
            assert!(ts::has_most_recent_for_sender<coin::Coin<SUI>>(&scenario), 0);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 200, 0); // Should get back the original 200
            ts::return_to_sender(&mut scenario, coin);
        };
        
        ts::end(scenario);
    }

    // Test updating stake with additional funds
    #[test]
    public fun test_updating_stake() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create a mock NFT and soft listing
        let nft_id = @0x123;
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // BUYER1 stakes on the listing
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let stake_amount = 100;
            let payment = mint_test_coin(stake_amount, ts::ctx(&mut scenario));
            
            marketplace::stake_on_listing(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // BUYER1 adds more to their stake
        {
            ts::next_tx(&mut scenario, BUYER1);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            let additional_stake = 150;
            let payment = mint_test_coin(additional_stake, ts::ctx(&mut scenario));
            
            marketplace::stake_on_listing(
                &mut marketplace_obj,
                listing_id,
                payment,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Cancel the listing to verify the full stake amount is returned
        {
            ts::next_tx(&mut scenario, SELLER);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            
            marketplace::cancel_listing(
                &mut marketplace_obj,
                listing_id,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(marketplace_obj);
        };
        
        // Verify BUYER1 received their combined stake back
        {
            ts::next_tx(&mut scenario, BUYER1);
            assert!(ts::has_most_recent_for_sender<coin::Coin<SUI>>(&scenario), 0);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 250, 0); // 100 + 150 = 250
            ts::return_to_sender(&mut scenario, coin);
        };
        
        ts::end(scenario);
    }

    // Test admin functionality for staking rewards rate
    #[test]
    public fun test_admin_staking_rate() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize marketplace
        setup_marketplace(&mut scenario);
        
        // Create a mock NFT and soft listing
        let nft_id = @0x123;
        let listing_id = create_test_soft_listing(&mut scenario, nft_id);
        
        // Admin sets custom staking reward rate
        {
            ts::next_tx(&mut scenario, ADMIN);
            let mut marketplace_obj = ts::take_shared<Marketplace>(&scenario);
            let marketplace_cap = ts::take_from_sender<MarketplaceCap>(&scenario);
            
            let new_rate = 1500; // 15%
            marketplace::update_staking_reward_rate(
                &marketplace_cap,
                &mut marketplace_obj,
                listing_id,
                new_rate,
                ts::ctx(&mut scenario)
            );
            
            // We don't have a direct getter for staking reward rate,
            // but we can test it via the reward distribution in another test
            
            ts::return_to_sender(&mut scenario, marketplace_cap);
            ts::return_shared(marketplace_obj);
        };
        
        ts::end(scenario);
    }
} 