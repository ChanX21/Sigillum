// CONSTANTS
import { Transaction } from "@mysten/sui/transactions";

import { SuiClient } from "@mysten/sui/client";
import { MODULE_NAME, PACKAGE_ID } from "@/lib/suiConfig";
const nftTypeArg = `${PACKAGE_ID}::sigillum_nft::PhotoNFT`;
export const buildAcceptBidTx = (
  marketplaceObjectId: string,
  listingId: string,
  packageId: string,
  moduleName: string,
): Transaction => {
  const tx = new Transaction();

  // Set reasonable gas budget
  const estimatedGasFee = BigInt(30000000); // 0.03 SUI
  tx.setGasBudget(Number(estimatedGasFee));

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
  moduleName: string,
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
  address: string | null = null,
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
            true,
          ),
        ),
        listingType: returnValues[3][0][0],
        minBid: BigInt(
          new DataView(Uint8Array.from(returnValues[4][0]).buffer).getBigUint64(
            0,
            true,
          ),
        ),
        highestBid: BigInt(
          new DataView(Uint8Array.from(returnValues[5][0]).buffer).getBigUint64(
            0,
            true,
          ),
        ),
        highestBidder: bytesToHex([...new Uint8Array(returnValues[6][0])]),
        active: Boolean(returnValues[7][0][0]),
        verificationScore: BigInt(
          new DataView(Uint8Array.from(returnValues[8][0]).buffer).getBigUint64(
            0,
            true,
          ),
        ),
        startTime: BigInt(
          new DataView(Uint8Array.from(returnValues[9][0]).buffer).getBigUint64(
            0,
            true,
          ),
        ),
        endTime: BigInt(
          new DataView(
            Uint8Array.from(returnValues[10][0]).buffer,
          ).getBigUint64(0, true),
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

// Helper function to parse a u64 from a byte array
function parseU64FromByteArray(byteArray: number[]): number {
  if (!Array.isArray(byteArray) || byteArray.length !== 8) {
    throw new Error(`Invalid u64 byte array: ${JSON.stringify(byteArray)}`);
  }

  // Little-endian conversion of byte array to number (least significant byte first)
  let value = BigInt(0);
  for (let i = 7; i >= 0; i--) {
    value = (value << BigInt(8)) | BigInt(byteArray[i]);
  }

  // Convert to Number if within safe integer range
  if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }

  // Otherwise return as number
  return Number(value);
}

// Generic function to call Move functions that return a u64
async function callMoveWithU64Return(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  functionName: string,
  marketplaceObjectId: string,
  listingId: string,
  address: string | null = null,
  errorPrefix: string = "Failed to get value",
): Promise<number | null> {
  if (!address) return null;
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::${moduleName}::${functionName}`,
    arguments: [tx.object(marketplaceObjectId), tx.pure.address(listingId)],
  });

  try {
    const result = await provider.devInspectTransactionBlock({
      sender: address,
      transactionBlock: tx,
    });

    // Check if we have valid results
    if (
      !result?.results?.[0]?.returnValues ||
      !Array.isArray(result.results[0].returnValues)
    ) {
      throw new Error("Unexpected result format");
    }

    // The byte array is the first and only return value
    const returnValues = result.results[0].returnValues;

    if (returnValues[0] && returnValues[0][1] === "u64") {
      return parseU64FromByteArray(returnValues[0][0]);
    }

    // Fallback: search for any u64 value
    for (const [value, type] of returnValues) {
      if (type === "u64") {
        return parseU64FromByteArray(value);
      }
    }

    throw new Error(`Could not find u64 value in response for ${functionName}`);
  } catch (error: unknown) {
    console.error(`Error calling ${functionName}:`, error);
    throw new Error(
      `${errorPrefix}: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    );
  }
}

// Specific implementation for stakers count
export async function getStakersCount(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  listingId: string,
  address: string | null = null,
) {
  return callMoveWithU64Return(
    provider,
    packageId,
    moduleName,
    "get_stakers_count",
    marketplaceObjectId,
    listingId,
    address,
    "Failed to get stakers count",
  );
}

