import { getConfig } from './config';
import { PolymarketClient } from './polymarket-client';

async function main() {
  try {
    // Load configuration from environment variables
    const config = getConfig();
    console.log('Polymarket API Client initialized');
    console.log(`Network: ${config.network}`);

    // Initialize the client
    const client = new PolymarketClient(config);

    // Example: Fetch active markets
    console.log('\nFetching active markets...');
    const markets = await client.getMarkets({ active: true, limit: 10 });
    
    if (markets.length > 0) {
      console.log(`\nFound ${markets.length} active markets:`);
      markets.slice(0, 5).forEach((market, index) => {
        console.log(`\n${index + 1}. ${market.question || market.id}`);
        if (market.volume) {
          console.log(`   Volume: $${market.volume}`);
        }
      });
    } else {
      console.log('No active markets found');
    }

    // Example: Get a specific market (uncomment and provide a market ID)
    // const marketId = 'your-market-id-here';
    // const market = await client.getMarket(marketId);
    // console.log('\nMarket details:', market);

    // Example: Get user positions (requires authentication)
    // console.log('\nFetching positions...');
    // const positions = await client.getPositions();
    // console.log('Positions:', positions);

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main();
}

export { PolymarketClient };
export * from './config';
export * from './polymarket-client';

