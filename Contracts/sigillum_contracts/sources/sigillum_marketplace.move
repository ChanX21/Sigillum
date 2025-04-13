// module sigillum_contracts::sigillum_marketplace {
//     use sui::object::{Self, UID, ID};
//     use sui::transfer;
//     use sui::tx_context::{Self, TxContext};
//     use sui::coin::{Self, Coin};
//     use sui::sui::SUI;
//     use sui::event;
//     use sui::table::{Self, Table};
//     use sui::vec_map::{Self, VecMap};
//     use sui::balance::{Self, Balance};
//     use std::string::{String};
//     use std::vector;
//     use sigillum_contracts::sigillum_nft::{Self, PhotoNFT};

//     // === Error Constants ===
//     const EListingNotFound: u64 = 1;
//     const EInvalidPrice: u64 = 2;
//     const EUnauthorized: u64 = 3;
//     const ESoftBidAlreadyExists: u64 = 4;
//     const EInvalidBidAmount: u64 = 5;
//     const EBidNotFound: u64 = 6;
//     const EInsufficientFunds: u64 = 7;
//     const ENotListed: u64 = 8;
//     const ENotSoftListed: u64 = 9;
//     const ESoftListingExistsForNFT: u64 = 10;

//     // === Core Structs ===

//     // Capability for marketplace administration
//     public struct AdminCap has key, store {
//         id: UID
//     }

//     // Central marketplace object
//     public struct Marketplace has key {
//         id: UID,
//         // Tables to track listings and soft bids
//         listings: Table<ID, Listing>,
//         soft_listings: Table<ID, SoftListing>,
//         soft_bids: Table<ID, VecMap<address, SoftBid>>,
//         bids: Table<ID, VecMap<address, Bid>>,
//         // Marketplace fee in basis points (e.g., 250 = 2.5%)
//         fee_bps: u64,
//         // Treasury address to collect fees
//         treasury: address,
//         // Balance to hold fees
//         fee_balance: Balance<SUI>,
//     }

//     // Regular listing for direct purchase
//     public struct Listing has store, drop {
//         nft_id: ID,
//         seller: address,
//         price: u64,
//         description: String,
//         created_at: u64,
//     }

//     // Soft listing allows showing interest in selling without commitment
//     public struct SoftListing has store, drop {
//         nft_id: ID,
//         owner: address,
//         suggested_price: u64,
//         description: String,
//         created_at: u64,
//         // Added by which admin
//         created_by: address,
//     }

//     // Soft bid shows interest without financial commitment
//     public struct SoftBid has store, drop {
//         bidder: address,
//         amount: u64,
//         message: String,
//         created_at: u64,
//     }

//     // Real bid with locked funds
//     public struct Bid has store {
//         bidder: address,
//         amount: Balance<SUI>,
//         message: String,
//         created_at: u64,
//     }

//     // Receipt given to a seller when they list an NFT
//     public struct ListingReceipt has key, store {
//         id: UID,
//         nft_id: ID,
//         marketplace_id: ID,
//         seller: address,
//         price: u64,
//         created_at: u64,
//     }

//     // === Events ===
    
//     public struct NFTListed has copy, drop {
//         nft_id: ID,
//         seller: address,
//         price: u64,
//         marketplace_id: ID,
//     }

//     public struct NFTSoftListed has copy, drop {
//         nft_id: ID,
//         owner: address,
//         suggested_price: u64,
//         marketplace_id: ID,
//         admin: address,
//     }

//     public struct SoftListingConvertedToListing has copy, drop {
//         nft_id: ID,
//         owner: address,
//         price: u64,
//     }

//     public struct SoftBidPlaced has copy, drop {
//         nft_id: ID,
//         bidder: address,
//         amount: u64,
//     }

//     public struct BidPlaced has copy, drop {
//         nft_id: ID,
//         bidder: address,
//         amount: u64,
//     }

