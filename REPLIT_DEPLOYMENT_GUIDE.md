# 24/7 Copy Trading Deployment Guide

## Complete Setup Instructions

### 1. Railway Deployment (Recommended - $5/month)

**Step 1: Create Railway Account**
1. Go to https://railway.app
2. Sign up with GitHub account
3. Connect your GitHub account

**Step 2: GitHub Repository Setup**
1. Create new repository: `crypto-copy-trading`
2. Push all current code to GitHub
3. Include these files:
   - `railway.json` (deployment config)
   - `Dockerfile` (container setup)
   - `tsconfig.server.json` (server build config)

**Step 3: Railway Project Creation**
1. Click "New Project" in Railway
2. Select "Deploy from GitHub repo"
3. Choose your `crypto-copy-trading` repository
4. Railway will auto-detect Node.js and deploy

**Step 4: Database Setup**
1. In Railway dashboard, click "New Service"
2. Select "PostgreSQL"
3. Railway will create database and provide connection string
4. Copy the DATABASE_URL for environment variables

**Step 5: Environment Variables**
Add these in Railway project settings:
```
DATABASE_URL=postgresql://username:password@host:port/database (from Railway)
BIRDEYE_API_KEY=your_birdeye_api_key
NODE_ENV=production
PORT=3000
```

**Step 6: Deploy and Test**
1. Railway will auto-deploy on GitHub push
2. Test all endpoints: `/api/status`, `/api/tokens`, etc.
3. Verify database connection
4. Check logs for any errors

### 2. Alternative: Render Deployment ($7/month)

**Step 1: Create Render Account**
1. Go to https://render.com
2. Sign up with GitHub

**Step 2: New Web Service**
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node
   - Auto-Deploy: Yes

**Step 3: Add PostgreSQL**
1. Create new PostgreSQL database
2. Copy connection string
3. Add to environment variables

**Step 4: Environment Variables**
Same as Railway setup above

## Copy Trading Activation

### Current System Status
Your system is already configured with:
- ✅ **Target Wallet**: BHREKFkPQgAtDs8Vb1UfLkUpjG6ScidTjHaCWFuG2AtX
- ✅ **Birdeye API**: Connected and working
- ✅ **Monitoring**: 2-second intervals
- ✅ **Real-time Data**: Authentic blockchain data

### 24/7 Trading Configuration

**1. Copy Trading Admin Page**
- Go to `/copy-trading-admin` on your deployed site
- Configure your wallet and trading parameters
- Set budget and risk management rules

**2. Key Settings for Your Test**
```json
{
  "walletToCopy": "BHREKFkPQgAtDs8Vb1UfLkUpjG6ScidTjHaCWFuG2AtX",
  "tradingMode": "live",
  "budget": {
    "amount": 10,
    "currency": "SOL"
  },
  "schedule": {
    "repeatDaily": true,
    "dailyStart": "00:00",
    "dailyEnd": "23:59"
  },
  "riskManagement": {
    "maxTradeSize": 30,
    "prorationRule": "percentage",
    "smallTradeMultiplier": 0.05
  }
}
```

**3. Private Key Security**
- Use environment variables for keys
- Implement wallet separation (reserve + trading)
- Enable allocation-based trading
- Set up emergency stop mechanisms

## Success Metrics Tracking

### Week 1 Goals
- [ ] Successful deployment to Railway/Render
- [ ] All API endpoints working
- [ ] Copy trading system activated
- [ ] First trades executed automatically
- [ ] Performance monitoring active

### Week 2 Goals
- [ ] 10+ successful copy trades
- [ ] Performance correlation with target wallet
- [ ] System uptime >99%
- [ ] Cost analysis complete
- [ ] Ready for production scaling

### Key Performance Indicators
- **Trade Execution**: <30 second delay from original
- **Success Rate**: >90% of target wallet trades copied
- **Profit Correlation**: Track against 43.32 SOL benchmark
- **System Reliability**: 24/7 uptime monitoring
- **API Efficiency**: Birdeye usage optimization

## Emergency Procedures

### If Deployment Fails
1. Check Railway/Render logs
2. Verify environment variables
3. Test database connection
4. Check API endpoints manually
5. Rollback to previous version if needed

### If Copy Trading Stops
1. Check system status: `/api/status`
2. Verify Birdeye API limits
3. Check wallet balance and permissions
4. Review trade execution logs
5. Manual override if necessary

### If Trades Are Missing
1. Check target wallet monitoring
2. Verify trade detection logic
3. Review proration calculations
4. Check API rate limits
5. Analyze timing delays

## Cost Monitoring

### Expected Monthly Costs
- **Railway Web Service**: $3-7/month
- **Railway PostgreSQL**: $3-8/month  
- **Birdeye API**: $10-30/month (depends on usage)
- **Monitoring**: Free tier available
- **Total**: ~$16-45/month for testing

### Railway Free Credits
- New accounts get $5 free credits per month
- Your 2-week test will likely be FREE or under $5 total
- Perfect for validating the copy trading system

### Optimization Strategies
- Monitor API usage patterns
- Optimize database queries
- Implement request caching
- Use efficient polling intervals
- Track cost per trade executed

## Next Steps

1. **Immediate**: Choose Railway or Render for deployment
2. **Day 1**: Set up GitHub repository and deploy
3. **Day 2**: Configure environment variables and test
4. **Day 3**: Activate copy trading with your wallet
5. **Week 1-2**: Monitor and optimize performance
6. **Week 3-4**: Scale to production with user accounts

Your 24/7 copy trading system is ready for deployment! The momentum trader's 43.32 SOL profit in 5 days shows the potential - now let's capture it systematically.