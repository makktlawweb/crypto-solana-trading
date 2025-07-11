# Postman API Collection - Crypto Copy Trading Platform

## Base URL
```
https://45152da1-96ee-4672-b427-69702b128dff-00-2ydknlzrpib47.worf.replit.dev
```

## Alternative URLs (try these if main URL doesn't work)
- `https://workspace-makktlaw.replit.app` (when deployed)
- `https://workspace.makktlaw.repl.co` (legacy format)

## ✅ API STATUS: LIVE AND OPERATIONAL
- All endpoints are active and responding
- No authentication required
- Real-time Solana data integration
- Comprehensive wallet and token analysis

## 🔥 NEW: Advanced Activity Analysis

The most powerful feature - granular activity analysis with flexible time ranges:

```
GET /api/{walletOrToken}/activity/{granularity}/days/{range}
```

**Parameters:**
- `walletOrToken`: Any wallet address or token address
- `granularity`: `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, or `ALL`
- `range`: Positive (first X days) or negative (last X days from today)

**Examples:**
- Last 20 days of wallet activity: `/api/9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM/activity/ALL/days/-20`
- First 7 days of token hourly data: `/api/B2icxTVZantkLrzZV69koG6bf9WAoEXpk1yrbwvMmoon/activity/hours/days/7`
- Last 1 day of wallet minute-by-minute: `/api/9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM/activity/minutes/days/1`

**Response includes:**
- Complete activity timeline with timestamps
- Transaction/trade volumes, prices, P&L
- Summary statistics and activity distribution
- Peak activity periods and quiet times
- **NEW: Detailed transaction ledger with individual trades**
- Exact buy/sell actions with token names, amounts, prices
- Transaction signatures for blockchain verification
- Individual P&L per transaction

**Sample Response with Transaction Details:**
```json
{
  "address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "type": "wallet",
  "dataPoints": [
    {
      "timestamp": "2024-07-11T17:38:23.576Z",
      "transactions": 11,
      "volume": 220.887,
      "profitLoss": 24.795,
      "transactionDetails": [
        {
          "timestamp": "2024-07-11T17:38:23.576Z",
          "action": "buy",
          "token": "WIF",
          "tokenAddress": "wifpkv1oynjcon",
          "amount": 2939,
          "priceUsd": 782.18,
          "signature": "k38f5t7frrmmwvigp6vach",
          "profitLoss": 54.53
        },
        {
          "timestamp": "2024-07-11T19:49:18.121Z",
          "action": "buy", 
          "token": "PEPE",
          "amount": 8060,
          "priceUsd": 979,
          "profitLoss": 52.48
        }
      ]
    }
  ]
}
```

## Core API Endpoints

### 1. System Status
```
GET /api/status
```
**Response:**
```json
{
  "solana": {
    "connected": true,
    "slot": 352611956
  },
  "monitoring": false,
  "activePositions": 0,
  "timestamp": "2025-07-11T14:52:31.000Z"
}
```

### 2. Trading Parameters
```
GET /api/parameters
```
**Response:**
```json
{
  "id": 28,
  "watchThreshold": 5,
  "buyTrigger": 6,
  "buyPrice": 8,
  "takeProfitMultiplier": 2,
  "stopLossPercent": 20,
  "maxAge": 7200,
  "positionSize": 25,
  "dexSources": ["pumpfun", "meteora", "pumpswap"]
}
```

### 3. Monitored Tokens
```
GET /api/tokens
```
**Response:**
```json
[
  {
    "id": 13,
    "address": "B2icxTVZantkLrzZV69koG6bf9WAoEXpk1yrbwvMmoon",
    "name": "10b moonshot",
    "symbol": "PEMDAS",
    "marketCap": 507455,
    "price": 0.0005074,
    "volume24h": 4530862,
    "age": 6012,
    "status": "watching",
    "dexSource": "meteora"
  }
]
```

### 4. Copy Trading Status
```
GET /api/copy-trading/status
```
**Response:**
```json
{
  "isMonitoring": false,
  "monitoredWallets": [
    {
      "walletAddress": "suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK",
      "isActive": true,
      "copyBuys": true,
      "copySells": true,
      "minMarketCap": 8000,
      "maxMarketCap": 50000,
      "minVolume": 2500,
      "positionSizePercent": 5,
      "delaySeconds": 2
    }
  ],
  "recentSignals": [],
  "signalCount": 0
}
```

### 5. Start Copy Trading
```
POST /api/copy-trading/start
```
**No body required**

### 6. Stop Copy Trading
```
POST /api/copy-trading/stop
```
**No body required**

### 7. Portfolio Stats
```
GET /api/portfolio/stats
```
**Response:**
```json
{
  "watchedTokens": 3,
  "activeOrders": 0,
  "todayPnL": 0,
  "totalPnL": 0,
  "totalTrades": 0,
  "winRate": 0
}
```

### 8. System Alerts
```
GET /api/alerts
```
**Response:**
```json
[
  {
    "id": 43,
    "type": "success",
    "message": "🚀 Automated copy trading ACTIVATED - Monitoring Momentum Trader (77.8% win rate) for live execution",
    "tokenAddress": null,
    "timestamp": "2025-07-07T20:56:25.321Z",
    "isRead": false
  }
]
```

### 9. Trading History
```
GET /api/trades
```
**Response:**
```json
[]
```

### 10. Elite Wallet Analysis
```
GET /api/wallet-verification/verified-elites
```
**Response:**
```json
{
  "verifiedElites": [
    {
      "walletAddress": "suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK",
      "performance": {
        "totalTrades": 106,
        "winRate": 69.2,
        "totalPnL": 4847,
        "avgHoldTime": 48
      },
      "classification": "Speed Trader"
    }
  ]
}
```

### 11. Wallet Explorer
```
GET /api/explorer/wallet/{walletAddress}
```
**Example:** `/api/explorer/wallet/suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK`

### 12. Token Explorer
```
GET /api/explorer/token/{tokenAddress}
```
**Example:** `/api/explorer/token/B2icxTVZantkLrzZV69koG6bf9WAoEXpk1yrbwvMmoon`

### 13. Multi-Token Legends
```
GET /api/wallet-verification/multi-token-legends
```
Returns wallets that were early buyers of multiple successful tokens.

### 14. Automated Trading Status
```
GET /api/automated-copy-trading/status
```
Check if automated trading wallet is active.

### 15. Social Intelligence (Future)
```
GET /api/social-intelligence/opportunities
GET /api/social-intelligence/tweets
POST /api/social-intelligence/start
POST /api/social-intelligence/stop
```

## Authentication
- **No API key required** for current endpoints
- All endpoints are publicly accessible
- Future commercial version will require API keys

## Rate Limiting
- Some endpoints have rate limiting (429 responses)
- Automatic retry with exponential backoff implemented
- Birdeye API integration has rate limits

## Error Handling
- Standard HTTP status codes
- JSON error responses
- Detailed error messages in response body

## Example Postman Environment Variables
```
base_url: https://workspace.makktlaw.repl.co
wallet_address: suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK
token_address: B2icxTVZantkLrzZV69koG6bf9WAoEXpk1yrbwvMmoon
```

## Headers
```
Content-Type: application/json
Accept: application/json
```

## Sample Collection Structure
1. **System** - Status, Parameters, Alerts
2. **Trading** - Tokens, Trades, Portfolio
3. **Copy Trading** - Status, Start, Stop
4. **Analysis** - Wallet Explorer, Token Explorer
5. **Elite Wallets** - Verification, Multi-token Legends
6. **Future** - Social Intelligence, Automated Features