//     public struct NFTSold has copy, drop {
//         nft_id: ID,
//         seller: address,
//         buyer: address,
//         price: u64,
//     }

//     public struct BidAccepted has copy, drop {
//         nft_id: ID,
//         seller: address,
//         bidder: address,
//         amount: u64,
//     }

//     // === Initialization ===
    
//     fun init(ctx: &mut TxContext) {
//         // Create admin capability
//         transfer::transfer(
//             AdminCap { id: object::new(ctx) },
//             tx_context::sender(ctx)
//         );
        
//         let marketplace = Marketplace {
//             id: object::new(ctx),
//             listings: table::new(ctx),
//             soft_listings: table::new(ctx),
//             soft_bids: table::new(ctx),
//             bids: table::new(ctx),
//             fee_bps: 250, // Default 2.5% fee
//             treasury: tx_context::sender(ctx),
//             fee_balance: balance::zero(),
//         };
        
//         transfer::share_object(marketplace);
//     }

//     // For testing purposes only
//     #[test_only]
//     public fun init_for_testing(ctx: &mut TxContext): AdminCap {
//         let admin_cap = AdminCap { id: object::new(ctx) };
        
//         let marketplace = Marketplace {
//             id: object::new(ctx),
//             listings: table::new(ctx),
//             soft_listings: table::new(ctx),
//             soft_bids: table::new(ctx),
//             bids: table::new(ctx),
//             fee_bps: 250, // Default 2.5% fee
//             treasury: tx_context::sender(ctx),
//             fee_balance: balance::zero(),
//         };
        
//         transfer::share_object(marketplace);
//         admin_cap
//     }
    
//     // === Soft Listing Functions ===
    
//     // Only admin can create soft listings
//     public entry fun create_soft_listing(
//         _: &AdminCap,
//         marketplace: &mut Marketplace,
//         nft_id: ID,
//         owner: address,
//         suggested_price: u64,
//         description: String,
//         ctx: &mut TxContext
//     ) {
//         // Verify NFT doesn't already have a soft listing
//         assert!(!table::contains(&marketplace.soft_listings, nft_id), ESoftListingExistsForNFT);
        
//         let admin = tx_context::sender(ctx);
        
//         // Create soft listing
//         let soft_listing = SoftListing {
//             nft_id,
//             owner,
//             suggested_price,
//             description,
//             created_at: tx_context::epoch(ctx),
//             created_by: admin,
//         };
        
//         // Add to marketplace
//         table::add(&mut marketplace.soft_listings, nft_id, soft_listing);
        
//         // Initialize empty soft bids table for this NFT
//         if (!table::contains(&marketplace.soft_bids, nft_id)) {
//             table::add(&mut marketplace.soft_bids, nft_id, vec_map::empty<address, SoftBid>());
//         };
        
//         event::emit(NFTSoftListed {
//             nft_id,
//             owner,
//             suggested_price,
//             marketplace_id: object::id(marketplace),
//             admin,
//         });
//     }
    
//     // Owner can convert soft listing to a formal listing
//     public entry fun convert_soft_to_listing(
//         marketplace: &mut Marketplace,
//         nft: PhotoNFT,
//         price: u64,
//         ctx: &mut TxContext
//     ) {
//         let nft_id = object::id(&nft);
//         let sender = tx_context::sender(ctx);
        
//         // Verify there's a soft listing for this NFT
//         assert!(table::contains(&marketplace.soft_listings, nft_id), ENotSoftListed);
//         let soft_listing = table::borrow(&marketplace.soft_listings, nft_id);
        
//         // Verify sender is the owner specified in the soft listing
//         assert!(soft_listing.owner == sender, EUnauthorized);
        
//         // Verify price is valid
//         assert!(price > 0, EInvalidPrice);
        
//         // Create formal listing using data from soft listing
//         let listing = Listing {
//             nft_id,
//             seller: sender,
//             price,
//             description: soft_listing.description,
//             created_at: tx_context::epoch(ctx),
//         };
        
