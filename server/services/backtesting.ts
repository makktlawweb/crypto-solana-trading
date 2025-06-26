import { storage } from "../storage";
import { dexApiService } from "./dexApi";
import { historicalDataService, type HistoricalTokenData } from "./historicalData";
import type { StrategyConfig, InsertTrade, InsertBacktestResult, BacktestResult } from "@shared/schema";
import { nanoid } from "nanoid";

export interface BacktestTrade {
  tokenAddress: string;
  tokenName: string;
  entryPrice: number;
  exitPrice: number;
  entryTime: Date;
  exitTime: Date;
  duration: number;
  pnl: number;
  pnlPercent: number;
  exitReason: string;
}

export interface BacktestResults {
  backtestId: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  avgTrade: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
  equityCurve: { timestamp: Date; equity: number }[];
}

export class BacktestingService {
  async runBacktest(
    strategy: StrategyConfig,
    timeframeHours: number = 168 // Default 1 week
  ): Promise<BacktestResults> {
    const backtestId = nanoid();
    console.log(`Starting backtest ${backtestId} for ${timeframeHours} hours`);

    try {
      // Get real historical token data from the past week
      const daysBack = Math.ceil(timeframeHours / 24);
      console.log(`Collecting historical data for ${daysBack} days...`);
      
      const historicalData = await historicalDataService.collectHistoricalData(daysBack);
      
      if (historicalData.length === 0) {
        console.log("No real API data available, using demonstration data to show strategy performance");
        throw new Error(`No historical token data available for the last ${daysBack} days. Please ensure DEX API access is configured with proper API keys.`);
      }

      console.log(`Backtesting with ${historicalData.length} real tokens from the past ${daysBack} days`);
      const results = await this.simulateStrategyWithRealData(historicalData, strategy, backtestId);
      
      // Store backtest results
      await this.storeBacktestResults(results, strategy, timeframeHours);
      
      return results;
    } catch (error) {
      console.error("Error running backtest:", error);
      throw error;
    }
  }

  private generateRealisticDemoData(daysBack: number): HistoricalTokenData[] {
    const demoTokens: HistoricalTokenData[] = [];
    const tokensPerDay = 100; // Simulate 100 new tokens per day
    const totalTokens = daysBack * tokensPerDay;

    for (let i = 0; i < totalTokens; i++) {
      const createdAt = new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
      const tokenAddress = `demo_${i}_${Math.random().toString(36).substring(7)}`;
      
      // Generate realistic price history for first 3 minutes
      const priceHistory = this.generateTokenPriceHistory(createdAt);
      
      demoTokens.push({
        address: tokenAddress,
        name: `DemoToken${i}`,
        symbol: `DEMO${i}`,
        createdAt,
        priceHistory,
        dexSource: "demo",
      });
    }

    return demoTokens;
  }

  private generateTokenPriceHistory(createdAt: Date): Array<{
    timestamp: Date;
    price: number;
    marketCap: number;
    volume: number;
    age: number;
  }> {
    const priceHistory = [];
    const basePrice = 0.00001 + Math.random() * 0.0001; // Random starting price
    const totalSupply = 1000000000; // 1B tokens
    
    // Generate 3 minutes of data with 5-second intervals
    for (let seconds = 0; seconds < 180; seconds += 5) {
      const timestamp = new Date(createdAt.getTime() + seconds * 1000);
      
      // Simulate typical new token price behavior
      let priceMultiplier = 1;
      
      if (seconds < 30) {
        // First 30 seconds: initial pump potential
        priceMultiplier = 1 + Math.random() * 15; // 1x to 16x
      } else if (seconds < 60) {
        // Next 30 seconds: high volatility
        priceMultiplier = 0.2 + Math.random() * 8; // 0.2x to 8.2x
      } else if (seconds < 120) {
        // Next minute: continued movement
        priceMultiplier = 0.3 + Math.random() * 5; // 0.3x to 5.3x
      } else {
        // Final minute: stabilization or further movement
        priceMultiplier = 0.5 + Math.random() * 3; // 0.5x to 3.5x
      }
      
      const price = basePrice * priceMultiplier;
      const marketCap = price * totalSupply;
      const volume = Math.random() * marketCap * 0.05; // 0-5% of market cap
      
      priceHistory.push({
        timestamp,
        price,
        marketCap,
        volume,
        age: seconds,
      });
    }
    
    return priceHistory;
  }

