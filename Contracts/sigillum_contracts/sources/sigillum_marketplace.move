// ███████╗██╗ ██████╗ ██╗██╗     ██╗     ██╗   ██╗███╗   ███╗    ███╗   ███╗ █████╗ ██████╗ ██╗  ██╗███████╗████████╗██████╗ ██╗      █████╗  ██████╗███████╗
// ██╔════╝██║██╔════╝ ██║██║     ██║     ██║   ██║████╗ ████║    ████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝╚══██╔══╝██╔══██╗██║     ██╔══██╗██╔════╝██╔════╝
// ███████╗██║██║  ███╗██║██║     ██║     ██║   ██║██╔████╔██║    ██╔████╔██║███████║██████╔╝█████╔╝ █████╗     ██║   ██████╔╝██║     ███████║██║     █████╗  
// ╚════██║██║██║   ██║██║██║     ██║     ██║   ██║██║╚██╔╝██║    ██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ██╔══╝     ██║   ██╔═══╝ ██║     ██╔══██║██║     ██╔══╝  
// ███████║██║╚██████╔╝██║███████╗███████╗╚██████╔╝██║ ╚═╝ ██║    ██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗███████╗   ██║   ██║     ███████╗██║  ██║╚██████╗███████╗
// ╚══════╝╚═╝ ╚═════╝ ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝
                                                                                                                                                           



module sigillum_contracts::sigillum_marketplace {
    
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use std::string::{String};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::dynamic_object_field as dof;


    // Error constants
    const EInvalidListing: u64 = 1;
    const EInvalidBid: u64 = 2;
    const EInsufficientBid: u64 = 3;
    const EListingNotActive: u64 = 4;
    const ENotOwner: u64 = 5;
    const EInvalidPrice: u64 = 6;
    const ENotListed: u64 = 8;
    const EInvalidListingNotRealListing: u64 = 10;


    // MarketplaceCap for admin operations
    public struct MarketplaceCap has key, store {
        id: UID
    }

    // Listing types
    const SOFT_LISTING: u8 = 0;   // For valuation and authenticity only
    const REAL_LISTING: u8 = 1;   // For actual sale

    
    // Represents a listing in the marketplace (both soft and real)
    public struct Listing has store, copy {
        owner: address,              // Owner of the NFT
        nft_id: address,             // ID of the PhotoNFT
        list_price: u64,             // Price set by the owner (only for REAL_LISTING)
        listing_type: u8,            // SOFT_LISTING or REAL_LISTING
        min_bid: u64,                // Minimum bid amount
        highest_bid: u64,            // Current highest bid
        highest_bidder: address,     // Address of highest bidder
        active: bool,                // Whether the listing is currently active
        verification_score: u64,     // Authenticity verification score (0-100)
        start_time: u64,             // When the listing became active
        end_time: u64,               // When the listing will end (0 for no end time)
        description: String,         // Listing description
        metadata: String,            // Additional listing metadata (as JSON)
    }

    public struct AdminCap has key, store {
        id: UID
    }


    // Holds all bids for a listing
    public struct BidPool has store {
        bids: VecMap<address, u64>,  // Maps bidder address to bid amount
        bid_count: u64,              // Number of bids received
    }

    // Holds all stakes for a listing
    public struct StakingPool has store {
        stakes: VecMap<address, u64>,  // Maps staker address to staked amount
        total_staked: u64,             // Total amount staked
        rewards_rate: u64,             // Percentage of sale that goes to stakers (basis points)
    }

    // Marketplace object to keep track of all listings
    public struct Marketplace has key {
        id: UID,
        // Maps listing ID to Listing object
        listings: Table<address, Listing>,
        // Maps listing ID to BidPool
        bid_pools: Table<address, BidPool>,
        // Maps listing ID to escrow funds
        escrow: Table<address, Balance<SUI>>,
        // Platform fee percentage (in basis points, e.g., 250 = 2.5%)
        fee_percentage: u64,
        // Treasury to collect platform fees
        treasury: Balance<SUI>,
        // Total volume traded
        total_volume: u64,
        // Total listings count
        total_listings: u64,
        // Vector of all listing IDs for pagination
        listing_ids: vector<address>,
        // Vector of active listing IDs for pagination
        active_listing_ids: vector<address>,
        // Maps listing ID to StakingPool
        staking_pools: Table<address, StakingPool>,
    }

    // Events
    