//         // Add to marketplace listings
//         if (table::contains(&marketplace.listings, nft_id)) {
//             table::remove(&mut marketplace.listings, nft_id);
//         };
//         table::add(&mut marketplace.listings, nft_id, listing);
        
//         // Remove soft listing
//         table::remove(&mut marketplace.soft_listings, nft_id);
        
//         // Create and transfer a receipt to the seller
//         let receipt = ListingReceipt {
//             id: object::new(ctx),
//             nft_id,
//             marketplace_id: object::id(marketplace),
//             seller: sender,
//             price,
//             created_at: tx_context::epoch(ctx),
//         };
//         transfer::transfer(receipt, sender);
        
//         // Transfer NFT to marketplace module (escrow)
//         transfer::public_share_object(nft);
        
//         event::emit(SoftListingConvertedToListing {
//             nft_id,
//             owner: sender,
//             price,
//         });
        
//         event::emit(NFTListed {
//             nft_id,
//             seller: sender,
//             price,
//             marketplace_id: object::id(marketplace),
//         });
//     }
    
//     // Place a soft bid - show interest in buying without financial commitment
//     public entry fun place_soft_bid(
//         marketplace: &mut Marketplace,
//         nft_id: ID,
//         amount: u64,
//         message: String,
//         ctx: &mut TxContext
//     ) {
//         let sender = tx_context::sender(ctx);
        
//         // Verify NFT has a soft listing
//         assert!(table::contains(&marketplace.soft_listings, nft_id), ENotSoftListed);
        
//         // Ensure there's a place to store bids for this NFT
//         if (!table::contains(&marketplace.soft_bids, nft_id)) {
//             table::add(&mut marketplace.soft_bids, nft_id, vec_map::empty<address, SoftBid>());
//         };
        
//         let soft_bids = table::borrow_mut(&mut marketplace.soft_bids, nft_id);
        
//         // Create new soft bid
//         let soft_bid = SoftBid {
//             bidder: sender,
//             amount,
//             message,
//             created_at: tx_context::epoch(ctx),
//         };
        
//         // Store the bid, replacing any previous bid from this bidder
//         if (vec_map::contains(soft_bids, &sender)) {
//             let _old_bid = vec_map::remove(soft_bids, &sender);
//             // Old bid is dropped because SoftBid has drop ability
//         };
//         vec_map::insert(soft_bids, sender, soft_bid);
        
//         event::emit(SoftBidPlaced {
//             nft_id,
//             bidder: sender,
//             amount,
//         });
//     }
    
//     // === Real Listing Functions ===
    
//     // List an NFT for sale (can be used directly without soft listing)
//     public entry fun list_nft(
//         marketplace: &mut Marketplace,
//         nft: PhotoNFT,
//         price: u64,
//         description: String,
//         ctx: &mut TxContext
//     ) {
//         assert!(price > 0, EInvalidPrice);
        
//         let nft_id = object::id(&nft);
//         let sender = tx_context::sender(ctx);
        
//         // Create listing
//         let listing = Listing {
//             nft_id,
//             seller: sender,
//             price,
//             description,
//             created_at: tx_context::epoch(ctx),
//         };
        
//         // Add to marketplace
//         if (table::contains(&marketplace.listings, nft_id)) {
//             let _old_listing = table::remove(&mut marketplace.listings, nft_id);
//             // Need to handle old_listing properly since Listing doesn't have drop
//         };
//         table::add(&mut marketplace.listings, nft_id, listing);
        
//         // If there was a soft listing, remove it
//         if (table::contains(&marketplace.soft_listings, nft_id)) {
//             let _old_soft_listing = table::remove(&mut marketplace.soft_listings, nft_id);
//             // Need to handle old_soft_listing properly since SoftListing doesn't have drop
//         };
        
