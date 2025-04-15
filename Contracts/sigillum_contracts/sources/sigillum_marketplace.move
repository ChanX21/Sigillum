module sigillum_contracts::sigillum_marketplace {
    
    // use sui::object::{Self, UID};
    // use sui::transfer;
    // use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use std::string::{String};
    // use std::vector;
    // use sigillum_contracts::sigillum_nft::{Self, PhotoNFT};

    // Error constants
    const EInvalidListing: u64 = 1;
    const EInvalidBid: u64 = 2;
    const EInsufficientBid: u64 = 3;
    const EListingNotActive: u64 = 4;
    const ENotOwner: u64 = 5;
    const EInvalidPrice: u64 = 6;
    // const EAlreadyListed: u64 = 7;
    const ENotListed: u64 = 8;
    // const EInvalidAuth: u64 = 9;
    const EInvalidListingNotRealListing: u64 = 10;


    // MarketplaceCap for admin operations
    public struct MarketplaceCap has key, store {
        id: UID
    }

    // Listing types
    const SOFT_LISTING: u8 = 0;   // For valuation and authenticity only
    const REAL_LISTING: u8 = 1;   // For actual sale

    // Structs for the marketplace
    
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

    // Marketplace object to keep track of all listings
    public struct Marketplace has key {
        id: UID,
        // Maps listing ID to Listing object
        listings: Table<address, Listing>,
        // Maps listing ID to BidPool
        bid_pools: Table<address, BidPool>,
        // Maps listing ID to escrow funds for REAL_LISTING
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

    // Emitted when an authenticity verification score is updated
    public struct VerificationUpdated has copy, drop {
        listing_id: address,
        nft_id: address,
        new_score: u64,
        verifier: address,
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
        };

        transfer::transfer(
            AdminCap { id: object::new(ctx) },
            tx_context::sender(ctx)
        );
        
        transfer::share_object(marketplace);
    }

    // === Core Functions ===

    // Create a soft listing for valuation and authenticity verification
    public entry fun create_soft_listing(
        _: &AdminCap,
        marketplace: &mut Marketplace,
        nft_id: address,
        min_bid: u64,
        description: String,
        metadata: String,
        end_time: u64,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
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
            start_time: tx_context::epoch(ctx),
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
            start_time: tx_context::epoch(ctx),
            end_time,
        });
        
        object::delete(listing_id);
    }

    // Create a real listing for selling the NFT - function signature kept for reference
    // This original function is now commented out as we're replacing it with convert_to_real_listing
    /* 
    public entry fun create_real_listing(
        marketplace: &mut Marketplace,
        photo: &PhotoNFT,
        list_price: u64,
        min_bid: u64,
        description: String,
        metadata: String,
        end_time: u64,
        ctx: &mut TxContext
    ) {
        // Original implementation...
    }
    */

    // Convert a soft listing to a real listing for selling the NFT
    public entry fun convert_to_real_listing(
        marketplace: &mut Marketplace,
        soft_listing_id: address,
        list_price: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verify the soft listing exists and is active
        assert!(table::contains(&marketplace.listings, soft_listing_id), ENotListed);
        let listing = table::borrow_mut(&mut marketplace.listings, soft_listing_id);
        
        // Verify it's a soft listing
        assert!(listing.listing_type == SOFT_LISTING, EInvalidListing);
        
        // Verify sender is the owner
        assert!(listing.owner == sender, ENotOwner);
        
        // Verify the listing is active
        assert!(listing.active, EListingNotActive);
        
        // Ensure the price is valid
        assert!(list_price > 0, EInvalidPrice);
        
        // Convert the listing to a real listing
        listing.listing_type = REAL_LISTING;
        listing.list_price = list_price;
        
        // Create an empty escrow balance for the listing
        let empty_balance = balance::zero<SUI>();
        table::add(&mut marketplace.escrow, soft_listing_id, empty_balance);
        
        // Emit listing converted event
        event::emit(ListingCreated {
            listing_id: soft_listing_id,
            nft_id: listing.nft_id,
            owner: listing.owner,
            listing_type: REAL_LISTING,
            price: list_price,
            min_bid: listing.min_bid,
            start_time: tx_context::epoch(ctx), // Reset start time to conversion time
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
            assert!(tx_context::epoch(ctx) <= listing.end_time, EListingNotActive);
        };
        
        let bid_pool = table::borrow_mut(&mut marketplace.bid_pools, listing_id);
        
        // Handle based on listing type
        if (listing.listing_type == REAL_LISTING) {
            // For real listings, handle payment and escrow
            
            // Handle previous bid from this bidder if it exists
            if (vec_map::contains(&bid_pool.bids, &bidder)) {
                let previous_bid = *vec_map::get(&bid_pool.bids, &bidder);
                let escrow = table::borrow_mut(&mut marketplace.escrow, listing_id);
                
                // Return previous bid to bidder
                let prev_balance = balance::split(escrow, previous_bid);
                let prev_payment = coin::from_balance(prev_balance, ctx);
                transfer::public_transfer(prev_payment, bidder);
            } else {
                // Increment bid count for new bidder
                bid_pool.bid_count = bid_pool.bid_count + 1;
            };
            
            // Put new bid in escrow
            let escrow = table::borrow_mut(&mut marketplace.escrow, listing_id);
            balance::join(escrow, coin::into_balance(payment));
            
        } else {
            // For soft listings, just record the bid amount without payment
            // Return the payment to the bidder as it's just an indicative bid
            transfer::public_transfer(payment, bidder);
            
            // Update bid count if this is a new bidder
            if (!vec_map::contains(&bid_pool.bids, &bidder)) {
                bid_pool.bid_count = bid_pool.bid_count + 1;
            };
        };
        
        // Update bid in bid pool
        vec_map::insert(&mut bid_pool.bids, bidder, bid_amount);
        
        // Update highest bid if necessary
        let mut is_highest = false;
        if (bid_amount > listing.highest_bid) {
            listing.highest_bid = bid_amount;
            listing.highest_bidder = bidder;
            is_highest = true;
            
            // If bid matches or exceeds list price, auto-complete the listing (only for real listings)
            if (listing.listing_type == REAL_LISTING && bid_amount >= listing.list_price && listing.list_price > 0) {
                complete_listing(marketplace, listing_id, ctx);
            };
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
    public entry fun accept_bid(
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
        
        complete_listing(marketplace, listing_id, ctx);
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
        
        // For real listings, return all bids
        if (listing.listing_type == REAL_LISTING) {
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

    // Update the verification score for a listing (admin or trusted verifier only)
    public entry fun update_verification_score(
        _: &MarketplaceCap,
        marketplace: &mut Marketplace,
        listing_id: address,
        score: u64,
        ctx: &mut TxContext
    ) {
        assert!(score <= 100, EInvalidListing); // Score must be 0-100
        
        let listing = table::borrow_mut(&mut marketplace.listings, listing_id);
        listing.verification_score = score;
        
        // Emit verification updated event
        event::emit(VerificationUpdated {
            listing_id,
            nft_id: listing.nft_id,
            new_score: score,
            verifier: tx_context::sender(ctx),
        });
    }

    // === Helper Functions ===

    // Complete a listing by transferring the NFT and payment
    fun complete_listing(
        marketplace: &mut Marketplace,
        listing_id: address,
        ctx: &mut TxContext
    ) {
        let listing = table::borrow_mut(&mut marketplace.listings, listing_id);
        assert!(listing.active, EListingNotActive);
        assert!(listing.listing_type == REAL_LISTING, EInvalidListingNotRealListing);
        assert!(listing.highest_bid > 0, EInvalidBid);
        
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
        
        // Send payment to seller
        let seller_balance = balance::split(escrow, seller_amount);
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
        
        // Emit listing completed event
        event::emit(ListingCompleted {
            listing_id,
            nft_id: listing.nft_id,
            seller,
            buyer,
            final_price,
            listing_type: REAL_LISTING,
            success: true,
        });
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

    // Get listing IDs with pagination support
    // Returns: Vector of listing IDs and a boolean indicating if there are more listings
    public fun get_listing_ids(
        marketplace: &Marketplace,
        start_idx: u64,
        limit: u64,
        only_active: bool,
        listing_type: u8
    ): (vector<address>, bool) {
        // Determine which vector to use
        let ids_vector = if (only_active) {
            &marketplace.active_listing_ids
        } else {
            &marketplace.listing_ids
        };
        
        let total_ids = vector::length(ids_vector);
        
        // If there are no listings or start_idx is beyond the total count, return empty vector
        if (total_ids == 0 || start_idx >= total_ids) {
            return (vector::empty<address>(), false)
        };
        
        // Adjust limit if it's too large
        let mut adjusted_limit = limit;
        let max_possible = total_ids - start_idx;
        if (adjusted_limit > max_possible) {
            adjusted_limit = max_possible;
        };
        
        // Prepare result vector
        let mut result = vector::empty<address>();
        let mut added_count = 0;
        
        let mut i = start_idx;
        let end_idx = start_idx + adjusted_limit;
        
        // Skip to start_idx and collect up to limit items
        while (i < end_idx && i < total_ids) {
            let listing_id = *vector::borrow(ids_vector, i);
            
            // If a listing type filter is specified (non-zero), check the listing type
            if (listing_type == 0 || 
                (table::contains(&marketplace.listings, listing_id) && 
                 table::borrow(&marketplace.listings, listing_id).listing_type == listing_type)) {
                vector::push_back(&mut result, listing_id);
                added_count = added_count + 1;
            };
            
            i = i + 1;
        };
        
        let has_more = i < total_ids;
        
        (result, has_more)
    }
    
    // Get details for multiple listings by their IDs
    public fun get_multiple_listings(
        marketplace: &Marketplace,
        listing_ids: vector<address>
    ): vector<Listing> {
        let mut result = vector::empty<Listing>();
        let mut i = 0;
        let len = vector::length(&listing_ids);
        
        while (i < len) {
            let listing_id = *vector::borrow(&listing_ids, i);
            if (table::contains(&marketplace.listings, listing_id)) {
                let listing = *table::borrow(&marketplace.listings, listing_id);
                vector::push_back(&mut result, listing);
            };
            i = i + 1;
        };
        
        result
    }

    // Get the number of bids on a listing
    public fun get_bid_count(
        marketplace: &Marketplace, 
        listing_id: address
    ): u64 {
        let bid_pool = table::borrow(&marketplace.bid_pools, listing_id);
        bid_pool.bid_count
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
}
