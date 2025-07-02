# SolanaTrader Pro API Documentation

## Overview
Direct Solana blockchain access for copy trading, wallet analytics, and token monitoring without expensive third-party APIs.

## Authentication
```
Authorization: Bearer YOUR_API_KEY
```

## Core Endpoints

### 1. General Wallet Analytics API
**GET** `/api/v1/wallet/{address}`
```json
{
  "address": "BHREK8rHjSJ5KqkW3FfDtmGJPyGM2G2AtX",
  "strategy": "momentum_holder",
  "performance": {
    "totalPnL": 6923,
    "winRate": 77.8,
    "totalTrades": 27,
    "avgHoldTime": 2820
  },
  "recentActivity": [...],
  "riskMetrics": {...}
}
```

**Parameters:**
- `timeframe`: 24h, 7d, 30d, all
- `includeTransactions`: true/false
- `includeTokens`: true/false

### 2. Specialized Copy Trading API
**GET** `/api/v1/copy-trading/opportunities`
```json
{
  "topTraders": [
    {
      "address": "BHREK...",
      "winRate": 77.8,
      "recentTrades": [...],
      "copyRecommendation": "high_confidence"
    }
  ],
  "liveSignals": [...],
  "riskAssessment": {...}
}
```

### 3. Real-time Transaction Monitoring
**WebSocket** `/ws/wallet-stream`
```json
{
  "type": "new_transaction",
  "wallet": "BHREK...",
  "transaction": {
    "signature": "5KJ...",
    "type": "buy",
    "token": "PEPE",
    "amount": 1200,
    "timestamp": 1672531200000
  }
}
```

### 4. Portfolio Management API
**GET** `/api/v1/portfolio/performance`
```json
{
  "totalValue": 525.75,
  "pnl24h": 25.75,
  "activePositions": 3,
  "riskScore": 6.8,
  "positions": [...]
}
```

## Pricing Tiers

### Basic ($29/month)
- 5 tracked wallets
- 1000 API calls/day
- Basic analytics
- Email alerts

### Pro ($99/month)  
- Unlimited wallets
- 10,000 API calls/day
- Real-time WebSocket streams
- Advanced risk metrics
- Priority support

### Enterprise ($299/month)
- Custom integrations
- Unlimited API calls
- White-label options
- Dedicated support
- Custom strategies

## Technical Advantages

1. **Zero Dependency Risk** - Direct Solana RPC eliminates third-party failures
2. **Real-time Data** - Sub-second transaction detection
3. **Cost Efficient** - No per-call charges from external APIs
4. **Reliable** - 99.9% uptime with blockchain-native access
5. **Scalable** - Direct RPC scales with demand

## Use Cases

### Retail Traders
- Copy successful strategies automatically
- Monitor whale wallets
- Risk-managed position sizing

### Crypto Funds
- Track multiple strategies simultaneously  
- Institutional-grade analytics
- Compliance reporting

### Trading Bots
- Real-time signal generation
- Automated execution triggers
- Performance optimization

## Getting Started

1. Sign up at trader.pro/api
2. Get API key from dashboard
3. Test with sandbox environment
4. Deploy to production

## Rate Limits
- Basic: 1000 calls/day
- Pro: 10,000 calls/day  
- Enterprise: Unlimited

## Support
- Documentation: docs.trader.pro
- Discord: discord.gg/traderpro
- Email: support@trader.pro