//         // Create and transfer a receipt to the seller
//         let receipt = ListingReceipt {
//             id: object::new(ctx),
//             nft_id,
//             marketplace_id: object::id(marketplace),
//             seller: sender,
//             price,
//             created_at: tx_context::epoch(ctx),
//         };
//         transfer::transfer(receipt, sender);
        
//         // Transfer NFT to marketplace module (escrow)
//         transfer::public_share_object(nft);
        
//         event::emit(NFTListed {
//             nft_id,
//             seller: sender,
//             price,
//             marketplace_id: object::id(marketplace),
//         });
//     }
    
//     // Buy an NFT at the listed price
//     public entry fun buy_nft(
//         marketplace: &mut Marketplace,
//         nft: &mut PhotoNFT,
//         payment: Coin<SUI>,
//         ctx: &mut TxContext
//     ) {
//         let nft_id = object::id(nft);
//         assert!(table::contains(&marketplace.listings, nft_id), ENotListed);
        
//         let listing = table::borrow(&marketplace.listings, nft_id);
//         let price = listing.price;
//         let seller = listing.seller;
        
//         // Verify payment amount
//         assert!(coin::value(&payment) >= price, EInsufficientFunds);
        
//         // Calculate fee
//         let fee_amount = (price * marketplace.fee_bps) / 10000;
//         let seller_amount = price - fee_amount;
        
//         // Split payment and deposit fee
//         let fee_coin = coin::split(&mut payment, fee_amount, ctx);
//         coin::put(&mut marketplace.fee_balance, fee_coin);
        
//         // Send remaining payment to seller
//         transfer::public_transfer(payment, seller);
        
//         // Transfer NFT to buyer
//         transfer::public_transfer(nft, tx_context::sender(ctx));
        
//         // Remove listing
//         let _old_listing = table::remove(&mut marketplace.listings, nft_id);
//         // Need to handle old_listing properly
        
//         // Clear any bids
//         if (table::contains(&marketplace.bids, nft_id)) {
//             let bids = table::remove(&mut marketplace.bids, nft_id);
//             // Process refunds for all bidders
//             process_bid_refunds(bids, ctx);
//         };
        
//         // Clear any soft bids
//         if (table::contains(&marketplace.soft_bids, nft_id)) {
//             table::remove(&mut marketplace.soft_bids, nft_id);
//         };
        
//         // Emit event
//         event::emit(NFTSold {
//             nft_id,
//             seller,
//             buyer: tx_context::sender(ctx),
//             price,
//         });
//     }
    
//     // Cancel a listing and return the NFT to the seller
//     public entry fun cancel_listing(
//         marketplace: &mut Marketplace,
//         receipt: ListingReceipt,
//         nft: PhotoNFT,
//         ctx: &mut TxContext
//     ) {
//         let nft_id = receipt.nft_id;
//         let seller = receipt.seller;
        
//         // Verify sender is the seller
//         assert!(tx_context::sender(ctx) == seller, EUnauthorized);
//         assert!(object::id(&nft) == nft_id, EUnauthorized);
        
//         // Remove listing
//         if (table::contains(&marketplace.listings, nft_id)) {
//             let _old_listing = table::remove(&mut marketplace.listings, nft_id);
//             // Need to handle old_listing properly
//         };
        
//         // Return NFT to seller
//         transfer::public_transfer(nft, seller);
        
//         // Burn receipt
//         let ListingReceipt { id, nft_id: _, marketplace_id: _, seller: _, price: _, created_at: _ } = receipt;
//         object::delete(id);
//     }
    
//     // Helper to process bid refunds
//     fun process_bid_refunds(bids: VecMap<address, Bid>, ctx: &mut TxContext) {
//         let keys = vec_map::keys(&bids);
//         let i = 0;
//         let len = vector::length(&keys);
        
//         while (i < len) {
//             let bidder = *vector::borrow(&keys, i);
            
