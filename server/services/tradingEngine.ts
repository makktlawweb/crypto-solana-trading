import { storage } from "../storage";
import { dexApiService } from "./dexApi";
import { solanaService } from "./solana";
import type { Token, StrategyConfig, InsertTrade, InsertAlert } from "../../shared/schema.js";

export class TradingEngine {
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private positions: Map<string, { token: Token; buyPrice: number; quantity: number }> = new Map();

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log("Starting trading engine monitoring...");

    // Monitor every 10 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.monitoringCycle();
    }, 10000);

    await this.createAlert({
      type: "info",
      message: "Trading engine monitoring started",
    });
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log("Trading engine monitoring stopped");
    await this.createAlert({
      type: "info",
      message: "Trading engine monitoring stopped",
    });
  }

  private async monitoringCycle(): Promise<void> {
    try {
      const params = await storage.getCurrentTradingParameters();
      if (!params) {
        console.error("No trading parameters found");
        return;
      }

      // Step 1: Check for new tokens
      await this.checkForNewTokens(params);

      // Step 2: Update existing watched tokens
      await this.updateWatchedTokens(params);

      // Step 3: Check for buy triggers
      await this.checkBuyTriggers(params);

      // Step 4: Check exit conditions for positions
      await this.checkExitConditions(params);

    } catch (error) {
      console.error("Error in monitoring cycle:", error);
      await this.createAlert({
        type: "error",
        message: `Monitoring cycle error: ${error}`,
      });
    }
  }

  private async checkForNewTokens(params: StrategyConfig): Promise<void> {
    try {
      // Get boosted/trending tokens which are often newer
      const boostResponse = await fetch('https://api.dexscreener.com/token-boosts/latest/v1');
      let newTokensFound = 0;
      
      if (boostResponse.ok) {
        const boostData = await boostResponse.json();
        
        if (Array.isArray(boostData)) {
          for (const boost of boostData.slice(0, 20)) {
            if (boost.chainId === 'solana' && boost.tokenAddress) {
              await this.processTokenFromAddress(boost.tokenAddress, params);
              newTokensFound++;
            }
          }
        }
      }
      
      // Also search for SOL pairs to get more current data
      const searchResponse = await fetch('https://api.dexscreener.com/latest/dex/search?q=SOL');
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (searchData?.pairs && Array.isArray(searchData.pairs)) {
          for (const pair of searchData.pairs.slice(0, 50)) {
            // Only process Solana pairs
            if (pair.chainId !== 'solana') continue;
            
            // Extract the non-SOL token from each pair
            const token = pair.baseToken?.symbol !== 'SOL' ? pair.baseToken : pair.quoteToken;
            
            if (token && token.address && token.symbol !== 'SOL' && token.symbol !== 'USDC' && token.symbol !== 'WSOL') {
              // Validate it's a proper Solana address (32-44 characters, no 0x prefix)
              if (token.address.length < 32 || token.address.length > 44 || token.address.startsWith('0x')) continue;
              
              const existingToken = await storage.getTokenByAddress(token.address);
              
              if (existingToken) {
                console.log(`Skipping ${token.symbol} - already exists in database`);
                continue;
              }
              
              if (!existingToken) {
                const marketCap = pair.fdv || pair.marketCap || 0;
                const price = parseFloat(pair.priceUsd || "0");
                const volume24h = pair.volume?.h24 || 0;
                
                // Calculate realistic age based on pair creation if available
                let tokenAge = 3600; // Default 1 hour
                if (pair.pairCreatedAt) {
                  const createdTime = new Date(pair.pairCreatedAt).getTime();
                  tokenAge = Math.floor((Date.now() - createdTime) / 1000);
                  
                  // Skip very old tokens (older than max age parameter)
                  if (tokenAge > params.maxAge * 60) {
                    console.log(`Skipping ${token.symbol} - too old: ${Math.floor(tokenAge/60)}min (max: ${params.maxAge}min)`);
                    continue;
                  }
                }
                
                // Filter out unrealistic market caps for new tokens (relaxed for testing)
                if (tokenAge < 3600 && marketCap > 500000000) {
                  console.log(`Skipping ${token.symbol} - unrealistic MC ${marketCap} for age ${Math.floor(tokenAge/60)}min`);
                  continue;
                }
                
                console.log(`Processing token: ${token.symbol} - MC: $${marketCap}, Age: ${Math.floor(tokenAge/60)}min`);
                
                const newToken = await storage.createToken({
                  address: token.address,
                  name: token.name || "Unknown",
                  symbol: token.symbol,
                  marketCap,
                  price,
                  volume24h,
                  age: tokenAge,
                  status: marketCap >= params.watchThreshold ? "watching" : "new",
                  dexSource: pair.dexId || "raydium",
                });
                
                newTokensFound++;
                
                // Create appropriate alerts based on market cap
                if (marketCap >= params.watchThreshold) {
                  await this.createAlert({
                    type: "success",
                    message: `Solana token ${newToken.symbol} meets watch criteria: $${marketCap.toLocaleString()} MC (${Math.floor(tokenAge/60)}min old)`,
                    tokenAddress: newToken.address,
                  });
                } else if (marketCap > 1000 && marketCap < 100000) {
                  await this.createAlert({
                    type: "info",
                    message: `New Solana token: ${newToken.symbol} - $${marketCap.toLocaleString()} MC (${Math.floor(tokenAge/60)}min old)`,
                    tokenAddress: newToken.address,
                  });
                }
              }
            }
          }
        }
      }
      
      if (newTokensFound > 0) {
        console.log(`Discovered ${newTokensFound} new Solana tokens from DexScreener`);
      }
    } catch (error) {
      console.error("Error checking for new tokens:", error);
    }
  }

  private async processTokenFromAddress(tokenAddress: string, params: StrategyConfig): Promise<void> {
    try {
      const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${tokenAddress}`);
      
      if (!response.ok) return;
      
      const pairs = await response.json();
      
      if (Array.isArray(pairs) && pairs.length > 0) {
        const pair = pairs[0]; // Use the first/main pair
        
        const existingToken = await storage.getTokenByAddress(tokenAddress);
        if (existingToken) return;
        
        const marketCap = pair.fdv || pair.marketCap || 0;
        const price = parseFloat(pair.priceUsd || "0");
        const volume24h = pair.volume?.h24 || 0;
        
        let tokenAge = 3600; // Default 1 hour
        if (pair.pairCreatedAt) {
          const createdTime = new Date(pair.pairCreatedAt).getTime();
          tokenAge = Math.floor((Date.now() - createdTime) / 1000);
          
          // Skip very old tokens
          if (tokenAge > params.maxAge * 60) return;
        }
        
        const token = pair.baseToken?.address === tokenAddress ? pair.baseToken : pair.quoteToken;
        
        const newToken = await storage.createToken({
          address: tokenAddress,
          name: token?.name || "Unknown",
          symbol: token?.symbol || "???",
          marketCap,
          price,
          volume24h,
          age: tokenAge,
          status: marketCap >= params.watchThreshold ? "watching" : "new",
          dexSource: pair.dexId || "raydium",
        });
        
        if (marketCap >= params.watchThreshold) {
          await this.createAlert({
            type: "success",
            message: `Boosted Solana token ${newToken.symbol} meets criteria: $${marketCap.toLocaleString()} MC`,
            tokenAddress: newToken.address,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing token ${tokenAddress}:`, error);
    }
  }

  private async updateWatchedTokens(params: StrategyConfig): Promise<void> {
    try {
      const watchedTokens = await storage.getWatchedTokens();
      
      for (const token of watchedTokens) {
        // Update price and market cap
        const currentPrice = await dexApiService.getTokenPrice(token.address);
        if (currentPrice) {
          const updatedMarketCap = this.calculateMarketCap(currentPrice, token.address);
          
          await storage.updateToken(token.address, {
            price: currentPrice,
            marketCap: updatedMarketCap,
            lastUpdated: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Error updating watched tokens:", error);
    }
  }

  private async checkBuyTriggers(params: StrategyConfig): Promise<void> {
    try {
      const watchingTokens = await storage.getTokensByStatus("watching");
      
      for (const token of watchingTokens) {
        if (token.marketCap <= params.buyTrigger) {
          await storage.updateToken(token.address, { status: "buy_trigger" });
          
          await this.createAlert({
            type: "warning",
            message: `${token.name} triggered buy condition at $${token.marketCap.toLocaleString()} MC`,
            tokenAddress: token.address,
          });

          // Execute buy order at specified price
          if (token.marketCap <= params.buyPrice) {
            await this.executeBuyOrder(token, params);
          }
        }
      }
    } catch (error) {
      console.error("Error checking buy triggers:", error);
    }
  }

  private async executeBuyOrder(token: Token, params: StrategyConfig): Promise<void> {
    try {
      // In a real implementation, this would execute the actual buy order on the DEX
      // For now, we'll simulate the trade
      
      const buyPrice = params.buyPrice;
      const quantity = params.positionSize / token.price; // Calculate quantity based on position size
      
      // Record the trade
      const trade = await storage.createTrade({
        tokenId: token.id,
        tokenAddress: token.address,
        tokenName: token.name,
        entryPrice: buyPrice,
        exitPrice: null,
        quantity: quantity,
        entryTime: new Date(),
        exitTime: null,
        duration: null,
        pnl: null,
        pnlPercent: null,
        exitReason: null,
        isBacktest: false,
        backtestId: null,
      });

      // Update token status and store position
      await storage.updateToken(token.address, { status: "bought" });
      this.positions.set(token.address, { token, buyPrice, quantity });

      await this.createAlert({
        type: "success",
        message: `Successfully bought ${token.name} at $${buyPrice.toFixed(6)}`,
        tokenAddress: token.address,
      });

      console.log(`Executed buy order for ${token.name} at $${buyPrice}`);
    } catch (error) {
      console.error("Error executing buy order:", error);
      await this.createAlert({
        type: "error",
        message: `Failed to buy ${token.name}: ${error}`,
        tokenAddress: token.address,
      });
    }
  }

  private async checkExitConditions(params: StrategyConfig): Promise<void> {
    try {
      const boughtTokens = await storage.getTokensByStatus("bought");
      
      for (const token of boughtTokens) {
        const position = this.positions.get(token.address);
        if (!position) continue;

        const currentPrice = token.price;
        const buyPrice = position.buyPrice;
        const takeProfitPrice = buyPrice * params.takeProfitMultiplier;
        const stopLossPrice = buyPrice * (1 - params.stopLossPercent / 100);

        let shouldExit = false;
        let exitReason = "";

        // Check take profit
        if (currentPrice >= takeProfitPrice) {
          shouldExit = true;
          exitReason = "take_profit";
        }
        // Check stop loss
        else if (currentPrice <= stopLossPrice) {
          shouldExit = true;
          exitReason = "stop_loss";
        }

        if (shouldExit) {
          await this.executeSellOrder(token, position, exitReason, params);
        }
      }
    } catch (error) {
      console.error("Error checking exit conditions:", error);
    }
  }

  private async executeSellOrder(
    token: Token, 
    position: { token: Token; buyPrice: number; quantity: number },
    exitReason: string,
    params: StrategyConfig
  ): Promise<void> {
    try {
      const sellPrice = token.price;
      const pnl = (sellPrice - position.buyPrice) * position.quantity;
      const pnlPercent = ((sellPrice - position.buyPrice) / position.buyPrice) * 100;
      const duration = Date.now() - token.createdAt!.getTime();

      // Find the corresponding trade
      const trades = await storage.getAllTrades();
      const trade = trades.find(t => t.tokenAddress === token.address && !t.exitTime);
      
      if (trade) {
        await storage.updateTrade(trade.id, {
          exitPrice: sellPrice,
          exitTime: new Date(),
          duration: Math.floor(duration / 1000), // Convert to seconds
          pnl: pnl,
          pnlPercent: pnlPercent,
          exitReason: exitReason,
        });
      }

      // Remove position and update token status
      this.positions.delete(token.address);
      await storage.updateToken(token.address, { status: "sold" });

      const alertType = pnl > 0 ? "success" : "error";
      const pnlSign = pnl > 0 ? "+" : "";
      
      await this.createAlert({
        type: alertType,
        message: `Sold ${token.name} at $${sellPrice.toFixed(6)} (${pnlSign}${pnlPercent.toFixed(2)}%) - ${exitReason.replace('_', ' ')}`,
        tokenAddress: token.address,
      });

      console.log(`Executed sell order for ${token.name} at $${sellPrice}, P&L: ${pnlSign}$${pnl.toFixed(2)}`);
    } catch (error) {
      console.error("Error executing sell order:", error);
    }
  }

  private calculateTokenAge(createdAt: Date): number {
    return Math.floor((Date.now() - createdAt.getTime()) / 1000);
  }

  private calculateMarketCap(price: number, tokenAddress: string): number {
    // This is a simplified calculation - in reality, you'd need to get the token supply
    // from the blockchain and multiply by current price
    return price * 1000000; // Assuming 1M token supply for simplicity
  }

  private async createAlert(alert: Omit<InsertAlert, 'timestamp'>): Promise<void> {
    await storage.createAlert(alert);
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  getActivePositions(): Map<string, { token: Token; buyPrice: number; quantity: number }> {
    return this.positions;
  }
}

export const tradingEngine = new TradingEngine();
