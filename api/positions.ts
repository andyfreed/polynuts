import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from '../src/config';
import { PolymarketClient } from '../src/polymarket-client';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  );
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    const config = getConfig();
    const client = new PolymarketClient(config);

    const positions = await client.getPositions();

    return response.status(200).json(positions);
  } catch (error: any) {
    console.error('Error in /api/positions:', error);
    
    // Check if it's a configuration error
    if (error.message?.includes('Missing required environment variables')) {
      return response.status(500).json({
        error: 'Configuration error',
        message: 'API credentials not configured. Please set POLYMARKET_API_KEY, POLYMARKET_SECRET, and POLYMARKET_PASSPHRASE in Vercel environment variables.',
      });
    }
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch positions';
    return response.status(statusCode).json({
      error: 'Failed to fetch positions',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