    // Emitted when a new listing is created
    public struct ListingCreated has copy, drop {
        listing_id: address,
        nft_id: address,
        owner: address,
        listing_type: u8,
        price: u64,
        min_bid: u64,
        start_time: u64,
        end_time: u64,
    }

    public struct RelistingCreated has copy, drop {
        listing_id: address,
        nft_id: address,
        owner: address,
        listing_type: u8,
        price: u64,
        min_bid: u64,
        start_time: u64,
        end_time: u64,
    }

    // Emitted when a bid is placed
    public struct BidPlaced has copy, drop {
        listing_id: address,
        bidder: address,
        bid_amount: u64,
        is_highest: bool,
    }

    // Emitted when a listing is completed (sale or expired)
    public struct ListingCompleted has copy, drop {
        listing_id: address,
        nft_id: address,
        seller: address,
        buyer: address,
        final_price: u64,
        listing_type: u8,
        success: bool,
    }

    public struct VerificationUpdated has copy, drop {
        listing_id: address,
        nft_id: address,
        new_score: u64,
        verifier: address,
    }

    // Add these event structs after your existing events

    public struct StakeAdded has copy, drop {
        listing_id: address,
        staker: address,
        stake_amount: u64,
        total_staked: u64,
    }

    public struct StakeWithdrawn has copy, drop {
        listing_id: address,
        staker: address,
        amount: u64,
    }

    // === Initialization ===
    fun init(ctx: &mut TxContext) {
        // Create admin capability
        transfer::transfer(
            MarketplaceCap { id: object::new(ctx) },
            tx_context::sender(ctx)
        );
        
        // Create and share the marketplace
        let marketplace = Marketplace {
            id: object::new(ctx),
            listings: table::new(ctx),
            bid_pools: table::new(ctx),
            escrow: table::new(ctx),
            fee_percentage: 250, // 2.5% default fee
            treasury: balance::zero(),
            total_volume: 0,
            total_listings: 0,
            listing_ids: vector::empty<address>(),
            active_listing_ids: vector::empty<address>(),
            staking_pools: table::new(ctx),
        };

        transfer::transfer(
            AdminCap { id: object::new(ctx) },
            tx_context::sender(ctx)
        );
        
        transfer::share_object(marketplace);
    }

