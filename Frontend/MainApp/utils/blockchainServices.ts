// CONSTANTS
import { Transaction } from "@mysten/sui/transactions";

import { EventId, SuiClient, SuiEvent } from "@mysten/sui/client";
import { MODULE_NAME, PACKAGE_ID } from "@/lib/suiConfig";

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
    "0x11fe6fadbdcf82659757c793e7337f8af5198a9f35cbad68a2337d01395eb657::sigillum_nft::PhotoNFT";

  // Building the move call with type arguments
  tx.moveCall({
    target: `${packageId}::${moduleName}::accept_bid`,
    typeArguments: [nftTypeArg], // Add this line with the NFT type
    arguments: [tx.object(marketplaceObjectId), tx.pure.address(listingId)],
  });

  return tx;
};
export const buildWithdrawStakeTx = (
  marketplaceObjectId: string,
  listingId: string,
  packageId: string,
  moduleName: string
): Transaction => {
  const tx = new Transaction();

  // Set reasonable gas budget
  const estimatedGasFee = BigInt(30000000); // 0.03 SUI
  tx.setGasBudget(Number(estimatedGasFee));

  // Building the move call with type arguments
  tx.moveCall({
    target: `${packageId}::${moduleName}::withdraw_stake`,
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
    // console.log("Result:", result);

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

  try {
    const result = await provider.devInspectTransactionBlock({
      sender: address,
      transactionBlock: tx,
    });

    // console.log("Raw Result:", JSON.stringify(result, null, 2));

    // Check if we have valid results
    if (
      !result?.results?.[0]?.returnValues ||
      !Array.isArray(result.results[0].returnValues)
    ) {
      throw new Error("Unexpected result format");
    }

    // The structure appears to have each return value as [valueArray, typeString]
    // Iterate through return values to find the bid count (likely a u64 value)
    // We're looking for a small u64 value that represents a count
    const returnValues = result.results[0].returnValues;

    // Log all return values for debugging
    console.log("Return values:");
    returnValues.forEach((val, idx) => {
      console.log(`Value ${idx}:`, val);
    });

    // Based on the provided data structure, bid count is likely to be in one of these positions
    // Try the most likely candidates first:

    // Assuming the bid count is the third return value (index 2) of type "u64"
    if (returnValues[2] && returnValues[2][1] === "u64") {
      const bidCountArray = returnValues[2][0];
      // Convert the u64 byte array to a number
      return parseU64FromByteArray(bidCountArray);
    }

    // Fallback: Search through all u64 values
    for (let i = 0; i < returnValues.length; i++) {
      const [value, type] = returnValues[i];
      if (type === "u64") {
        // Look for small values that could represent counts
        const num = parseU64FromByteArray(value);
        if (num >= 0 && num < 1000) {
          // Assuming bid count is reasonably small
          console.log(`Found potential bid count at index ${i}: ${num}`);
          return num;
        }
      }
    }

    throw new Error("Could not identify bid count in response");
  } catch (error: unknown) {
    console.error("Error getting bid count:", error);
    throw new Error(
      `Failed to get bid count: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`
    );
  }
}
// Function to get stakers count
export async function getStakersCount(
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
    target: `${packageId}::${moduleName}::get_stakers_count`,
    arguments: [tx.object(marketplaceObjectId), tx.pure.address(listingId)],
  });

  try {
    const result = await provider.devInspectTransactionBlock({
      sender: address,
      transactionBlock: tx,
    });

    // console.log("Raw Result:", JSON.stringify(result, null, 2));

    // Check if we have valid results
    if (
      !result?.results?.[0]?.returnValues ||
      !Array.isArray(result.results[0].returnValues)
    ) {
      throw new Error("Unexpected result format");
    }

    // The structure appears to have each return value as [valueArray, typeString]
    // Iterate through return values to find the bid count (likely a u64 value)
    // We're looking for a small u64 value that represents a count
    const returnValues = result.results[0].returnValues;

    // Log all return values for debugging
    console.log("Return values:");
    returnValues.forEach((val, idx) => {
      console.log(`Value ${idx}:`, val);
    });

    // Based on the provided data structure, bid count is likely to be in one of these positions
    // Try the most likely candidates first:

    // Assuming the bid count is the third return value (index 2) of type "u64"
    if (returnValues[2] && returnValues[2][1] === "u64") {
      const bidCountArray = returnValues[2][0];
      // Convert the u64 byte array to a number
      return parseU64FromByteArray(bidCountArray);
    }

    // Fallback: Search through all u64 values
    for (let i = 0; i < returnValues.length; i++) {
      const [value, type] = returnValues[i];
      if (type === "u64") {
        // Look for small values that could represent counts
        const num = parseU64FromByteArray(value);
        if (num >= 0 && num < 1000) {
          // Assuming bid count is reasonably small
          console.log(`Found potential bid count at index ${i}: ${num}`);
          return num;
        }
      }
    }

    throw new Error("Could not identify bid count in response");
  } catch (error: unknown) {
    console.error("Error getting bid count:", error);
    throw new Error(
      `Failed to get bid count: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`
    );
  }
}

