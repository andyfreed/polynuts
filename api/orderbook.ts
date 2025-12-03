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
    const { marketId, tokenId } = request.query;

    if (!tokenId || typeof tokenId !== 'string') {
      return response.status(400).json({
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

    return response.status(200).json(orderBook);
  } catch (error: any) {
    console.error('Error in /api/orderbook:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