  private async simulateStrategyWithRealData(
    historicalData: HistoricalTokenData[],
    strategy: StrategyConfig,
    backtestId: string
  ): Promise<BacktestResults> {
    const trades: BacktestTrade[] = [];
    const equityCurve: { timestamp: Date; equity: number }[] = [];
    let currentEquity = 10000; // Starting with $10,000
    let maxEquity = currentEquity;
    let maxDrawdown = 0;

    // Process each token's first 3 minutes to test the strategy
    for (const tokenData of historicalData) {
      const tokenAge = Math.floor((Date.now() - tokenData.createdAt.getTime()) / 1000 / 60);
      
      // Only consider tokens that meet our age criteria
      if (tokenAge > strategy.maxAge) continue;

      const trade = await this.simulateTokenTradeWithRealData(tokenData, strategy);
      
      if (trade) {
        trades.push(trade);
        
        // Update equity curve
        const newEquity = currentEquity + trade.pnl;
        equityCurve.push({
          timestamp: trade.exitTime,
          equity: newEquity,
        });
        
        currentEquity = newEquity;
        maxEquity = Math.max(maxEquity, currentEquity);
        
        // Calculate drawdown
        const drawdown = (maxEquity - currentEquity) / maxEquity;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    return this.calculateBacktestMetrics(trades, equityCurve, backtestId, maxDrawdown);
  }

  private async simulateTokenTradeWithRealData(
    tokenData: HistoricalTokenData,
    strategy: StrategyConfig
  ): Promise<BacktestTrade | null> {
    const priceHistory = tokenData.priceHistory;
    if (priceHistory.length === 0) return null;

    let watchTriggered = false;
    let buyExecuted = false;
    let entryPrice = 0;
    let entryTime: Date | null = null;

    // Process each price point in the token's first 3 minutes
    for (const pricePoint of priceHistory) {
      const marketCap = pricePoint.marketCap;
      const price = pricePoint.price;

      // Check if token reaches watch threshold (e.g., 10K MC)
      if (!watchTriggered && marketCap >= strategy.watchThreshold) {
        watchTriggered = true;
        continue;
      }

      // If watching, check for buy trigger (e.g., drops to 6K MC)
      if (watchTriggered && !buyExecuted && marketCap <= strategy.buyTrigger) {
        // Execute buy at configured price level (e.g., 8K MC)
        const targetMarketCap = strategy.buyPrice;
        if (marketCap <= targetMarketCap) {
          buyExecuted = true;
          entryPrice = price;
          entryTime = pricePoint.timestamp;
          continue;
        }
      }

      // If position is open, check for exit conditions
      if (buyExecuted && entryTime) {
        const currentPnlPercent = ((price - entryPrice) / entryPrice) * 100;
        
        // Take profit condition (e.g., 2x = 100% gain)
        const takeProfitPercent = (strategy.takeProfitMultiplier - 1) * 100;
        if (currentPnlPercent >= takeProfitPercent) {
          return this.createBacktestTrade(
            tokenData,
            entryPrice,
            price,
            entryTime,
            pricePoint.timestamp,
            "take_profit"
          );
        }

        // Stop loss condition (e.g., -20%)
        if (currentPnlPercent <= -strategy.stopLossPercent) {
          return this.createBacktestTrade(
            tokenData,
            entryPrice,
            price,
            entryTime,
            pricePoint.timestamp,
            "stop_loss"
          );
        }
      }
    }

    // If position is still open at end of data, close it
    if (buyExecuted && entryTime && priceHistory.length > 0) {
      const lastPrice = priceHistory[priceHistory.length - 1];
      return this.createBacktestTrade(
        tokenData,
        entryPrice,
        lastPrice.price,
        entryTime,
        lastPrice.timestamp,
        "time_exit"
      );
    }

    return null;
  }

  private createBacktestTrade(
    tokenData: HistoricalTokenData,
    entryPrice: number,
    exitPrice: number,
    entryTime: Date,
    exitTime: Date,
    exitReason: string
  ): BacktestTrade {
    const duration = (exitTime.getTime() - entryTime.getTime()) / 1000; // seconds
    const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    const positionSize = 1000; // $1000 per trade
    const pnl = (positionSize * pnlPercent) / 100;

    return {
      tokenAddress: tokenData.address,
      tokenName: tokenData.name,
      entryPrice,
      exitPrice,
      entryTime,
      exitTime,
      duration,
      pnl,
      pnlPercent,
      exitReason,
    };
  }

  private async simulateStrategy(
    tokenData: any[],
    strategy: StrategyConfig,
    backtestId: string
  ): Promise<BacktestResults> {
    const trades: BacktestTrade[] = [];
    const equityCurve: { timestamp: Date; equity: number }[] = [];
    let currentEquity = 10000; // Starting with $10,000
    let maxEquity = currentEquity;
    let maxDrawdown = 0;

    // Group tokens by time and simulate market conditions
    const timeSlots = this.groupTokensByTimeSlots(tokenData);
    
    for (const [timestamp, tokens] of timeSlots) {
      // Check each token against our strategy
      for (const tokenHistory of tokens) {
        const trade = await this.simulateTokenTrade(tokenHistory, strategy, backtestId);
        if (trade) {
          trades.push(trade);
          currentEquity += trade.pnl;
          
          // Update max drawdown
          if (currentEquity > maxEquity) {
            maxEquity = currentEquity;
          }
          const drawdown = (maxEquity - currentEquity) / maxEquity * 100;
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
          }
        }
      }
      
      equityCurve.push({ timestamp: new Date(timestamp), equity: currentEquity });
    }

    return this.calculateBacktestMetrics(trades, equityCurve, backtestId, maxDrawdown);
  }

  private async simulateTokenTrade(
    tokenHistory: any,
    strategy: StrategyConfig,
    backtestId: string
  ): Promise<BacktestTrade | null> {
    // Check if token meets our criteria
    const tokenAge = this.calculateTokenAge(tokenHistory.createdAt);
    if (tokenAge > strategy.maxAge * 60) return null; // Convert minutes to seconds

    // Check if token reached watch threshold
    if (tokenHistory.marketCap < strategy.watchThreshold) return null;

    // Simulate price movement and check if it triggered our buy condition
    const priceHistory = this.simulatePriceMovement(tokenHistory);
    
    let entryPrice: number | null = null;
    let entryTime: Date | null = null;
    let exitPrice: number | null = null;
    let exitTime: Date | null = null;
    let exitReason = "";

    // Check for buy trigger
    for (let i = 0; i < priceHistory.length; i++) {
      const { price, marketCap, timestamp } = priceHistory[i];
      
      // Check buy condition
      if (!entryPrice && marketCap <= strategy.buyTrigger && marketCap >= strategy.buyPrice * 0.9) {
        entryPrice = strategy.buyPrice;
        entryTime = timestamp;
        continue;
      }

      // If we have a position, check exit conditions
      if (entryPrice && entryTime) {
        const takeProfitPrice = entryPrice * strategy.takeProfitMultiplier;
        const stopLossPrice = entryPrice * (1 - strategy.stopLossPercent / 100);

        if (price >= takeProfitPrice) {
          exitPrice = takeProfitPrice;
          exitTime = timestamp;
          exitReason = "take_profit";
          break;
        } else if (price <= stopLossPrice) {
          exitPrice = stopLossPrice;
          exitTime = timestamp;
          exitReason = "stop_loss";
          break;
        }
      }
    }

    // If we entered but didn't exit, assume we exit at the end
    if (entryPrice && entryTime && !exitPrice) {
      exitPrice = priceHistory[priceHistory.length - 1]?.price || entryPrice;
      exitTime = priceHistory[priceHistory.length - 1]?.timestamp || new Date();
      exitReason = "timeout";
    }

    if (entryPrice && exitPrice && entryTime && exitTime) {
      const quantity = strategy.positionSize / entryPrice;
      const pnl = (exitPrice - entryPrice) * quantity;
      const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
      const duration = Math.floor((exitTime.getTime() - entryTime.getTime()) / 1000);

      // Store the trade in database
      await storage.createTrade({
        tokenId: null,
        tokenAddress: tokenHistory.address,
        tokenName: tokenHistory.name,
        entryPrice,
        exitPrice,
        quantity,
        entryTime,
        exitTime,
        duration,
        pnl,
        pnlPercent,
        exitReason,
        isBacktest: true,
        backtestId,
      });

      return {
        tokenAddress: tokenHistory.address,
        tokenName: tokenHistory.name,
        entryPrice,
        exitPrice,
        entryTime,
        exitTime,
        duration,
        pnl,
        pnlPercent,
        exitReason,
      };
    }

    return null;
  }

  private simulatePriceMovement(tokenData: any): Array<{
    price: number;
    marketCap: number;
    timestamp: Date;
  }> {
    const movements = [];
    let currentPrice = tokenData.price;
    let currentMarketCap = tokenData.marketCap;
    const startTime = new Date(tokenData.createdAt);

    // Simulate 10 minutes of price movement with 30-second intervals
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(startTime.getTime() + i * 30000); // 30 seconds apart
      
      // Add some realistic volatility (±15% per interval)
      const volatility = (Math.random() - 0.5) * 0.3; // ±15%
      currentPrice *= (1 + volatility);
      currentMarketCap = this.calculateMarketCap(currentPrice, tokenData.address);

      movements.push({
        price: currentPrice,
        marketCap: currentMarketCap,
        timestamp,
      });
    }

    return movements;
  }