// Helper function to parse a u64 from a byte array
function parseU64FromByteArray(byteArray: number[]): number {
  if (!Array.isArray(byteArray) || byteArray.length !== 8) {
    throw new Error(`Invalid u64 byte array: ${JSON.stringify(byteArray)}`);
  }

  // Little-endian conversion of byte array to number
  let value = BigInt(0);
  for (let i = 7; i >= 0; i--) {
    value = (value << BigInt(8)) | BigInt(byteArray[i]);
  }

  // Convert to Number if within safe integer range
  if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }

  // Otherwise return as string to prevent precision loss
  return Number(value);
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
export async function buildPlaceStakeTxWithCoinSelection(
  provider: SuiClient,
  address: string,
  marketplaceObjectId: string,
  listingId: string,
  stakeAmountMist: bigint,
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

    if (totalBalance < stakeAmountMist) {
      const stakeAmountSui = Number(stakeAmountMist) / 1_000_000_000;
      return {
        transaction: tx,
        success: false,
        error: `Insufficient balance. You need at least ${stakeAmountSui} SUI`,
      };
    }

    // CRITICAL FIX: Use separate coins for stake and gas when possible
    if (sortedCoins.length > 1) {
      // Use the second largest coin for the stake if it's sufficient
      if (BigInt(sortedCoins[1].balance) >= stakeAmountMist) {
        const stakeCoinId = sortedCoins[1].coinObjectId;
        // The largest coin will be used for gas automatically

        // Split the exact amount needed for the stake
        const stakeCoin = tx.splitCoins(tx.object(stakeCoinId), [
          tx.pure.u64(stakeAmountMist.toString()),
        ]);

        // Build the stake transaction
        tx.moveCall({
          target: `${packageId}::${moduleName}::stake_on_listing`,
          arguments: [
            tx.object(marketplaceObjectId),
            tx.pure.address(listingId),
            stakeCoin[0],
          ],
        });

        return { transaction: tx, success: true };
      }
    }

    // If we can't use separate coins or only have one coin
    // Use the largest coin but ensure we're not using the entire balance
    const largestCoin = sortedCoins[0];

    // Check if the largest coin can cover both stake and gas
    if (BigInt(largestCoin.balance) < stakeAmountMist + estimatedGasFee) {
      // Calculate how much the user can actually stake
      const maxPossibleStake = BigInt(largestCoin.balance) - estimatedGasFee;
      const stakeAmountSui = Number(stakeAmountMist) / 1_000_000_000;
      const gasSui = Number(estimatedGasFee) / 1_000_000_000;

      return {
        transaction: tx,
        success: false,
        error: `Insufficient funds for this stake plus gas fees. Your largest coin has ${
          Number(largestCoin.balance) / 1_000_000_000
        } SUI, but you need ${
          stakeAmountSui + gasSui
        } SUI (${stakeAmountSui} SUI for stake + ${gasSui} SUI for gas). Try merging your coins first.`,
      };
    }

    // Split the exact amount needed for the stake
    const stakeCoin = tx.splitCoins(tx.object(largestCoin.coinObjectId), [
      tx.pure.u64(stakeAmountMist.toString()),
    ]);

    // Build the stake transaction
    tx.moveCall({
      target: `${packageId}::${moduleName}::stake_on_listing`,
      arguments: [
        tx.object(marketplaceObjectId),
        tx.pure.address(listingId),
        stakeCoin[0],
      ],
    });

    return { transaction: tx, success: true };
  } catch (error) {
    console.error("Error building stake transaction:", error);
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
    const estimatedGasFee = BigInt(50000000); // 0.05 SUI
    tx.setGasBudget(Number(estimatedGasFee));

    const nftTypeArg =
      "0x11fe6fadbdcf82659757c793e7337f8af5198a9f35cbad68a2337d01395eb657::sigillum_nft::PhotoNFT";
    tx.moveCall({
      target: `${packageId}::${moduleName}::convert_to_real_listing`,
      typeArguments: [nftTypeArg],
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

export const buildRelistNftTx = async (
  marketplaceObjectId: string,
  listingId: string,
  nftId: string,
  newPrice: number,
  newMinBid: number,
  newEndTime: number,
  packageId: string,
  moduleName: string
): Promise<Transaction> => {
  try {
    const tx = new Transaction();
    const estimatedGasFee = BigInt(50000000); // 0.05 SUI
    tx.setGasBudget(Number(estimatedGasFee));

    // Use the same NFT type as in your existing code
    // This should match the type of your NFT - update if necessary
    const nftTypeArg =
      "0x11fe6fadbdcf82659757c793e7337f8af5198a9f35cbad68a2337d01395eb657::sigillum_nft::PhotoNFT";

    tx.moveCall({
      target: `${packageId}::${moduleName}::relist_on_same_listing`,
      typeArguments: [nftTypeArg],
      arguments: [
        tx.object(marketplaceObjectId),
        tx.pure.address(listingId),
        tx.object(nftId),
        tx.pure.u64(newPrice.toString()),
        tx.pure.u64(newMinBid.toString()),
        tx.pure.u64(newEndTime.toString()),
      ],
    });

    return tx;
  } catch (error) {
    console.error("Error building relist transaction:", error);
    throw new Error("Failed to build relist_on_same_listing transaction");
  }
};

export async function getUserStake(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  listingId: string,
  stakerAddress: string,
  callerAddress: string | null = null
) {
  if (!callerAddress) return { hasStaked: false, stakeAmount: 0 };
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::${moduleName}::get_user_stake`,
    arguments: [
      tx.object(marketplaceObjectId),
      tx.pure.address(listingId),
      tx.pure.address(stakerAddress),
    ],
  });

  try {
    const result = await provider.devInspectTransactionBlock({
      sender: callerAddress,
      transactionBlock: tx,
    });

    // For debugging (can be removed in production)
    // console.log("Raw Result:", JSON.stringify(result, null, 2));

    const returnValues = result?.results?.[0]?.returnValues;
    if (!returnValues || !Array.isArray(returnValues)) {
      return { hasStaked: false, stakeAmount: 0 };
    }

    // Let's find the boolean (hasStaked) and the u64 (stakeAmount) in the results
    let hasStaked = false;
    let stakeAmount = 0;

    // Find the boolean value first
    const boolValues = returnValues.filter(
      ([value, type]) => type === "bool" && Array.isArray(value)
    );

    if (boolValues.length > 0) {
      hasStaked = boolValues[0][0][0] === 1;
    }

    // Find the stake amount - we need to be smart about this
    // There might be multiple u64 values, but we want the one that represents the stake
    const u64Values = returnValues.filter(
      ([value, type]) =>
        type === "u64" && Array.isArray(value) && value.length === 8
    );

    if (u64Values.length > 0) {
      // If hasStaked is false, the stake amount should be 0
      // If hasStaked is true, the stake amount should be > 0
      for (const [valueArray] of u64Values) {
        const amount = parseU64FromByteArray(valueArray);

        // If we find a value that matches our expectation based on hasStaked, use it
        if ((!hasStaked && amount === 0) || (hasStaked && amount > 0)) {
          stakeAmount = amount;
          break;
        }

        // Otherwise, just take the first u64 as a fallback
        if (stakeAmount === 0) {
          stakeAmount = amount;
        }
      }
    }

    return { hasStaked, stakeAmount };
  } catch (error) {
    console.error("Error getting user stake:", error);
    return { hasStaked: false, stakeAmount: 0 };
  }
}