// Specific implementation for bid count
export async function getBidCount(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  listingId: string,
  address: string | null = null,
) {
  return callMoveWithU64Return(
    provider,
    packageId,
    moduleName,
    "get_bid_count",
    marketplaceObjectId,
    listingId,
    address,
    "Failed to get bid count",
  );
}
// Function to get fee percentage
export async function getFeePercentage(
  provider: SuiClient,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  address: string | null = null,
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
  address: string | null = null,
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
  address: string | null = null,
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
  address: string | null = null,
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
  address: string, // User's address
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

  return tx;
};

export async function buildPrepareCoinsTx(
  provider: SuiClient,
  address: string,
  estimatedGasFee: bigint = BigInt(30_000_000),
): Promise<{ transaction: Transaction; success: boolean; reason?: string }> {
  const { data: coinData } = await provider.getCoins({
    owner: address,
    coinType: "0x2::sui::SUI",
  });

  if (!coinData || coinData.length === 0) {
    return {
      transaction: new Transaction(),
      success: false,
      reason: "No coins found",
    };
  }

  const sorted = [...coinData].sort((a, b) =>
    Number(BigInt(b.balance) - BigInt(a.balance)),
  );

  const mainCoin = sorted[0];
  if (BigInt(mainCoin.balance) < estimatedGasFee * BigInt(2)) {
    return {
      transaction: new Transaction(),
      success: false,
      reason: "Not enough balance to split a second coin for gas.",
    };
  }

  const tx = new Transaction();
  const coinObj = tx.object(mainCoin.coinObjectId);
  const splitCoin = tx.splitCoins(coinObj, [
    tx.pure.u64(estimatedGasFee.toString()),
  ]);
  tx.transferObjects([splitCoin[0]], tx.pure.address(address)); // Transfer to self (creates new coin object)

  return { transaction: tx, success: true };
}