//             // Get bid via vec_map::remove which gives ownership
//             if (vec_map::contains(&bids, &bidder)) {
//                 let Bid { bidder: _, amount, message: _, created_at: _ } = vec_map::remove(&mut bids, &bidder);
//                 let refund = coin::from_balance(amount, ctx);
//                 transfer::public_transfer(refund, bidder);
//             };
            
//             i = i + 1;
//         };
//     }
    
//     // === Bidding Functions ===
    
//     // Place a bid with funds (can be for soft-listed or formally listed NFTs)
//     public entry fun place_bid(
//         marketplace: &mut Marketplace,
//         nft_id: ID,
//         payment: Coin<SUI>,
//         message: String,
//         ctx: &mut TxContext
//     ) {
//         let amount = coin::value(&payment);
//         assert!(amount > 0, EInvalidBidAmount);
        
//         // Verify NFT has either a soft listing or a formal listing
//         assert!(
//             table::contains(&marketplace.soft_listings, nft_id) || 
//             table::contains(&marketplace.listings, nft_id), 
//             ENotListed
//         );
        
//         let sender = tx_context::sender(ctx);
        
//         // Ensure there's a place to store bids for this NFT
//         if (!table::contains(&marketplace.bids, nft_id)) {
//             table::add(&mut marketplace.bids, nft_id, vec_map::empty<address, Bid>());
//         };
        
//         let bids = table::borrow_mut(&mut marketplace.bids, nft_id);
        
//         // If user already has a bid, return their previous funds first
//         if (vec_map::contains(bids, &sender)) {
//             let old_bid = vec_map::remove(bids, &sender);
//             let Bid { bidder: _, amount: old_amount, message: _, created_at: _ } = old_bid;
//             let old_coin = coin::from_balance(old_amount, ctx);
//             transfer::public_transfer(old_coin, sender);
//         };
        
//         // Create new bid with funds
//         let bid = Bid {
//             bidder: sender,
//             amount: coin::into_balance(payment),
//             message,
//             created_at: tx_context::epoch(ctx),
//         };
        
//         // Store the bid
//         vec_map::insert(bids, sender, bid);
        
//         event::emit(BidPlaced {
//             nft_id,
//             bidder: sender,
//             amount,
//         });
//     }
    
//     // Accept a bid for a soft-listed NFT (requires the owner to provide the NFT)
//     public entry fun accept_bid_for_soft_listing(
//         marketplace: &mut Marketplace,
//         nft: PhotoNFT,
//         bidder: address,
//         ctx: &mut TxContext
//     ) {
//         let nft_id = object::id(&nft);
//         let sender = tx_context::sender(ctx);
        
//         // Verify NFT has a soft listing
//         assert!(table::contains(&marketplace.soft_listings, nft_id), ENotSoftListed);
//         let soft_listing = table::borrow(&marketplace.soft_listings, nft_id);
        
//         // Verify sender is the owner specified in the soft listing
//         assert!(soft_listing.owner == sender, EUnauthorized);
        
//         // Verify bid exists
//         assert!(table::contains(&marketplace.bids, nft_id), EBidNotFound);
//         let bids = table::borrow_mut(&mut marketplace.bids, nft_id);
//         assert!(vec_map::contains(bids, &bidder), EBidNotFound);
        
//         // Extract bid
//         let bid = vec_map::remove(bids, &bidder);
//         let Bid { bidder: bid_sender, amount, message: _, created_at: _ } = bid;
        
//         // Calculate fee
//         let bid_amount = balance::value(&amount);
//         let fee_amount = (bid_amount * marketplace.fee_bps) / 10000;
//         let seller_amount = bid_amount - fee_amount;
        
//         // Extract fee
//         let fee_balance = balance::split(&mut amount, fee_amount);
//         balance::join(&mut marketplace.fee_balance, fee_balance);
        
