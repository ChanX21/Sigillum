import { Transaction } from "@mysten/sui/transactions";

// CONSTANTS
import { EventId, SuiClient, SuiEvent } from "@mysten/sui/client";
import { MODULE_NAME, PACKAGE_ID } from "@/lib/suiConfig";

const NETWORK_URL = 'https://fullnode.testnet.sui.io:443';

// Define type for supported parsed event data
interface NftEventData {
  nft_id?: string;
  object_id?: string;
  itemId?: string;
  [key: string]: any; // Allow additional fields
}

// Narrow SuiEvent to include parsedJson and timestampMs

interface ParsedSuiEvent extends Omit<SuiEvent, 'parsedJson'> {
  parsedJson: NftEventData;
  timestampMs?: string | null; // Fix this line to match actual SDK
}

// Query all events for a specific NFT ID
export async function queryEventsForNft(
  nftId: string,
  eventTypes: string[] = ['ListingCreated']
): Promise<ParsedSuiEvent[]> {
  const client = new SuiClient({ url: NETWORK_URL });

  const allEvents: ParsedSuiEvent[] = [];

  for (const eventType of eventTypes) {
    const fullEventType = `${PACKAGE_ID}::${MODULE_NAME}::${eventType}`;
    console.log(`Querying for ${fullEventType} events related to NFT: ${nftId}`);

    let hasMore = true;
    let cursor: EventId | null = null;

    while (hasMore) {
      try {
        const response = await client.queryEvents({
          query: {
            MoveEventType: fullEventType,
          },
          cursor,
          limit: 100,
          order: 'descending',
        });

        const relevantEvents = response.data
          .map((event) => {
            const parsedJson = event.parsedJson as NftEventData;
            if (
              parsedJson?.nft_id === nftId ||
              parsedJson?.object_id === nftId ||
              parsedJson?.itemId === nftId
            ) {
              return {
                ...event,
                parsedJson,
              } as ParsedSuiEvent;
            }
            return null;
          })
          .filter((event): event is ParsedSuiEvent => event !== null);

        allEvents.push(...relevantEvents);

        hasMore = response.hasNextPage;
        cursor = response.nextCursor as EventId;
        console.log(`Found ${relevantEvents.length} events in current batch`);

        if (!hasMore) break;
      } catch (error) {
        console.error(`Error querying ${eventType} events:`, error);
        break;
      }
    }
  }

  return allEvents;
}

// Format and display events for a specific NFT
export async function displayNftEvents(nftId: string): Promise<Record<string, ParsedSuiEvent[]>> {
  try {
    const events = await queryEventsForNft(nftId, ['ListingCreated', 'ListingCompleted']);

    console.log(`\nFound ${events.length} total events for NFT: ${nftId}`);

    if (events.length === 0) {
      console.log('No events found for this NFT.');
    
    }

    const eventsByType: Record<string, ParsedSuiEvent[]> = {};

    events.forEach(event => {
      const type = event.type.split('::').pop() || 'Unknown';
      if (!eventsByType[type]) {
        eventsByType[type] = [];
      }
      eventsByType[type].push(event);
    });

    console.log('\n=== Events By Type ===');
    for (const [type, typeEvents] of Object.entries(eventsByType)) {
      console.log(`\n${type} (${typeEvents.length}):`);

      typeEvents.forEach((event, index) => {
        console.log(`\n--- Event ${index + 1} ---`);
        console.log(`Timestamp: ${event.timestampMs ? new Date(event.timestampMs).toLocaleString() : 'N/A'}`);
        console.log(`Transaction: ${event.id.txDigest}`);
        console.log(`Sender: ${event.sender}`);
        console.log('Data:');
        console.log(JSON.stringify(event.parsedJson, null, 2));
      });
    }
    return eventsByType
  } catch (error) {
    console.error('Error displaying NFT events:', error);
    return {}
  }
}
