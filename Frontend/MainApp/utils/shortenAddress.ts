export function shortenAddress(address: string | undefined): string {
    if (!address) return '';
    return `${address.slice(0, 5)}...${address.slice(-9)}`;
}