//         // Convert balance to coin and send to seller
//         let seller_payment = coin::from_balance(amount, ctx);
//         transfer::public_transfer(seller_payment, sender);
        
//         // Transfer NFT to bidder
//         transfer::public_transfer(nft, bidder);
        
//         // Remove soft listing
//         let _old_listing = table::remove(&mut marketplace.soft_listings, nft_id);
        
//         // Clear any remaining bids for this NFT
//         if (table::contains(&marketplace.bids, nft_id)) {
//             let bids_map = table::remove(&mut marketplace.bids, nft_id);
//             process_bid_refunds(bids_map, ctx);
//         };
        
//         // Clear any soft bids
//         if (table::contains(&marketplace.soft_bids, nft_id)) {
//             table::remove(&mut marketplace.soft_bids, nft_id);
//         };
        
//         // Emit event
//         event::emit(BidAccepted {
//             nft_id,
//             seller: sender,
//             bidder: bid_sender,
//             amount: bid_amount,
//         });
//     }
    
//     // Accept a bid for a formally listed NFT
//     public entry fun accept_bid_for_listing(
//         marketplace: &mut Marketplace,
//         receipt: ListingReceipt,
//         nft: PhotoNFT,
//         bidder: address,
//         ctx: &mut TxContext
//     ) {
//         let nft_id = receipt.nft_id;
//         let seller = receipt.seller;
        
//         // Verify sender is the seller
//         assert!(tx_context::sender(ctx) == seller, EUnauthorized);
//         assert!(object::id(&nft) == nft_id, EUnauthorized);
        
//         // Verify NFT is listed
//         assert!(table::contains(&marketplace.listings, nft_id), ENotListed);
        
//         // Verify bid exists
//         assert!(table::contains(&marketplace.bids, nft_id), EBidNotFound);
//         let bids = table::borrow_mut(&mut marketplace.bids, nft_id);
//         assert!(vec_map::contains(bids, &bidder), EBidNotFound);
        
//         // Extract bid
//         let bid = vec_map::remove(bids, &bidder);
//         let Bid { bidder: bid_sender, amount, message: _, created_at: _ } = bid;
        
//         // Calculate fee
//         let bid_amount = balance::value(&amount);
//         let fee_amount = (bid_amount * marketplace.fee_bps) / 10000;
//         let seller_amount = bid_amount - fee_amount;
        
//         // Extract fee
//         let fee_balance = balance::split(&mut amount, fee_amount);
//         balance::join(&mut marketplace.fee_balance, fee_balance);
        
//         // Convert balance to coin and send to seller
//         let seller_payment = coin::from_balance(amount, ctx);
//         transfer::public_transfer(seller_payment, seller);
        
//         // Transfer NFT to bidder
//         transfer::public_transfer(nft, bidder);
        
//         // Remove listing
//         let _old_listing = table::remove(&mut marketplace.listings, nft_id);
        
//         // Clear any remaining bids
//         if (table::contains(&marketplace.bids, nft_id)) {
//             let bids_map = table::remove(&mut marketplace.bids, nft_id);
//             process_bid_refunds(bids_map, ctx);
//         };
        
//         // Clear any soft bids
//         if (table::contains(&marketplace.soft_bids, nft_id)) {
//             table::remove(&mut marketplace.soft_bids, nft_id);
//         };
        
//         // Burn receipt
//         let ListingReceipt { id, nft_id: _, marketplace_id: _, seller: _, price: _, created_at: _ } = receipt;
//         object::delete(id);
        
//         // Emit event
//         event::emit(BidAccepted {
//             nft_id,
//             seller,
//             bidder: bid_sender,
//             amount: bid_amount,
//         });
//     }
    
//     // Cancel a bid and refund funds
//     public entry fun cancel_bid(
//         marketplace: &mut Marketplace,
//         nft_id: ID,
//         ctx: &mut TxContext
//     ) {
//         let sender = tx_context::sender(ctx);
        