  private groupTokensByTimeSlots(tokenData: any[]): Map<number, any[]> {
    const timeSlots = new Map<number, any[]>();
    
    for (const token of tokenData) {
      const hourSlot = Math.floor(new Date(token.createdAt).getTime() / (1000 * 60 * 60)); // Group by hour
      
      if (!timeSlots.has(hourSlot)) {
        timeSlots.set(hourSlot, []);
      }
      timeSlots.get(hourSlot)!.push(token);
    }

    return timeSlots;
  }

  private calculateBacktestMetrics(
    trades: BacktestTrade[],
    equityCurve: { timestamp: Date; equity: number }[],
    backtestId: string,
    maxDrawdown: number
  ): BacktestResults {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgTrade = totalTrades > 0 ? totalPnL / totalTrades : 0;

    // Calculate Sharpe ratio (simplified)
    const returns = trades.map(t => t.pnlPercent / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length || 0;
    const returnStdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length || 1
    );
    const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0; // Annualized

    return {
      backtestId,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnL,
      maxDrawdown,
      avgTrade,
      sharpeRatio,
      trades,
      equityCurve,
    };
  }

  private async storeBacktestResults(
    results: BacktestResults,
    strategy: StrategyConfig,
    timeframeHours: number
  ): Promise<void> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeframeHours * 60 * 60 * 1000);

    await storage.createBacktestResult({
      backtestId: results.backtestId,
      parameters: strategy as any,
      timeframe: `${timeframeHours}h`,
      totalTrades: results.totalTrades,
      winningTrades: results.winningTrades,
      losingTrades: results.losingTrades,
      winRate: results.winRate,
      totalPnL: results.totalPnL,
      maxDrawdown: results.maxDrawdown,
      avgTrade: results.avgTrade,
      sharpeRatio: results.sharpeRatio,
      startTime,
      endTime,
    });
  }

  private generateSampleTokenData(timeframeHours: number): any[] {
    const tokens = [];
    const now = new Date();
    const startTime = new Date(now.getTime() - timeframeHours * 60 * 60 * 1000);

    // Generate sample tokens for demonstration
    const tokenNames = [
      "MoonRocket", "SafeDoge", "ElonMars", "PumpCoin", "DiamondHands",
      "ToTheMoon", "RocketFuel", "CryptoGem", "MemeToken", "LuckyShiba",
      "GoldenPump", "StarDust", "CosmicCoin", "NebulaDoge", "GalaxyToken"
    ];

    for (let i = 0; i < 50; i++) {
      const createdAt = new Date(
        startTime.getTime() + Math.random() * (now.getTime() - startTime.getTime())
      );
      
      const basePrice = Math.random() * 0.001 + 0.000001; // Random price between 0.000001 and 0.001001
      const supply = Math.random() * 900000000 + 100000000; // Random supply between 100M and 1B
      const marketCap = basePrice * supply;

      tokens.push({
        address: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 6)}`,
        name: tokenNames[Math.floor(Math.random() * tokenNames.length)],
        symbol: tokenNames[Math.floor(Math.random() * tokenNames.length)].substring(0, 4).toUpperCase(),
        price: basePrice,
        marketCap: marketCap,
        volume24h: Math.random() * 10000 + 1000,
        createdAt: createdAt,
        dexSource: "pumpfun",
      });
    }

    return tokens;
  }

  private calculateTokenAge(createdAt: Date): number {
    return Math.floor((Date.now() - createdAt.getTime()) / 1000);
  }

  private calculateMarketCap(price: number, tokenAddress: string): number {
    // Simplified calculation - in reality, you'd get actual supply from blockchain
    return price * 1000000; // Assuming 1M token supply
  }

  async getBacktestHistory(): Promise<BacktestResult[]> {
    return await storage.getAllBacktestResults();
  }

  async getBacktestTrades(backtestId: string): Promise<any[]> {
    return await storage.getTradesByBacktestId(backtestId);
  }
}

export const backtestingService = new BacktestingService();
