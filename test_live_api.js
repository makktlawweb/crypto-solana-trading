import axios from 'axios';

// Test the actual working DexScreener endpoints to find new tokens
async function testLiveEndpoints() {
  const workingEndpoints = [
    'https://api.dexscreener.com/latest/dex/search?q=SOL',
    'https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112',
    'https://api.dexscreener.com/latest/dex/pairs/solana/8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj'
  ];

  for (const endpoint of workingEndpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      const response = await axios.get(endpoint, { timeout: 10000 });
      
      if (response.data) {
        if (response.data.pairs) {
          console.log(`✓ Found ${response.data.pairs.length} pairs`);
          
          // Check for recent tokens with market cap data
          const recentTokens = response.data.pairs
            .filter(pair => {
              if (!pair.pairCreatedAt) return false;
              const ageHours = (Date.now() - new Date(pair.pairCreatedAt).getTime()) / (1000 * 60 * 60);
              return ageHours <= 168; // Last 7 days to find any recent tokens
            })
            .slice(0, 10);
            
          console.log(`Recent tokens (last 24h): ${recentTokens.length}`);
          
          for (const pair of recentTokens) {
            const token = pair.baseToken?.symbol !== 'SOL' ? pair.baseToken : pair.quoteToken;
            if (token) {
              const marketCap = pair.fdv || pair.marketCap || 0;
              const ageHours = (Date.now() - new Date(pair.pairCreatedAt).getTime()) / (1000 * 60 * 60);
              console.log(`  ${token.symbol}: $${marketCap.toLocaleString()} MC, ${ageHours.toFixed(1)}h old`);
            }
          }
        }
        
        if (response.data.pair) {
          console.log(`✓ Single pair data available`);
        }
      }
    } catch (error) {
      console.log(`✗ Failed: ${error.message}`);
    }
  }
}

testLiveEndpoints();