# API Access Guide

## Web Interface
- **Main App**: https://45152da1-96ee-4672-b427-69702b128dff-00-2ydknlzrpib47.worf.replit.dev
- **Dashboard**: https://45152da1-96ee-4672-b427-69702b128dff-00-2ydknlzrpib47.worf.replit.dev/dashboard
- **Elite Analysis**: https://45152da1-96ee-4672-b427-69702b128dff-00-2ydknlzrpib47.worf.replit.dev/early-buyer-analysis

## API Endpoints

### Authentication
Currently no API key required for internal endpoints. All endpoints are accessible directly.

### Core Trading API
- **GET /api/status** - System status and Solana connection
- **GET /api/parameters** - Current trading parameters
- **GET /api/tokens** - Monitored tokens
- **GET /api/trades** - Trading history
- **GET /api/alerts** - System alerts

### Copy Trading API
- **POST /api/copy-trading/start** - Start copy trading monitor
- **GET /api/copy-trading/status** - Copy trading status
- **POST /api/copy-trading/stop** - Stop copy trading monitor

### Elite Wallet Analysis API
- **GET /api/wallet-verification/verified-elites** - Get verified elite wallets
- **GET /api/wallet-verification/demo-addresses** - Get demo addresses
- **GET /api/wallet-verification/multi-token-legends** - Find multi-token legends

### Unified Explorer API
- **GET /api/explorer/wallet/:address** - Analyze wallet activity
- **GET /api/explorer/token/:address** - Analyze token early buyers
- **GET /api/explorer/analyze/:address** - Auto-detect wallet or token

### Portfolio API
- **GET /api/portfolio/stats** - Portfolio statistics
- **GET /api/portfolio/positions** - Current positions
- **GET /api/portfolio/performance** - Performance metrics

## Environment Variables Available
- **BIRDEYE_API_KEY** - Your Birdeye API key for market data
- **DATABASE_URL** - PostgreSQL connection string
- **REPL_SLUG** - Your Replit project name
- **REPL_OWNER** - Your Replit username

## Example Usage

```bash
# Check system status
curl https://your-repl-url.repl.co/api/status

# Get current trading parameters
curl https://your-repl-url.repl.co/api/parameters

# Start copy trading
curl -X POST https://your-repl-url.repl.co/api/copy-trading/start

# Analyze a wallet
curl https://your-repl-url.repl.co/api/explorer/wallet/WALLET_ADDRESS

# Get elite wallet analysis
curl https://your-repl-url.repl.co/api/wallet-verification/verified-elites
```

## Rate Limiting
- Some endpoints have rate limiting (429 responses)
- Automatic retry with exponential backoff implemented
- Birdeye API has rate limits - manage accordingly

## Development vs Production
- **Development**: Direct localhost:5000 access
- **Production**: Full Replit URL with HTTPS
- All endpoints work in both environments