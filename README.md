# Polynuts - Polymarket API Integration

A TypeScript application for interacting with Polymarket's API to access prediction market data, manage orders, and track positions. Deployable on Vercel as serverless API endpoints.

## Features

- 🔍 Browse and search markets
- 📊 Get market data and order books
- 💼 View and manage positions
- 📈 Place and cancel orders
- 🔐 Secure API key management
- 🚀 Ready for Vercel deployment

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Polymarket API credentials
- Vercel account (for deployment)

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   POLYMARKET_API_KEY=your_api_key_here
   POLYMARKET_SECRET=your_secret_here
   POLYMARKET_PASSPHRASE=your_passphrase_here
   POLYMARKET_POLY_ADDRESS=your_polygon_address_here
   POLYMARKET_NETWORK=mainnet
   ```
   
   **Note:** `POLYMARKET_POLY_ADDRESS` is optional but required for authenticated requests (like placing orders). For read-only operations (getting markets, order books), you only need the API key, secret, and passphrase.

3. **Run locally:**
   ```bash
   npm run dev
   ```

## API Endpoints

Once deployed, your API will be available at your Vercel domain. All endpoints support CORS.

### Markets

- **GET** `/api/markets` - Get list of markets
  - Query params: `active` (boolean), `closed` (boolean), `limit` (number)
  - Example: `/api/markets?active=true&limit=10`

- **GET** `/api/markets?marketId=<id>` - Get specific market
  - Query params: `marketId` (string)

### Order Book

- **GET** `/api/orderbook?tokenId=<token_id>` - Get order book
  - Query params: `tokenId` (required), `marketId` (optional)

### Positions

- **GET** `/api/positions` - Get your positions

### Orders

- **GET** `/api/orders` - Get your orders
  - Query params: `marketId` (optional)

- **POST** `/api/orders` - Place a new order
  - Body: Order object with `token_id`, `price`, `side`, `size`

- **DELETE** `/api/orders?orderId=<id>` - Cancel an order
  - Query params: `orderId` (required)

### Example Usage

```typescript
import { getConfig } from './config';
import { PolymarketClient } from './polymarket-client';

const config = getConfig();
const client = new PolymarketClient(config);

// Get active markets
const markets = await client.getMarkets({ active: true, limit: 10 });

// Get a specific market
const market = await client.getMarket('market-id');

// Get order book
const orderBook = await client.getOrderBook('market-id', 'token-id');

// Get your positions
const positions = await client.getPositions();
```

## API Methods

### Market Operations
- `getMarkets(filters?)` - Get list of markets with optional filters
- `getMarket(marketId)` - Get details of a specific market
- `getMarketPrices(marketId)` - Get current prices for a market

### Trading Operations
- `getOrderBook(marketId, tokenId)` - Get order book for a market
- `placeOrder(order)` - Place a new order (requires order signing)
- `cancelOrder(orderId)` - Cancel an existing order
- `getOrders(marketId?)` - Get your orders (optionally filtered by market)

### Account Operations
- `getPositions()` - Get your current positions

## Important Notes

1. **Order Signing**: To place orders, you'll need to use Polymarket's order signing utilities. The `@polymarket/clob-client` package includes utilities for this purpose.

2. **API Rate Limits**: Be mindful of Polymarket's API rate limits. Implement appropriate retry logic and rate limiting in production.

3. **Error Handling**: The client includes basic error handling, but you should add more robust error handling for production use.

4. **Security**: Never commit your `.env` file or API keys to version control.

## Deploy to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/andyfreed/polynuts.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository: `andyfreed/polynuts`
   - Configure environment variables:
     - `POLYMARKET_API_KEY`
     - `POLYMARKET_SECRET`
     - `POLYMARKET_PASSPHRASE`
     - `POLYMARKET_POLY_ADDRESS` (optional, but required for trading operations)
     - `POLYMARKET_NETWORK` (optional, defaults to mainnet)
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables:**
   ```bash
   vercel env add POLYMARKET_API_KEY
   vercel env add POLYMARKET_SECRET
   vercel env add POLYMARKET_PASSPHRASE
   vercel env add POLYMARKET_POLY_ADDRESS
   vercel env add POLYMARKET_NETWORK
   ```

4. **Redeploy to apply env vars:**
   ```bash
   vercel --prod
   ```

### Environment Variables in Vercel

Make sure to add these environment variables in your Vercel project settings:

- `POLYMARKET_API_KEY` - Your Polymarket API key (required)
- `POLYMARKET_SECRET` - Your Polymarket secret (required)
- `POLYMARKET_PASSPHRASE` - Your Polymarket passphrase (required)
- `POLYMARKET_POLY_ADDRESS` - Your Polygon address (optional, but required for trading)
- `POLYMARKET_NETWORK` - Optional: `mainnet` or `testnet` (default: `mainnet`)

## Example API Usage

### JavaScript/TypeScript
```typescript
// Get active markets
const response = await fetch('https://your-app.vercel.app/api/markets?active=true&limit=10');
const markets = await response.json();

// Get order book
const orderBook = await fetch('https://your-app.vercel.app/api/orderbook?tokenId=TOKEN_ID');
const book = await orderBook.json();

// Get positions
const positions = await fetch('https://your-app.vercel.app/api/positions', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY' // If needed
  }
});
const pos = await positions.json();
```

### cURL
```bash
# Get markets
curl https://your-app.vercel.app/api/markets?active=true&limit=10

# Get order book
curl https://your-app.vercel.app/api/orderbook?tokenId=TOKEN_ID

# Get positions
curl https://your-app.vercel.app/api/positions
```

## Resources

- [Polymarket API Documentation](https://docs.polymarket.com)
- [Polymarket CLOB Client (TypeScript)](https://github.com/Polymarket/clob-client)
- [Polymarket Discord](https://discord.gg/polymarket) - Join the #devs channel for support
- [Vercel Documentation](https://vercel.com/docs)

## License

MIT

