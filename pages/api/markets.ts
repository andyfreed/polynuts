import type { NextApiRequest, NextApiResponse } from 'next';
import { getConfig } from '../../src/config';
import { PolymarketClient } from '../../src/polymarket-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const config = getConfig();
    const client = new PolymarketClient(config);

    const { active, closed, limit, marketId } = req.query;

    // Get specific market
    if (marketId && typeof marketId === 'string') {
      const market = await client.getMarket(marketId);
      return res.status(200).json(market);
    }

    // Get markets list
    const markets = await client.getMarkets({
      active: active === 'true' ? true : active === 'false' ? false : undefined,
      closed: closed === 'true' ? true : closed === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    return res.status(200).json(markets);
  } catch (error: any) {
    console.error('Error in /api/markets:', error);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch markets';
    return res.status(statusCode).json({
      error: 'Failed to fetch markets',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

