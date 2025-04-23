#[test_only]
module sigillum_contracts::mock_nft {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    
    // Mock NFT for testing
    public struct MockNFT has key, store {
        id: UID
    }
    
    // Create a mock NFT for testing
    public fun create(ctx: &mut TxContext): MockNFT {
        MockNFT { id: object::new(ctx) }
    }
} 