    // Test-only initialization function
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }

    // === Core Functions ===

    // Create a soft listing for valuation and authenticity verification
    public entry fun create_soft_listing(
        _: &AdminCap,
        marketplace: &mut Marketplace,
        nft_id: address,
        owner_soft: address,
        min_bid: u64,
        description: String,
        metadata: String,
        end_time: u64,
        ctx: &mut TxContext
    ) {
        let owner = owner_soft;

        let listing_id = object::new(ctx);
        let listing_id_address = object::uid_to_address(&listing_id);
        
        // Create the listing
        let listing = Listing {
            owner,
            nft_id,
            list_price: 0, // Not for sale
            listing_type: SOFT_LISTING,
            min_bid,
            highest_bid: 0,
            highest_bidder: @0x0,
            active: true,
            verification_score: 0,
            start_time: tx_context::epoch_timestamp_ms(ctx),
            end_time,
            description,
            metadata,
        };
        
        // Create an empty bid pool for this listing
        let bid_pool = BidPool {
            bids: vec_map::empty(),
            bid_count: 0,
        };
        
        // Add the listing and bid pool to the marketplace
        table::add(&mut marketplace.listings, listing_id_address, listing);
        table::add(&mut marketplace.bid_pools, listing_id_address, bid_pool);
        
        // Create an empty escrow for this listing
        let empty_balance = balance::zero<SUI>();
        table::add(&mut marketplace.escrow, listing_id_address, empty_balance);
        
        // Add the listing ID to the vectors for pagination
        vector::push_back(&mut marketplace.listing_ids, listing_id_address);
        vector::push_back(&mut marketplace.active_listing_ids, listing_id_address);
        
        // Increment total listings
        marketplace.total_listings = marketplace.total_listings + 1;
        
        // Emit listing created event
        event::emit(ListingCreated {
            listing_id: listing_id_address,
            nft_id,
            owner,
            listing_type: SOFT_LISTING,
            price: 0,
            min_bid,
            start_time: tx_context::epoch_timestamp_ms(ctx),
            end_time,
        });
        
        object::delete(listing_id);
    }


    // Convert a soft listing to a real listing for selling the NFT
    public entry fun convert_to_real_listing<T: key + store>(
        marketplace: &mut Marketplace,
        soft_listing_id: address,
        list_price: u64,
        nft: T,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        assert!(table::contains(&marketplace.listings, soft_listing_id), ENotListed);
        let listing = table::borrow_mut(&mut marketplace.listings, soft_listing_id);
        
        assert!(listing.listing_type == SOFT_LISTING, EInvalidListing);
        assert!(listing.owner == sender, ENotOwner);
        assert!(listing.active, EListingNotActive);
        assert!(list_price > 0, EInvalidPrice);
        
        listing.listing_type = REAL_LISTING;
        listing.list_price = list_price;
        
        // Only add an escrow entry if one doesn't already exist
        if (!table::contains(&marketplace.escrow, soft_listing_id)) {
            let empty_balance = balance::zero<SUI>();
            table::add(&mut marketplace.escrow, soft_listing_id, empty_balance);
        };
        
        // Update the nft_id in the listing to be the actual NFT ID
        listing.nft_id = object::id_address(&nft);
        
        // Store the NFT as a dynamic object field on the marketplace using the nft_id as the key
        dof::add(&mut marketplace.id, listing.nft_id, nft);
        
        event::emit(ListingCreated {
            listing_id: soft_listing_id,
            nft_id: listing.nft_id,
            owner: listing.owner,
            listing_type: REAL_LISTING,
            price: list_price,
            min_bid: listing.min_bid,
            start_time: tx_context::epoch_timestamp_ms(ctx),
            end_time: listing.end_time,
        });
    }

    // Place a bid on a listing (handles both soft and real listings)
    public entry fun place_bid(
        marketplace: &mut Marketplace,
        listing_id: address,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let bidder = tx_context::sender(ctx);
        let bid_amount = coin::value(&payment);
        
        // Get the listing and bid pool
        let listing = table::borrow_mut(&mut marketplace.listings, listing_id);
        assert!(listing.active, EListingNotActive);
        assert!(bid_amount >= listing.min_bid, EInsufficientBid);
        
        // Check if end time has passed 
        if (listing.end_time > 0) {
            assert!(tx_context::epoch_timestamp_ms(ctx) <= listing.end_time, EListingNotActive);
        };
        
        let bid_pool = table::borrow_mut(&mut marketplace.bid_pools, listing_id);
  
        // Handle previous bid from this bidder if it exists
        if (vec_map::contains(&bid_pool.bids, &bidder)) {
                let previous_bid = *vec_map::get(&bid_pool.bids, &bidder);
                let escrow = table::borrow_mut(&mut marketplace.escrow, listing_id);
                
                // Return previous bid to bidder
                let prev_balance = balance::split(escrow, previous_bid);
                let prev_payment = coin::from_balance(prev_balance, ctx);
                transfer::public_transfer(prev_payment, bidder);
                
                // Remove the old bid entry before inserting the new one
                vec_map::remove(&mut bid_pool.bids, &bidder);
            } else {
                // Increment bid count for new bidder
                bid_pool.bid_count = bid_pool.bid_count + 1;
            };
            
            // Put new bid in escrow
            let escrow = table::borrow_mut(&mut marketplace.escrow, listing_id);
            balance::join(escrow, coin::into_balance(payment));
        
        // Update bid in bid pool
        vec_map::insert(&mut bid_pool.bids, bidder, bid_amount);
        
        // Update highest bid if necessary
        let mut is_highest = false;
        if (bid_amount > listing.highest_bid) {
            listing.highest_bid = bid_amount;
            listing.highest_bidder = bidder;
            is_highest = true;
            
            // If bid matches or exceeds list price, auto-complete the listing (only for real listings);
        // if (listing.listing_type == REAL_LISTING && bid_amount >= listing.list_price && listing.list_price > 0) {
        //         complete_listing<T>(marketplace, listing_id, ctx);
        // };
        };
        
        // Emit bid placed event
        event::emit(BidPlaced {
            listing_id,
            bidder,
            bid_amount,
            is_highest,
        });
    }

    // Accept a bid and complete a real listing
    public entry fun accept_bid<T: key + store>(
        marketplace: &mut Marketplace,
        listing_id: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let listing = table::borrow(&marketplace.listings, listing_id);
        
        // Only owner can accept a bid
        assert!(listing.owner == sender, ENotOwner);
        assert!(listing.listing_type == REAL_LISTING, EInvalidListingNotRealListing);
        assert!(listing.active, EListingNotActive);
        assert!(listing.highest_bid > 0, EInvalidBid);

        let listing = table::borrow_mut(&mut marketplace.listings, listing_id);
        assert!(listing.active, EListingNotActive);
        assert!(listing.listing_type == REAL_LISTING, EInvalidListingNotRealListing);
        assert!(listing.highest_bid > 0, EInvalidBid);
        
        // Mark listing as inactive
        listing.active = false;
        let nftId = listing.nft_id;
        // Remove from active listing IDs
        let mut i = 0;
        let mut active_index = 0;
        let len = vector::length(&marketplace.active_listing_ids);
        let mut found = false;
        
        while (i < len) {
            let id = *vector::borrow(&marketplace.active_listing_ids, i);
            if (id == listing_id) {
                active_index = i;
                found = true;
                break
            };
            i = i + 1;
        };
        
        if (found) {
            vector::remove(&mut marketplace.active_listing_ids, active_index);
        };
        
        let final_price = listing.highest_bid;
        let buyer = listing.highest_bidder;
        let seller = listing.owner;
        
        // Update marketplace statistics
        marketplace.total_volume = marketplace.total_volume + final_price;
        
        // Calculate and deduct platform fee
        let fee_amount = (final_price * marketplace.fee_percentage) / 10000;
        let seller_amount = final_price - fee_amount;
        
        // Transfer funds from escrow
        let escrow = table::borrow_mut(&mut marketplace.escrow, listing_id);
        
        // Add fee to treasury
        let fee_balance = balance::split(escrow, fee_amount);
        balance::join(&mut marketplace.treasury, fee_balance);

        let mut seller_settlement = 0;

           // complete_listing<T>(marketplace, listing_id, ctx);

        if (table::contains(&marketplace.staking_pools, listing_id)) {
            let staking_pool = table::borrow(&marketplace.staking_pools, listing_id);
            if (staking_pool.total_staked > 0) {
                let rewards_total = (final_price * staking_pool.rewards_rate) / 10000;
                // Calculate and transfer rewards to each staker
                let stakers = vec_map::keys(&staking_pool.stakes);
                let mut i = 0;
                let len = vector::length(&stakers);
                
                while (i < len) {
                    let staker = *vector::borrow(&stakers, i);
                    let stake_amount = *vec_map::get(&staking_pool.stakes, &staker);
                    let staker_share = (stake_amount * rewards_total) / staking_pool.total_staked;
                    
                    // Transfer reward to staker
                    let staker_reward = balance::split(escrow, staker_share);
                    let reward_payment = coin::from_balance(staker_reward, ctx);
                    transfer::public_transfer(reward_payment, staker);
                    
                    i = i + 1;
                };
                
                // Reduce seller amount by rewards_total
                seller_settlement = seller_amount - rewards_total;
            };
        };

                
        // Send payment to seller
        let seller_balance = balance::split(escrow, seller_settlement);
        let seller_payment = coin::from_balance(seller_balance, ctx);

        transfer::public_transfer(seller_payment, seller);
        
        // For any remaining bids, return them to their bidders
        let bid_pool = table::borrow(&marketplace.bid_pools, listing_id);
        let bidders = vec_map::keys(&bid_pool.bids);
        
        let mut i = 0;
        let len = vector::length(&bidders);
        
        while (i < len) {
            let bidder = *vector::borrow(&bidders, i);
            
        // Skip the winner, their payment is already handled
        if (bidder != buyer) {
                let bid_amount = *vec_map::get(&bid_pool.bids, &bidder);
                
                // Return bid to bidder if there's enough in escrow
                if (bid_amount > 0 && balance::value(escrow) >= bid_amount) {
                    let bid_balance = balance::split(escrow, bid_amount);
                    let payment = coin::from_balance(bid_balance, ctx);
                    transfer::public_transfer(payment, bidder);
                };
            };
            
            i = i + 1;
        };
        
        // Transfer the NFT from the marketplace to the buyer
        // Use dynamic field to retrieve the NFT and transfer it to the buyer
        // transfer_nft<T>(marketplace, nftId, buyer, ctx);

        let nft = dof::remove<address, T>(&mut marketplace.id, nftId);
        transfer::public_transfer(nft, buyer);
        
        // Emit listing completed event
        event::emit(ListingCompleted {
            listing_id,
            nft_id: nftId,
            seller,
            buyer,
            final_price,
            listing_type: REAL_LISTING,
            success: true,
        });
        
     
    }

    // Cancel a listing
    public entry fun cancel_listing(
        marketplace: &mut Marketplace,
        listing_id: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let listing = table::borrow_mut(&mut marketplace.listings, listing_id);
        
        // Only owner can cancel a listing
        assert!(listing.owner == sender, ENotOwner);
        assert!(listing.active, EListingNotActive);
        
        // Mark listing as inactive
        listing.active = false;
        
        // Remove from active listing IDs
        let mut i = 0;
        let mut active_index = 0;
        let len = vector::length(&marketplace.active_listing_ids);
        let mut found = false;
        
        while (i < len) {
            let id = *vector::borrow(&marketplace.active_listing_ids, i);
            if (id == listing_id) {
                active_index = i;
                found = true;
                break
            };
            i = i + 1;
        };
        
        if (found) {
            vector::remove(&mut marketplace.active_listing_ids, active_index);
        };
        
        let bid_pool = table::borrow(&marketplace.bid_pools, listing_id);
        let bidders = vec_map::keys(&bid_pool.bids);
        let escrow = table::borrow_mut(&mut marketplace.escrow, listing_id);
        
        let mut i = 0;
        let len = vector::length(&bidders);
        
        while (i < len) {
            let bidder = *vector::borrow(&bidders, i);
            let bid_amount = *vec_map::get(&bid_pool.bids, &bidder);
            
            // Return bid to bidder
            if (bid_amount > 0 && balance::value(escrow) >= bid_amount) {
                let bid_balance = balance::split(escrow, bid_amount);
                let payment = coin::from_balance(bid_balance, ctx);
                transfer::public_transfer(payment, bidder);
            };
            
            i = i + 1;
        };
        
        // Add this code to return stakes when a listing is cancelled
        if (table::contains(&marketplace.staking_pools, listing_id)) {
            let staking_pool = table::borrow(&marketplace.staking_pools, listing_id);
            let stakers = vec_map::keys(&staking_pool.stakes);
            
            let mut i = 0;
            let len = vector::length(&stakers);
            
            while (i < len) {
                let staker = *vector::borrow(&stakers, i);
                let stake_amount = *vec_map::get(&staking_pool.stakes, &staker);
                
                // Return stake to staker
                if (stake_amount > 0 && balance::value(escrow) >= stake_amount) {
                    let stake_balance = balance::split(escrow, stake_amount);
                    let payment = coin::from_balance(stake_balance, ctx);
                    transfer::public_transfer(payment, staker);
                    
                    // Emit stake withdrawn event
                    event::emit(StakeWithdrawn {
                        listing_id,
                        staker,
                        amount: stake_amount,
                    });
                };
                
                i = i + 1;
            };
        };
        
        // Emit listing completed event
        event::emit(ListingCompleted {
            listing_id,
            nft_id: listing.nft_id,
            seller: listing.owner,
            buyer: @0x0,
            final_price: 0,
            listing_type: listing.listing_type,
            success: false,
        });
    }

  

    // === Helper Functions ===

    // Complete a listing by transferring the NFT and payment
    fun complete_listing<T: key + store>(
        marketplace: &mut Marketplace,
        listing_id: address,
        ctx: &mut TxContext
    ) {
        // let mut nftId:address = @0x0;
        // let mut listing_id:address = @0x0;
        // let mut buyer:address = @0x0;
        // let mut seller:address = @0x0;
        // let mut final_price:u64 = 0;
       
    }

    // Transfer an NFT from marketplace to a recipient
    public fun transfer_nft<T: key + store>(
        marketplace: &mut Marketplace,
        nft_id: address,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // Remove the NFT from the dynamic object field and transfer it to the recipient
        let nft = dof::remove<address, T>(&mut marketplace.id, nft_id);
        transfer::public_transfer(nft, recipient);
    }

    // === View Functions ===

    // Get listing details
    public fun get_listing_details(
        marketplace: &Marketplace, 
        listing_id: address
    ): (address, address, u64, u8, u64, u64, address, bool, u64, u64, u64) {
        let listing = table::borrow(&marketplace.listings, listing_id);
        
        (
            listing.owner,
            listing.nft_id,
            listing.list_price,
            listing.listing_type,
            listing.min_bid,
            listing.highest_bid,
            listing.highest_bidder,
            listing.active,
            listing.verification_score,
            listing.start_time,
            listing.end_time
        )
    }

    // Get the number of bids on a listing
    public fun get_bid_count(
        marketplace: &Marketplace, 
        listing_id: address
    ): u64 {
        let bid_pool = table::borrow(&marketplace.bid_pools, listing_id);
        bid_pool.bid_count
    }

    public fun get_stake_amount(
        marketplace: &Marketplace, 
        listing_id: address
    ): u64 {
        let bid_pool = table::borrow(&marketplace.bid_pools, listing_id);
        bid_pool.bid_count
    }

    // Check if a user has staked on a listing and return the staked amount
    public fun get_user_stake(
        marketplace: &Marketplace, 
        listing_id: address,
        staker: address
    ): (bool, u64) {
        // Check if the staking pool exists
        if (!table::contains(&marketplace.staking_pools, listing_id)) {
            return (false, 0)
        };
        
        let staking_pool = table::borrow(&marketplace.staking_pools, listing_id);
        
        // Check if user has staked
        if (vec_map::contains(&staking_pool.stakes, &staker)) {
            let stake_amount = *vec_map::get(&staking_pool.stakes, &staker);
            (true, stake_amount)
        } else {
            (false, 0)
        }
    }

    // Get the number of stakers for a listing
    public fun get_stakers_count(
        marketplace: &Marketplace, 
        listing_id: address
    ): u64 {
        // Check if the staking pool exists
        if (!table::contains(&marketplace.staking_pools, listing_id)) {
            return 0
        };
        
        let staking_pool = table::borrow(&marketplace.staking_pools, listing_id);
        
        // Return the count of unique stakers by getting the length of the keys
        let stakers = vec_map::keys(&staking_pool.stakes);
        vector::length(&stakers)
    }

    //list of stakers
      public fun get_stakers(
        marketplace: &Marketplace, 
        listing_id: address
    ): vector<address> {
        // Check if the staking pool exists
        if (!table::contains(&marketplace.staking_pools, listing_id)) {
            return vector::empty()
        };
        
        let staking_pool = table::borrow(&marketplace.staking_pools, listing_id);
        
        // Return the count of unique stakers by getting the length of the keys
        let stakers = vec_map::keys(&staking_pool.stakes);
        (stakers)
    }

    // Get the platform fee percentage
    public fun get_fee_percentage(marketplace: &Marketplace): u64 {
        marketplace.fee_percentage
    }

    // Get the total trading volume
    public fun get_total_volume(marketplace: &Marketplace): u64 {
        marketplace.total_volume
    }

    // Get the total number of listings
    public fun get_total_listings(marketplace: &Marketplace): u64 {
        marketplace.total_listings
    }

    // === Admin Functions ===

    // Update the platform fee percentage (admin only)
    public entry fun update_fee_percentage(
        _: &MarketplaceCap,
        marketplace: &mut Marketplace, 
        new_percentage: u64 
    ) {
        assert!(new_percentage <= 1000, EInvalidListing); // Max 10%
        marketplace.fee_percentage = new_percentage;
    }

    // Withdraw accumulated fees from treasury (admin only)
    public entry fun withdraw_fees(
        _: &MarketplaceCap,
        marketplace: &mut Marketplace, 
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(amount <= balance::value(&marketplace.treasury), EInsufficientBid);
        
        let fee_balance = balance::split(&mut marketplace.treasury, amount);
        let payment = coin::from_balance(fee_balance, ctx);
        transfer::public_transfer(payment, recipient);
    }

    // Update the verification score of a listing
    public entry fun update_verification_score(
        _: &MarketplaceCap,
        marketplace: &mut Marketplace,
        listing_id: address,
        score: u64,
        ctx: &mut TxContext
    ) {
        assert!(score <= 100, EInvalidListing);
        
        let listing = table::borrow_mut(&mut marketplace.listings, listing_id);
        listing.verification_score = score;
        
        event::emit(VerificationUpdated {
            listing_id,
            nft_id: listing.nft_id,
            new_score: score,
            verifier: tx_context::sender(ctx),
        });
    }

    // Stake SUI on a listing
    public entry fun stake_on_listing(
        marketplace: &mut Marketplace,
        listing_id: address,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let staker = tx_context::sender(ctx);
        let stake_amount = coin::value(&payment);
        
        // Ensure listing exists and is active
        assert!(table::contains(&marketplace.listings, listing_id), ENotListed);
        let listing = table::borrow(&marketplace.listings, listing_id);
        assert!(listing.active, EListingNotActive);
        
        // Get or create staking pool
        if (!table::contains(&marketplace.staking_pools, listing_id)) {
            table::add(&mut marketplace.staking_pools, listing_id, StakingPool {
                stakes: vec_map::empty(),
                total_staked: 0,
                rewards_rate: 1000, // 10% default reward rate (basis points)
            });
        };
        
        let staking_pool = table::borrow_mut(&mut marketplace.staking_pools, listing_id);
        
        // Add stake to pool
        if (vec_map::contains(&staking_pool.stakes, &staker)) {
            let old_stake = *vec_map::get(&staking_pool.stakes, &staker);
            vec_map::remove(&mut staking_pool.stakes, &staker);
            vec_map::insert(&mut staking_pool.stakes, staker, old_stake + stake_amount);
        } else {
            vec_map::insert(&mut staking_pool.stakes, staker, stake_amount);
        };
        
        // Update total staked
        staking_pool.total_staked = staking_pool.total_staked + stake_amount;
        
        // Put stake in escrow
        let escrow = table::borrow_mut(&mut marketplace.escrow, listing_id);
        balance::join(escrow, coin::into_balance(payment));
        
        // Emit stake event
        event::emit(StakeAdded {
            listing_id,
            staker,
            stake_amount,
            total_staked: staking_pool.total_staked,
        });
    }

    // Withdraw stake from a listing that is no longer active
    public entry fun withdraw_stake(
        marketplace: &mut Marketplace,
        listing_id: address,
        ctx: &mut TxContext
    ) {
        let staker = tx_context::sender(ctx);
        
        // Ensure listing exists
        assert!(table::contains(&marketplace.listings, listing_id), ENotListed);
        let listing = table::borrow(&marketplace.listings, listing_id);
        
        // Can only withdraw if listing is inactive or expired
        assert!(!listing.active || (listing.end_time > 0 && tx_context::epoch_timestamp_ms(ctx) > listing.end_time), 
               EListingNotActive);
        
        // Ensure staking pool exists and user has staked
        assert!(table::contains(&marketplace.staking_pools, listing_id), EInvalidListing);
        let staking_pool = table::borrow_mut(&mut marketplace.staking_pools, listing_id);
        assert!(vec_map::contains(&staking_pool.stakes, &staker), ENotOwner);
        
        // Get stake amount
        let stake_amount = *vec_map::get(&staking_pool.stakes, &staker);
        vec_map::remove(&mut staking_pool.stakes, &staker);
        
        // Update total staked
        staking_pool.total_staked = staking_pool.total_staked - stake_amount;
        
        // Return stake from escrow
        let escrow = table::borrow_mut(&mut marketplace.escrow, listing_id);
        let stake_balance = balance::split(escrow, stake_amount);
        let stake_payment = coin::from_balance(stake_balance, ctx);
        transfer::public_transfer(stake_payment, staker);
        
        // Emit stake withdrawn event
        event::emit(StakeWithdrawn {
            listing_id,
            staker,
            amount: stake_amount,
        });
    }

    // Add a function to update staking reward rate (admin only)
    public entry fun update_staking_reward_rate(
        _: &MarketplaceCap,
        marketplace: &mut Marketplace,
        listing_id: address,
        new_rate: u64,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&marketplace.listings, listing_id), ENotListed);
        assert!(new_rate <= 3000, EInvalidPrice); // Max 30% reward rate
        
        // Get or create staking pool
        if (!table::contains(&marketplace.staking_pools, listing_id)) {
            table::add(&mut marketplace.staking_pools, listing_id, StakingPool {
                stakes: vec_map::empty(),
                total_staked: 0,
                rewards_rate: new_rate,
            });
        } else {
            let staking_pool = table::borrow_mut(&mut marketplace.staking_pools, listing_id);
            staking_pool.rewards_rate = new_rate;
        };
    }

    // Relist an NFT using the same listing ID it was purchased from
