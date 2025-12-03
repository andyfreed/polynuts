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
    const config = getConfig();
    const client = new PolymarketClient(config);

    // GET - List orders
    if (req.method === 'GET') {
      const { marketId } = req.query;
      const orders = await client.getOrders(
        marketId as string | undefined,
      );
      return res.status(200).json(orders);
    }

    // POST - Place order
    if (req.method === 'POST') {
      const order = req.body;
      if (!order) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Order data is required',
        });
      }
      const result = await client.placeOrder(order);
      return res.status(200).json(result);
    }

    // DELETE - Cancel order
    if (req.method === 'DELETE') {
      const { orderId } = req.query;
      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'orderId query parameter is required',
        });
      }
      await client.cancelOrder(orderId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in /api/orders:', error);
    
    // Check if it's a configuration error
    if (error.message?.includes('Missing required environment variables')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'API credentials not configured. Please set POLYMARKET_API_KEY, POLYMARKET_SECRET, and POLYMARKET_PASSPHRASE in Vercel environment variables.',
      });
    }
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch orders';
    return res.status(statusCode).json({
      error: 'Failed to fetch orders',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

