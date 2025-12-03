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

    // GET - List orders
    if (request.method === 'GET') {
      const { marketId } = request.query;
      const orders = await client.getOrders(
        marketId as string | undefined,
      );
      return response.status(200).json(orders);
    }

    // POST - Place order
    if (request.method === 'POST') {
      const order = request.body;
      if (!order) {
        return response.status(400).json({
          error: 'Bad request',
          message: 'Order data is required',
        });
      }
      const result = await client.placeOrder(order);
      return response.status(200).json(result);
    }

    // DELETE - Cancel order
    if (request.method === 'DELETE') {
      const { orderId } = request.query;
      if (!orderId || typeof orderId !== 'string') {
        return response.status(400).json({
          error: 'Bad request',
          message: 'orderId query parameter is required',
        });
      }
      await client.cancelOrder(orderId);
      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in /api/orders:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

