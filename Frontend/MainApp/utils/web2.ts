import { NFTMetadata } from "@/types";
import axios from "axios";

export async function fetchMetadata(url: string): Promise<NFTMetadata | null> {
  try {
    const response = await axios.get<NFTMetadata>(url);

    return response.data;
  } catch (error) {
    console.log("Failed to fetch metadata:", error);
    return null;
  }
}

export function formatHumanReadableDate(isoDateString: string) {
  // Parse the ISO date string
  const date = new Date(isoDateString);

  // Get the day of the month
  const day = date.getDate();

  // Add ordinal suffix to the day (1st, 2nd, 3rd, etc.)
  function getOrdinalSuffix(day: number) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  // Array of month names
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Format the date in the desired format
  const formattedDate = `${day}${getOrdinalSuffix(day)} ${
    months[date.getMonth()]
  }, ${date.getFullYear()}`;

  return formattedDate;
}

// Calculate time remaining from a Unix timestamp
export function getTimeRemaining(endTime: number | undefined): string {
  if (!endTime || endTime === 0) return "No deadline";

  const nowMs = Date.now(); // current time in ms
  const endTimeMs = endTime < 1e12 ? endTime * 1000 : endTime; // normalize to ms

  const timeLeftMs = endTimeMs - nowMs;
  if (timeLeftMs <= 0) return "Ended";

  const timeLeftSec = Math.floor(timeLeftMs / 1000);
  const hours = Math.floor(timeLeftSec / 3600);
  const minutes = Math.floor((timeLeftSec % 3600) / 60);
  const seconds = timeLeftSec % 60;

  // Show time left if less than a day
  if (timeLeftSec < 86400) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  // Otherwise, show the exact end time
  const endDate = new Date(endTimeMs);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };

  return endDate.toLocaleString(undefined, options);
}

// Format SUI amount (convert from MIST to SUI)
export function formatSuiAmount(amount: number): string {
  return (amount / 1_000_000_000).toFixed(amount > 0 ? 4 : 2);
}

export async function convertMistToSuiAndUsd(
  mistAmount: number
): Promise<{ sui: string; usd: string }> {
  const SUI_DECIMALS = 1_000_000_000;

  try {
    const res = await fetch(
      "https://api.diadata.org/v1/assetQuotation/Sui/0x2::sui::SUI"
    );
    const data = await res.json();

    const pricePerSui = data.Price;
    const suiAmount = mistAmount / SUI_DECIMALS;
    const usdValue = suiAmount * pricePerSui;

    return {
      sui: "SUI " + suiAmount.toFixed(suiAmount > 0 ? 4 : 2),
      usd: "USD " + usdValue.toFixed(4),
    };
  } catch (error) {
    console.error("Failed to fetch SUI price:", error);
    return {
      sui: "SUI 0.00",
      usd: "USD 0.00",
    };
  }
}
