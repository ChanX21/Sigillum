import { NFTMetadata } from "@/types";
import axios from "axios";

export async function fetchMetadata(url: string): Promise<NFTMetadata | null> {
  try {
    const response = await axios.get<NFTMetadata>(url);

    return response.data;
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
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
