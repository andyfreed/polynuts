import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json');
  
  return response.status(200).json({
    service: 'Polynuts API - Polymarket Integration',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      markets: '/api/markets',
      orderbook: '/api/orderbook?tokenId=YOUR_TOKEN_ID',
      positions: '/api/positions',
      orders: '/api/orders',
    },
    documentation: 'See README.md for API usage details',
  });
}