export async function buildPlaceBidTxWithCoinSelection(
  provider: SuiClient,
  address: string,
  marketplaceObjectId: string,
  listingId: string,
  bidAmountMist: bigint,
  packageId: string,
  moduleName: string,
): Promise<{
  transaction: Transaction;
  success: boolean;
  needsPreparation?: boolean;
  error?: string;
}> {
  try {
    const { data: coinData } = await provider.getCoins({
      owner: address,
      coinType: "0x2::sui::SUI",
    });

    const sortedCoins = [...coinData].sort((a, b) =>
      Number(BigInt(b.balance) - BigInt(a.balance)),
    );

    const estimatedGasFee = BigInt(30_000_000); // 0.03 SUI

    const totalBalance = sortedCoins.reduce(
      (sum, coin) => sum + BigInt(coin.balance),
      BigInt(0),
    );

    if (totalBalance < bidAmountMist + estimatedGasFee) {
      return {
        transaction: new Transaction(),
        success: false,
        error: `Insufficient balance. Need ${
          Number(bidAmountMist + estimatedGasFee) / 1_000_000_000
        } SUI, but have ${Number(totalBalance) / 1_000_000_000} SUI.`,
      };
    }

    const tx = new Transaction();

    const splitBidCoins = tx.splitCoins(tx.gas, [
      tx.pure.u64(bidAmountMist.toString()),
    ]);

    tx.moveCall({
      target: `${packageId}::${moduleName}::place_bid`,
      arguments: [
        tx.object(marketplaceObjectId),
        tx.pure.address(listingId),
        splitBidCoins[0],
      ],
    });

    return { transaction: tx, success: true };
  } catch (error) {
    return {
      transaction: new Transaction(),
      success: false,
      error: `Failed to build transaction: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function prepareAndBuildBidTransaction(
  provider: SuiClient,
  address: string,
  marketplaceObjectId: string,
  listingId: string,
  bidAmountMist: bigint,
  packageId: string,
  moduleName: string,
): Promise<{
  transaction: Transaction;
  success: boolean;
  preparationNeeded?: boolean;
  message?: string;
  error?: string;
}> {
  const result = await buildPlaceBidTxWithCoinSelection(
    provider,
    address,
    marketplaceObjectId,
    listingId,
    bidAmountMist,
    packageId,
    moduleName,
  );

  if (result.success) return result;

  if (result.needsPreparation) {
    const prep = await buildPrepareCoinsTx(provider, address);
    if (prep.success) {
      return {
        transaction: prep.transaction,
        success: false,
        preparationNeeded: true,
        message:
          "Execute this preparation transaction first, then retry placing the bid.",
      };
    } else {
      return {
        transaction: new Transaction(),
        success: false,
        message: prep.reason || "Unknown preparation failure",
      };
    }
  }

  return result;
}

export async function buildPlaceStakeTxWithCoinSelection(
  provider: SuiClient,
  address: string,
  marketplaceObjectId: string,
  listingId: string,
  stakeAmountMist: bigint,
  packageId: string,
  moduleName: string,
): Promise<{
  transaction: Transaction;
  success: boolean;
  needsPreparation?: boolean;
  error?: string;
}> {
  try {
    console.log("Starting to build stake transaction with params:", {
      address,
      marketplaceObjectId,
      listingId,
      stakeAmountMist: stakeAmountMist.toString(),
      packageId,
      moduleName,
    });

    const { data: coinData } = await provider.getCoins({
      owner: address,
      coinType: "0x2::sui::SUI",
    });

    const sortedCoins = [...coinData].sort((a, b) =>
      Number(BigInt(b.balance) - BigInt(a.balance)),
    );

    const estimatedGasFee = BigInt(30_000_000); // 0.03 SUI
    const totalBalance = sortedCoins.reduce(
      (sum, coin) => sum + BigInt(coin.balance),
      BigInt(0),
    );

    if (totalBalance < stakeAmountMist + estimatedGasFee) {
      return {
        transaction: new Transaction(),
        success: false,
        error: `Insufficient balance. You need ${
          Number(stakeAmountMist + estimatedGasFee) / 1_000_000_000
        } SUI, but you have ${Number(totalBalance) / 1_000_000_000} SUI.`,
      };
    }

    const tx = new Transaction();

    const splitStakeCoins = tx.splitCoins(tx.gas, [
      tx.pure.u64(stakeAmountMist.toString()),
    ]);

    tx.moveCall({
      target: `${packageId}::${moduleName}::stake_on_listing`,
      arguments: [
        tx.object(marketplaceObjectId),
        tx.pure.address(listingId),
        splitStakeCoins[0],
      ],
    });

    return { transaction: tx, success: true };
  } catch (error) {
    console.error("Error building stake transaction:", error);
    return {
      transaction: new Transaction(),
      success: false,
      error: `Failed to build transaction: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export async function prepareAndBuildStakeTransaction(
  provider: SuiClient,
  address: string,
  marketplaceObjectId: string,
  listingId: string,
  stakeAmountMist: bigint,
  packageId: string,
  moduleName: string,
): Promise<{
  transaction: Transaction;
  success: boolean;
  preparationNeeded?: boolean;
  message?: string;
  error?: string;
}> {
  const result = await buildPlaceStakeTxWithCoinSelection(
    provider,
    address,
    marketplaceObjectId,
    listingId,
    stakeAmountMist,
    packageId,
    moduleName,
  );

  if (result.success) return result;

  if (result.needsPreparation) {
    const prep = await buildPrepareCoinsTx(provider, address);
    if (prep.success) {
      return {
        transaction: prep.transaction,
        success: false,
        preparationNeeded: true,
        message:
          "Execute this preparation transaction first, then retry placing the stake.",
      };
    } else {
      return {
        transaction: new Transaction(),
        success: false,
        message: prep.reason || "Unknown preparation failure",
      };
    }
  }

  return result;
}

export async function listNft(
  softListingId: string,
  listPrice: number,
  packageId: string,
  moduleName: string,
  marketplaceObjectId: string,
  nftId: string,
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
  moduleName: string,
): Promise<Transaction> => {
  try {
    const tx = new Transaction();
    const estimatedGasFee = BigInt(50000000); // 0.05 SUI
    tx.setGasBudget(Number(estimatedGasFee));

    // Use the same NFT type as in your existing code
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
  callerAddress: string | null = null,
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

    const returnValues = result?.results?.[0]?.returnValues;
    if (!returnValues || !Array.isArray(returnValues)) {
      return { hasStaked: false, stakeAmount: 0 };
    }

    // Let's find the boolean (hasStaked) and the u64 (stakeAmount) in the results
    let hasStaked = false;
    let stakeAmount = 0;

    // Find the boolean value first
    const boolValues = returnValues.filter(
      ([value, type]) => type === "bool" && Array.isArray(value),
    );

    if (boolValues.length > 0) {
      hasStaked = boolValues[0][0][0] === 1;
    }

    // Find the stake amount .
    const u64Values = returnValues.filter(
      ([value, type]) =>
        type === "u64" && Array.isArray(value) && value.length === 8,
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
