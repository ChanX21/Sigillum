// CONSTANTS
import { Transaction } from "@mysten/sui/transactions";

import { SuiClient } from "@mysten/sui/client";
import { client } from "@/lib/suiClient";

export const buildAcceptBidTx = (
  marketplaceObjectId: string,
  listingId: string,
  packageId: string,
  moduleName: string
): Transaction => {
  const tx = new Transaction();

  // Set reasonable gas budget
  const estimatedGasFee = BigInt(30000000); // 0.03 SUI
  tx.setGasBudget(Number(estimatedGasFee));

  // NFT type parameter that was missing
  const nftTypeArg =
    "0x9fdabd883953851312fab19cc1ae72e22bc75ea30fa0142d58f7f0e9539ba7fc::sigillum_nft::PhotoNFT";

  // Building the move call with type arguments
  tx.moveCall({
    target: `${packageId}::${moduleName}::accept_bid`,
    typeArguments: [nftTypeArg], // Add this line with the NFT type
    arguments: [tx.object(marketplaceObjectId), tx.pure.address(listingId)],
  });

  return tx;
};

function bytesToHex(bytes: number[]): string {
  return "0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Function to get listing details
export async function getObjectDetails(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  listingId: string,
  address: string | null = null
) {
  if (!address) return null;
  // If no address is provided, use a default address for read-only operations
  const senderAddress = address;

  try {
    const tx = new Transaction();

    // Call the function
    tx.moveCall({
      target: `${packageId}::${moduleName}::get_listing_details`,
      arguments: [tx.object(marketplaceObjectId), tx.pure.address(listingId)],
    });

    const result = await provider.devInspectTransactionBlock({
      sender: senderAddress,
      transactionBlock: tx,
    });
    console.log("Result:", result);

    //Check for dynamic_field error
    if (
      result.error &&
      (result.error.includes("dynamic_field") ||
        result.error.includes("MoveAbort"))
    ) {
      console.log("Listing not found or not accessible.", result.error);
      return null;
    }
    if (
      result &&
      result.results &&
      result.results[0] &&
      result.results[0].returnValues &&
      result.results[0].returnValues.length > 10
    ) {
      const returnValues = result.results[0].returnValues;

      const val = {
        owner: bytesToHex([...new Uint8Array(returnValues[0][0])]),
        nftId: bytesToHex([...new Uint8Array(returnValues[1][0])]),
        listPrice: BigInt(
          new DataView(Uint8Array.from(returnValues[2][0]).buffer).getBigUint64(
            0,
            true
          )
        ),
        listingType: returnValues[3][0][0],
        minBid: BigInt(
          new DataView(Uint8Array.from(returnValues[4][0]).buffer).getBigUint64(
            0,
            true
          )
        ),
        highestBid: BigInt(
          new DataView(Uint8Array.from(returnValues[5][0]).buffer).getBigUint64(
            0,
            true
          )
        ),
        highestBidder: bytesToHex([...new Uint8Array(returnValues[6][0])]),
        active: Boolean(returnValues[7][0][0]),
        verificationScore: BigInt(
          new DataView(Uint8Array.from(returnValues[8][0]).buffer).getBigUint64(
            0,
            true
          )
        ),
        startTime: BigInt(
          new DataView(Uint8Array.from(returnValues[9][0]).buffer).getBigUint64(
            0,
            true
          )
        ),
        endTime: BigInt(
          new DataView(
            Uint8Array.from(returnValues[10][0]).buffer
          ).getBigUint64(0, true)
        ),
      };

      return val;
    } else {
      console.error("Invalid result structure:", result);
      return null;
    }
  } catch (error) {
    console.error("Error in getListingDetails:", error);
    return null;
  }
}

// Function to get bid count
export async function getBidCount(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  listingId: string,
  address: string | null = null
) {
  if (!address) return null;
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::${moduleName}::get_bid_count`,
    arguments: [tx.object(marketplaceObjectId), tx.pure.address(listingId)],
  });

  const result = await provider.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx,
  });

  if (
    result &&
    result.results &&
    result.results[0] &&
    result.results[0].returnValues
  ) {
    return Number(result.results[0].returnValues[0][0]);
  }

  throw new Error("Failed to get bid count");
}

// Function to get fee percentage
export async function getFeePercentage(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  address: string | null = null
) {
  if (!address) return null;
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::${moduleName}::get_fee_percentage`,
    arguments: [tx.object(marketplaceObjectId)],
  });

  const result = await provider.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx,
  });

  if (
    result &&
    result.results &&
    result.results[0] &&
    result.results[0].returnValues
  ) {
    return Number(result.results[0].returnValues[0][0]);
  }

  throw new Error("Failed to get fee percentage");
}

