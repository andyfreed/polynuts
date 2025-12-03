import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  
  return response.status(200).json({
    status: 'ok',
    service: 'Polynuts API',
    timestamp: new Date().toISOString(),
  });
}