public entry fun relist_on_same_listing<T: key + store>(
    marketplace: &mut Marketplace,
    listing_id: address,
    nft: T,
    new_price: u64,
    new_min_bid: u64,
    new_end_time: u64,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    let nft_id = object::id_address(&nft);
    
    // Verify listing exists
    assert!(table::contains(&marketplace.listings, listing_id), ENotListed);
    
    // Get the listing
    let listing = table::borrow_mut(&mut marketplace.listings, listing_id);
    
    // Make sure listing is inactive (a completed sale)
    assert!(!listing.active, EListingNotActive);
    
    // Verify sender was the buyer of this listing
    assert!(listing.highest_bidder == sender, ENotOwner);
    
    // CRITICAL: Verify this is the same NFT that was sold in the previous listing
    assert!(listing.nft_id == nft_id, EInvalidListing);
    
    // Validate price inputs
    assert!(new_price > 0, EInvalidPrice);
    assert!(new_min_bid > 0, EInvalidBid);
    
    // Update listing details for new sale
    listing.owner = sender;                   // Previous buyer is now the seller
    listing.list_price = new_price;           // Set new sale price
    listing.listing_type = REAL_LISTING;      // Always a real listing
    listing.min_bid = new_min_bid;            // Set new minimum bid
    listing.highest_bid = 0;                  // Reset highest bid
    listing.highest_bidder = @0x0;            // Reset highest bidder
    listing.active = true;                    // Make listing active again
    listing.start_time = tx_context::epoch_timestamp_ms(ctx); // Current time as start time
    listing.end_time = new_end_time;          // Set new end time
    
    // Clear old bids
    let bid_pool = table::borrow_mut(&mut marketplace.bid_pools, listing_id);
    bid_pool.bids = vec_map::empty();
    bid_pool.bid_count = 0;
    
    // Add NFT to marketplace escrow
    dof::add(&mut marketplace.id, nft_id, nft);
    
    // Ensure the listing is in active_listing_ids
    let mut found = false;
    let len = vector::length(&marketplace.active_listing_ids);
    let mut i = 0;
    
    while (i < len) {
        if (*vector::borrow(&marketplace.active_listing_ids, i) == listing_id) {
            found = true;
            break
        };
        i = i + 1;
    };
    
    if (!found) {
        vector::push_back(&mut marketplace.active_listing_ids, listing_id);
    };
    
    // Emit listing created event
    event::emit(ListingCreated {
        listing_id,
        nft_id,
        owner: sender,
        listing_type: REAL_LISTING,
        price: new_price,
        min_bid: new_min_bid,
        start_time: tx_context::epoch_timestamp_ms(ctx),
        end_time: new_end_time,
    });

     event::emit(RelistingCreated {
        listing_id,
        nft_id,
        owner: sender,
        listing_type: REAL_LISTING,
        price: new_price,
        min_bid: new_min_bid,
        start_time: tx_context::epoch_timestamp_ms(ctx),
        end_time: new_end_time,
    });
   }

    // === Test Helper Functions ===
    
    // Get listing type constants
    #[test_only]
    public fun get_soft_listing_type(): u8 {
        SOFT_LISTING
    }
    
    #[test_only]
    public fun get_real_listing_type(): u8 {
        REAL_LISTING
    }
    
    // Check if a listing is active
    #[test_only]
    public fun is_listing_active(marketplace: &Marketplace, listing_id: address): bool {
        let listing = table::borrow(&marketplace.listings, listing_id);
        listing.active
    }
    
    // Get listing type
    #[test_only]
    public fun get_listing_type(marketplace: &Marketplace, listing_id: address): u8 {
        let listing = table::borrow(&marketplace.listings, listing_id);
        listing.listing_type
    }
    
    // Get listing IDs with pagination and filtering
    #[test_only]
    public fun get_listing_ids(
        marketplace: &Marketplace,
        offset: u64,
        limit: u64,
        active_only: bool,
        listing_type: u8
    ): (vector<address>, u64) {
        let mut result = vector::empty<address>();
        let mut count = 0;
        
        let ids = if (active_only) {
            &marketplace.active_listing_ids
        } else {
            &marketplace.listing_ids
        };
        
        let total_items = vector::length(ids);
        if (offset >= total_items) {
            return (result, 0)
        };
        
        let mut i = offset;
        let end = if (offset + limit > total_items) {
            total_items
        } else {
            offset + limit
        };
        
        while (i < end) {
            let id = *vector::borrow(ids, i);
            let listing = table::borrow(&marketplace.listings, id);
            
            // Filter by listing type
            if (listing.listing_type == listing_type) {
                vector::push_back(&mut result, id);
                count = count + 1;
            };
            i = i + 1;
        };
        
        (result, count)
    }
    
    // Get multiple listings details by IDs
    #[test_only]
    public fun get_multiple_listings(
        marketplace: &Marketplace,
        listing_ids: vector<address>
    ): vector<Listing> {
        let mut result = vector::empty<Listing>();
        let len = vector::length(&listing_ids);
        let mut i = 0;
        
        while (i < len) {
            let id = *vector::borrow(&listing_ids, i);
            if (table::contains(&marketplace.listings, id)) {
                let listing = *table::borrow(&marketplace.listings, id);
                vector::push_back(&mut result, listing);
            };
            i = i + 1;
        };
        
        result
    }

}
