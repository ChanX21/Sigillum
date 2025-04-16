
import { MARKETPLACE_ID, MODULE_NAME, PACKAGE_ID } from '@/lib/suiConfig';

// CONSTANTS
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

export function listNft(
    { softListingId,
      listPrice }: {
        softListingId: string,
        listPrice: number
      }
  ) {
    const tx = new Transaction();
    // const price: bigint = BigInt(listPrice);
    
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::convert_to_real_listing`,
      arguments: [
        tx.object(MARKETPLACE_ID as string),
        tx.object(softListingId),  // Serialize listingId
        tx.pure(bcs.u64().serialize(BigInt(listPrice))),
      ],
    });
  
    return tx;
  }