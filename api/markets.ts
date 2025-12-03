import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from '../src/config';
import { PolymarketClient } from '../src/polymarket-client';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
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

    const { active, closed, limit, marketId } = request.query;

    // Get specific market
    if (marketId && typeof marketId === 'string') {
      const market = await client.getMarket(marketId);
      return response.status(200).json(market);
    }

    // Get markets list
    const markets = await client.getMarkets({
      active: active === 'true' ? true : active === 'false' ? false : undefined,
      closed: closed === 'true' ? true : closed === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    return response.status(200).json(markets);
  } catch (error: any) {
    console.error('Error in /api/markets:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

