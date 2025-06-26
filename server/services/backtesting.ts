import { storage } from "../storage";
import { dexApiService } from "./dexApi";
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
      // Get historical token data
      const historicalTokens = await dexApiService.getHistoricalTokenData(timeframeHours);
      
      if (historicalTokens.length === 0) {
        // If no historical data available, generate some realistic sample data for demonstration
        const sampleTokens = this.generateSampleTokenData(timeframeHours);
        return await this.simulateStrategy(sampleTokens, strategy, backtestId);
      }

      const results = await this.simulateStrategy(historicalTokens, strategy, backtestId);
      
      // Store backtest results
      await this.storeBacktestResults(results, strategy, timeframeHours);
      
      return results;
    } catch (error) {
      console.error("Error running backtest:", error);
      throw error;
    }
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
