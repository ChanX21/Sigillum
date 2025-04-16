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
export function getTimeRemaining(endTimeSeconds: number | undefined): string {
  if (!endTimeSeconds || endTimeSeconds === 0) return "No deadline";
  
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const timeLeft = endTimeSeconds - now;
  
  if (timeLeft <= 0) return "Auction ended";
  
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  
  return `${hours}h ${minutes}m`;
}

// Format SUI amount (convert from MIST to SUI)
export function formatSuiAmount(amount: number): string {
  return (amount / 1_000_000_000).toFixed(2);
}
