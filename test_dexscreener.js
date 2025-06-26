// Test DexScreener API endpoints to find the correct one for new token data
import axios from 'axios';

async function testDexScreenerEndpoints() {
  const endpoints = [
    'https://api.dexscreener.com/latest/dex/pairs/solana',
    'https://api.dexscreener.com/latest/dex/tokens/solana',
    'https://api.dexscreener.com/latest/dex/search?q=solana'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      const response = await axios.get(endpoint, { timeout: 10000 });
      
      if (response.data && response.data.pairs) {
        console.log(`✓ Success: Found ${response.data.pairs.length} pairs`);
        
        // Check if we have creation dates
        const recentPairs = response.data.pairs.slice(0, 3);
        for (const pair of recentPairs) {
          if (pair.pairCreatedAt) {
            const created = new Date(pair.pairCreatedAt);
            const ageHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
            console.log(`  Token: ${pair.baseToken?.symbol || 'Unknown'} created ${ageHours.toFixed(1)}h ago`);
          }
        }
        
        // This endpoint works, break out of loop
        console.log(`✓ Using endpoint: ${endpoint}`);
        return endpoint;
      }
    } catch (error) {
      console.log(`✗ Failed: ${error.message}`);
    }
  }
  
  return null;
}

testDexScreenerEndpoints();