// Function to get total volume
export async function getTotalVolume(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  address: string | null = null
) {
  if (!address) return null;
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::${moduleName}::get_total_volume`,
    arguments: [tx.object(marketplaceObjectId)],
  });

  const result = await provider.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx,
  });

  if (
    result &&
    result.results &&
    result.results[0] &&
    result.results[0].returnValues
  ) {
    return Number(result.results[0].returnValues[0][0]);
  }

  throw new Error("Failed to get total volume");
}

// Function to get total listings
export async function getTotalListings(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  address: string | null = null
) {
  if (!address) return null;
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::${moduleName}::get_total_listings`,
    arguments: [tx.object(marketplaceObjectId)],
  });

  const result = await provider.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx,
  });

  if (
    result &&
    result.results &&
    result.results[0] &&
    result.results[0].returnValues
  ) {
    return Number(result.results[0].returnValues[0][0]);
  }

  throw new Error("Failed to get total listings");
}

// Function to get listing IDs with pagination and filtering
export async function getListingIds(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  startIdx: number = 0,
  limit: number = 10,
  onlyActive: boolean = true,
  listingType: number = 0,
  address: string | null = null
): Promise<{ listingIds: string[]; hasMore: boolean }> {
  if (!address) return { listingIds: [], hasMore: false };

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::${moduleName}::get_listing_ids`,
    arguments: [
      tx.object(marketplaceObjectId),
      tx.pure.u64(startIdx),
      tx.pure.u64(limit),
      tx.pure.bool(onlyActive),
      tx.pure.u8(listingType),
    ],
  });

  const result = await provider.devInspectTransactionBlock({
    sender: address,
    transactionBlock: tx,
  });

  if (
    result &&
    result.results &&
    result.results[0] &&
    result.results[0].returnValues
  ) {
    const returnValues = result.results[0].returnValues;

    // Parse the vector of addresses (first return value)
    const listingIds = Array.isArray(returnValues[0][0])
      ? returnValues[0][0].map((id: any) => String(id))
      : [];

    // Parse the boolean hasMore flag (second return value)
    const hasMore = Boolean(returnValues[1][0]);

    return {
      listingIds,
      hasMore,
    };
  }

  throw new Error("Failed to get listing IDs");
}

export const buildPlaceBidTx = (
  marketplaceObjectId: string, // ID of the marketplace object
  listingId: string, // listing_id
  coinObjectId: string, // ID of the Coin<SUI> object to use for payment
  packageId: string,
  moduleName: string,
  bidAmountMist: bigint, // The amount to bid
  address: string // User's address
): Transaction => {
  const tx = new Transaction();

  // Set reasonable gas budget
  const estimatedGasFee = BigInt(30000000); // 0.03 SUI
  tx.setGasBudget(Number(estimatedGasFee));

  // Split the coin
  const bidCoin = tx.splitCoins(tx.object(coinObjectId), [
    tx.pure.u64(bidAmountMist.toString()),
  ]);

  // Mapping the arguments
  const marketplaceArg = tx.object(marketplaceObjectId); // Shared marketplace object
  const listingIdArg = tx.pure.address(listingId); // listing_id as address
  const paymentArg = bidCoin[0]; // Coin<SUI> object ID

  // Building the move call
  tx.moveCall({
    target: `${packageId}::${moduleName}::place_bid`,
    arguments: [marketplaceArg, listingIdArg, paymentArg],
  });

  // Return remaining coin to the user
  // tx.transferObjects([remainingCoin], tx.pure.address(address));

  return tx;
};

export async function buildPlaceBidTxWithCoinSelection(
  provider: SuiClient,
  address: string,
  marketplaceObjectId: string,
  listingId: string,
  bidAmountMist: bigint,
  packageId: string,
  moduleName: string
): Promise<{ transaction: Transaction; success: boolean; error?: string }> {
  try {
    // Get user's coins
    const { data: coinData } = await provider.getCoins({
      owner: address,
      coinType: "0x2::sui::SUI",
    });

    if (!coinData || coinData.length === 0) {
      return {
        transaction: new Transaction(),
        success: false,
        error: "No coins available",
      };
    }

    // Sort coins by balance (largest first)
    const sortedCoins = [...coinData].sort((a, b) =>
      Number(BigInt(b.balance) - BigInt(a.balance))
    );

    const tx = new Transaction();
    // Set reasonable gas budget
    const estimatedGasFee = BigInt(30000000); // 0.03 SUI
    tx.setGasBudget(Number(estimatedGasFee));

    // Calculate total balance
    const totalBalance = coinData.reduce(
      (sum: bigint, coin) => sum + BigInt(coin.balance),
      BigInt(0)
    );

    if (totalBalance < bidAmountMist) {
      const bidAmountSui = Number(bidAmountMist) / 1_000_000_000;
      return {
        transaction: tx,
        success: false,
        error: `Insufficient balance. You need at least ${bidAmountSui} SUI`,
      };
    }

    // CRITICAL FIX: Use separate coins for bid and gas when possible
    if (sortedCoins.length > 1) {
      // Use the second largest coin for the bid if it's sufficient
      if (BigInt(sortedCoins[1].balance) >= bidAmountMist) {
        const bidCoinId = sortedCoins[1].coinObjectId;
        // The largest coin will be used for gas automatically

        // Split the exact amount needed for the bid
        const bidCoin = tx.splitCoins(tx.object(bidCoinId), [
          tx.pure.u64(bidAmountMist.toString()),
        ]);

        // Build the place bid transaction
        tx.moveCall({
          target: `${packageId}::${moduleName}::place_bid`,
          arguments: [
            tx.object(marketplaceObjectId),
            tx.pure.address(listingId),
            bidCoin[0],
          ],
        });

        return { transaction: tx, success: true };
      }
    }

    // If we can't use separate coins or only have one coin
    // Use the largest coin but ensure we're not using the entire balance
    const largestCoin = sortedCoins[0];

    // Check if the largest coin can cover both bid and gas
    if (BigInt(largestCoin.balance) < bidAmountMist + estimatedGasFee) {
      // Calculate how much the user can actually bid
      const maxPossibleBid = BigInt(largestCoin.balance) - estimatedGasFee;
      const bidAmountSui = Number(bidAmountMist) / 1_000_000_000;
      const gasSui = Number(estimatedGasFee) / 1_000_000_000;

      return {
        transaction: tx,
        success: false,
        error: `Insufficient funds for this bid plus gas fees. Your largest coin has ${
          Number(largestCoin.balance) / 1_000_000_000
        } SUI, but you need ${
          bidAmountSui + gasSui
        } SUI (${bidAmountSui} SUI for bid + ${gasSui} SUI for gas). Try merging your coins first.`,
      };
    }

    // Split the exact amount needed for the bid
    const bidCoin = tx.splitCoins(tx.object(largestCoin.coinObjectId), [
      tx.pure.u64(bidAmountMist.toString()),
    ]);

    // Build the place bid transaction
    tx.moveCall({
      target: `${packageId}::${moduleName}::place_bid`,
      arguments: [
        tx.object(marketplaceObjectId),
        tx.pure.address(listingId),
        bidCoin[0],
      ],
    });

    return { transaction: tx, success: true };
  } catch (error) {
    console.error("Error building bid transaction:", error);
    return {
      transaction: new Transaction(),
      success: false,
      error: "Failed to build transaction",
    };
  }
}

export async function listNft(
  softListingId: string,
  listPrice: number,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  nftId: string
): Promise<{ transaction: Transaction; success: boolean; error?: string }> {
  try {
    const tx = new Transaction();
    tx.setGasBudget(50000000); // 50M gas

    tx.moveCall({
      target: `${packageId}::${moduleName}::convert_to_real_listing`,
      typeArguments: [
        "0x9fdabd883953851312fab19cc1ae72e22bc75ea30fa0142d58f7f0e9539ba7fc::sigillum_nft::PhotoNFT",
      ],
      arguments: [
        tx.object(marketplaceObjectId),
        tx.pure.address(softListingId),
        tx.pure.u64(listPrice.toString()),
        tx.object(nftId),
      ],
    });

    return { transaction: tx, success: true };
  } catch (error) {
    console.error("Error building convert listing tx:", error);
    return {
      transaction: new Transaction(),
      success: false,
      error: "Failed to build convert_to_real_listing transaction",
    };
  }
}
