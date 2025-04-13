export function shortenAddress(
  address: string | null | undefined,
  prefixLength: number = 5,
  suffixLength: number = 4
): string {
  // Handle null, undefined, empty strings
  if (!address) return "";

  // Remove whitespace and validate minimum length
  const trimmedAddress = address.trim();

  // Make sure the address is long enough to shorten
  const minLength = prefixLength + suffixLength + 3; // +3 for the ellipsis
  if (trimmedAddress.length <= minLength) {
    return trimmedAddress;
  }

  // Handle potential 0x prefix more intelligently for Ethereum addresses
  if (trimmedAddress.startsWith("0x") && prefixLength < 7) {
    // Keep the 0x prefix plus the specified number of characters after it
    return `${trimmedAddress.slice(
      0,
      prefixLength + 2
    )}...${trimmedAddress.slice(-suffixLength)}`;
  }

  // Default case for any address
  return `${trimmedAddress.slice(0, prefixLength)}...${trimmedAddress.slice(
    -suffixLength
  )}`;
}
