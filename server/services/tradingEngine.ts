import { storage } from "../storage";
import { dexApiService } from "./dexApi";
import { solanaService } from "./solana";
import type { Token, StrategyConfig, InsertTrade, InsertAlert } from "@shared/schema";

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
      const newTokens = await dexApiService.getNewTokensFromPumpFun(params.maxAge);
      
      for (const tokenData of newTokens) {
        const existingToken = await storage.getTokenByAddress(tokenData.address);
        if (existingToken) continue;

        // Check if token meets watch threshold
        if (tokenData.marketCap >= params.watchThreshold) {
          await storage.createToken({
            address: tokenData.address,
            name: tokenData.name,
            symbol: tokenData.symbol,
            marketCap: tokenData.marketCap,
            price: tokenData.price,
            volume24h: tokenData.volume24h,
            age: this.calculateTokenAge(tokenData.createdAt),
            status: "watching",
            dexSource: tokenData.dexSource,
          });

          await this.createAlert({
            type: "info",
            message: `New token added to watchlist: ${tokenData.name} (${tokenData.symbol})`,
            tokenAddress: tokenData.address,
          });
        }
      }
    } catch (error) {
      console.error("Error checking for new tokens:", error);
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
