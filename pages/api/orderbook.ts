import type { NextApiRequest, NextApiResponse } from 'next';
import { getConfig } from '../../src/config';
import { PolymarketClient } from '../../src/polymarket-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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
    const { marketId, tokenId } = req.query;

    if (!tokenId || typeof tokenId !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'tokenId query parameter is required',
      });
    }

    const config = getConfig();
    const client = new PolymarketClient(config);

    const orderBook = await client.getOrderBook(
      marketId as string || tokenId,
      tokenId,
    );

    return res.status(200).json(orderBook);
  } catch (error: any) {
    console.error('Error in /api/orderbook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