//         // Verify bid exists
//         assert!(table::contains(&marketplace.bids, nft_id), EBidNotFound);
//         let bids = table::borrow_mut(&mut marketplace.bids, nft_id);
//         assert!(vec_map::contains(bids, &sender), EBidNotFound);
        
//         // Extract bid
//         let bid = vec_map::remove(bids, &sender);
//         let Bid { bidder, amount, message: _, created_at: _ } = bid;
        
//         // Convert balance to coin and return to bidder
//         let refund = coin::from_balance(amount, ctx);
//         transfer::public_transfer(refund, bidder);
//     }
    
//     // === Admin Functions ===
    
//     // Admin can remove a soft listing
//     public entry fun remove_soft_listing(
//         _: &AdminCap,
//         marketplace: &mut Marketplace,
//         nft_id: ID
//     ) {
//         // Remove soft listing if it exists
//         if (table::contains(&marketplace.soft_listings, nft_id)) {
//             let _old_listing = table::remove(&mut marketplace.soft_listings, nft_id);
//             // Need to handle old_listing properly
//         };
        
//         // Clear any soft bids
//         if (table::contains(&marketplace.soft_bids, nft_id)) {
//             table::remove(&mut marketplace.soft_bids, nft_id);
//         };
//     }
    
//     // Update marketplace fee
//     public entry fun update_fee(
//         _: &AdminCap,
//         marketplace: &mut Marketplace,
//         new_fee_bps: u64
//     ) {
//         assert!(new_fee_bps <= 1000, EInvalidPrice); // Max 10% fee
//         marketplace.fee_bps = new_fee_bps;
//     }
    
//     // Update treasury address
//     public entry fun update_treasury(
//         _: &AdminCap,
//         marketplace: &mut Marketplace,
//         new_treasury: address
//     ) {
//         marketplace.treasury = new_treasury;
//     }
    
//     // Withdraw accumulated fees
//     public entry fun withdraw_fees(
//         _: &AdminCap,
//         marketplace: &mut Marketplace,
//         ctx: &mut TxContext
//     ) {
//         let amount = balance::value(&marketplace.fee_balance);
//         if (amount > 0) {
//             let fee_coin = coin::from_balance(balance::withdraw_all(&mut marketplace.fee_balance), ctx);
//             transfer::public_transfer(fee_coin, marketplace.treasury);
//         }
//     }
    
//     // === View Functions ===
    
//     // Check if NFT is listed
//     public fun is_listed(marketplace: &Marketplace, nft_id: ID): bool {
//         table::contains(&marketplace.listings, nft_id)
//     }
    
//     // Get listing information
//     public fun get_listing(marketplace: &Marketplace, nft_id: ID): (address, u64, u64) {
//         assert!(table::contains(&marketplace.listings, nft_id), EListingNotFound);
//         let listing = table::borrow(&marketplace.listings, nft_id);
//         (listing.seller, listing.price, listing.created_at)
//     }
    
//     // Check if NFT has soft listing
//     public fun has_soft_listing(marketplace: &Marketplace, nft_id: ID): bool {
//         table::contains(&marketplace.soft_listings, nft_id)
//     }
    
//     // Get soft listing information
//     public fun get_soft_listing(marketplace: &Marketplace, nft_id: ID): (address, u64, u64, address) {
//         assert!(table::contains(&marketplace.soft_listings, nft_id), EListingNotFound);
//         let listing = table::borrow(&marketplace.soft_listings, nft_id);
//         (listing.owner, listing.suggested_price, listing.created_at, listing.created_by)
//     }
    
//     // Get marketplace fee
//     public fun get_fee_bps(marketplace: &Marketplace): u64 {
//         marketplace.fee_bps
//     }

//     // For testing - get total fee balance
//     #[test_only]
//     public fun get_fee_balance(marketplace: &Marketplace): u64 {
//         balance::value(&marketplace.fee_balance)
//     }
// } 