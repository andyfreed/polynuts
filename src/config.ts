import * as dotenv from 'dotenv';

dotenv.config();

export interface PolymarketConfig {
  apiKey: string;
  secret: string;
  passphrase: string;
  polyAddress?: string; // Polygon address (required for authenticated requests)
  network?: 'mainnet' | 'testnet';
  baseUrl?: string;
}

export function getConfig(): PolymarketConfig {
  const apiKey = process.env.POLYMARKET_API_KEY;
  const secret = process.env.POLYMARKET_SECRET;
  const passphrase = process.env.POLYMARKET_PASSPHRASE;
  const polyAddress = process.env.POLYMARKET_POLY_ADDRESS;

  if (!apiKey || !secret || !passphrase) {
    throw new Error(
      'Missing required environment variables: POLYMARKET_API_KEY, POLYMARKET_SECRET, and POLYMARKET_PASSPHRASE must be set'
    );
  }

  return {
    apiKey,
    secret,
    passphrase,
    polyAddress,
    network: (process.env.POLYMARKET_NETWORK as 'mainnet' | 'testnet') || 'mainnet',
    baseUrl: process.env.POLYMARKET_BASE_URL,
  };
}

