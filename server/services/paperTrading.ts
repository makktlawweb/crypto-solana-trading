import { storage } from "../storage";
import { copyTradingService } from "./copyTrading";
import { riskManagementService } from "./riskManagement";

export interface PaperTrade {
  id: string;
  tokenAddress: string;
  tokenName: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  entryTime: Date;
  lastUpdateTime: Date;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  status: 'open' | 'closed';
  exitPrice?: number;
  exitTime?: Date;
  exitReason?: string;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  holdTimeSeconds: number;
  copyFromWallet: string;
  executionDelay: number; // milliseconds from signal to execution
  volumeAtEntry: number;
  volumeAtExit?: number;
  marketCapAtEntry: number;
  marketCapAtExit?: number;
}

export interface PaperTradingStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  netPnL: number;
  avgWinPercent: number;
  avgLossPercent: number;
  avgHoldTime: number;
  largestWin: number;
  largestLoss: number;
  avgExecutionDelay: number;
  successfulCopies: number;
  missedCopies: number;
  copySuccessRate: number;
}

export class PaperTradingService {
  private paperTrades: Map<string, PaperTrade> = new Map();
  private isActive: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private paperBalance: number = 10000; // $10K starting balance
  private maxPositionPercent: number = 5; // 5% max position size
  private executionDelayMs: number = 2000; // 2 second delay to simulate real execution

  constructor() {
    // Load existing paper trades from storage if any
    this.loadPaperTrades();
  }

  async startPaperTrading(walletAddress: string): Promise<void> {
    console.log(`Starting paper trading for wallet: ${walletAddress}`);
    
    if (this.isActive) {
      console.log("Paper trading already active");
      return;
    }

    this.isActive = true;
    
    // Monitor copy trading signals
    copyTradingService.startMonitoring();
    
    // Subscribe to copy trading signals
    this.subscribeToSignals();
    
    // Start price update loop
    this.startPriceUpdates();
    
    // Store paper trading session
    await storage.createAlert({
      type: 'paper_trading',
      message: `Paper trading started for wallet ${walletAddress}`,
      isRead: false
    });
  }

  async stopPaperTrading(): Promise<void> {
    console.log("Stopping paper trading");
    
    this.isActive = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Close all open positions
    await this.closeAllPositions("session_ended");
    
    // Generate final report
    const stats = this.calculateStats();
    
    await storage.createAlert({
      type: 'paper_trading',
      message: `Paper trading stopped. Final P&L: $${stats.netPnL.toFixed(2)} (${stats.winRate.toFixed(1)}% win rate)`,
      isRead: false
    });
  }

  private subscribeToSignals(): void {
    // This would be a real event subscription in production
    // For now, we'll simulate by checking signals periodically
    setInterval(() => {
      if (!this.isActive) return;
      
      const signals = copyTradingService.getRecentSignals();
      
      for (const signal of signals) {
        if (signal.timestamp.getTime() > Date.now() - 10000) { // Last 10 seconds
          this.processSignal(signal);
        }
      }
    }, 1000); // Check every second
  }

  private async processSignal(signal: any): Promise<void> {
    try {
      // Simulate execution delay (real-world latency)
      await new Promise(resolve => setTimeout(resolve, this.executionDelayMs));
      
      if (signal.action === 'buy') {
        await this.executePaperBuy(signal);
      } else if (signal.action === 'sell') {
        await this.executePaperSell(signal);
      }
    } catch (error) {
      console.error("Error processing paper trading signal:", error);
    }
  }

  private async executePaperBuy(signal: any): Promise<void> {
    const positionSize = this.paperBalance * (this.maxPositionPercent / 100);
    const quantity = positionSize / signal.price;
    
    // Get current token data
    const token = await storage.getTokenByAddress(signal.tokenAddress);
    if (!token) {
      console.log(`Token not found for paper buy: ${signal.tokenAddress}`);
      return;
    }

    const tradeId = `paper_${Date.now()}_${signal.tokenAddress}`;
    
    const paperTrade: PaperTrade = {
      id: tradeId,
      tokenAddress: signal.tokenAddress,
      tokenName: token.name,
      entryPrice: signal.price,
      currentPrice: signal.price,
      quantity: quantity,
      entryTime: new Date(),
      lastUpdateTime: new Date(),
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      status: 'open',
      holdTimeSeconds: 0,
      copyFromWallet: signal.walletAddress,
      executionDelay: this.executionDelayMs,
      volumeAtEntry: token.volume24h,
      marketCapAtEntry: token.marketCap
    };

    this.paperTrades.set(tradeId, paperTrade);
    
    // Reduce paper balance
    this.paperBalance -= positionSize;
    
    console.log(`Paper BUY executed: ${token.name} at $${signal.price} (${quantity.toFixed(4)} tokens)`);
    
    // Store as paper trade in database
    await storage.createTrade({
      tokenAddress: signal.tokenAddress,
      tokenName: token.name,
      entryPrice: signal.price,
      quantity: quantity,
      entryTime: new Date(),
      backtestId: 'paper_trading',
      isBacktest: true
    });
  }

  private async executePaperSell(signal: any): Promise<void> {
    // Find matching open position
    const openTrade = Array.from(this.paperTrades.values()).find(
      trade => trade.tokenAddress === signal.tokenAddress && trade.status === 'open'
    );
    
    if (!openTrade) {
      console.log(`No open paper position found for: ${signal.tokenAddress}`);
      return;
    }

    // Calculate realized P&L
    const exitValue = openTrade.quantity * signal.price;
    const entryValue = openTrade.quantity * openTrade.entryPrice;
    const realizedPnL = exitValue - entryValue;
    const realizedPnLPercent = (realizedPnL / entryValue) * 100;
    
    // Update trade
    openTrade.status = 'closed';
    openTrade.exitPrice = signal.price;
    openTrade.exitTime = new Date();
    openTrade.exitReason = signal.reasoning || 'copy_signal';
    openTrade.realizedPnL = realizedPnL;
    openTrade.realizedPnLPercent = realizedPnLPercent;
    openTrade.holdTimeSeconds = (Date.now() - openTrade.entryTime.getTime()) / 1000;
    
    // Add exit value back to balance
    this.paperBalance += exitValue;
    
    console.log(`Paper SELL executed: ${openTrade.tokenName} at $${signal.price} | P&L: $${realizedPnL.toFixed(2)} (${realizedPnLPercent.toFixed(1)}%)`);
    
    // Update database record
    const dbTrades = await storage.getTradesByBacktestId('paper_trading');
    const matchingTrade = dbTrades.find(t => t.tokenAddress === signal.tokenAddress && !t.exitTime);
    
    if (matchingTrade) {
      await storage.updateTrade(matchingTrade.id, {
        exitPrice: signal.price,
        exitTime: new Date(),
        exitReason: signal.reasoning || 'copy_signal'
      });
    }
  }

  private startPriceUpdates(): void {
    this.updateInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      await this.updateOpenPositions();
    }, 5000); // Update every 5 seconds
  }

  private async updateOpenPositions(): Promise<void> {
    const openTrades = Array.from(this.paperTrades.values()).filter(trade => trade.status === 'open');
    
    for (const trade of openTrades) {
      try {
        // Get current token price
        const token = await storage.getTokenByAddress(trade.tokenAddress);
        if (!token) continue;
        
        // Update current price and P&L
        trade.currentPrice = token.marketCap / 1000; // Simplified price calculation
        trade.lastUpdateTime = new Date();
        trade.holdTimeSeconds = (Date.now() - trade.entryTime.getTime()) / 1000;
        
        const currentValue = trade.quantity * trade.currentPrice;
        const entryValue = trade.quantity * trade.entryPrice;
        trade.unrealizedPnL = currentValue - entryValue;
        trade.unrealizedPnLPercent = (trade.unrealizedPnL / entryValue) * 100;
        
        // Check for risk management exit signals
        const riskProfile = await riskManagementService.analyzeWalletRiskProfile(trade.copyFromWallet);
        const badTradeSignal = await riskManagementService.detectBadTrade(
          trade.tokenAddress,
          trade.marketCapAtEntry,
          trade.entryTime,
          riskProfile
        );
        
        if (badTradeSignal && badTradeSignal.recommendedAction === 'full_exit') {
          await this.forceExitPosition(trade, badTradeSignal.reasoning);
        }
        
      } catch (error) {
        console.error(`Error updating position ${trade.id}:`, error);
      }
    }
  }

  private async forceExitPosition(trade: PaperTrade, reason: string): Promise<void> {
    // Simulate selling at current market price
    const exitValue = trade.quantity * trade.currentPrice;
    const entryValue = trade.quantity * trade.entryPrice;
    const realizedPnL = exitValue - entryValue;
    const realizedPnLPercent = (realizedPnL / entryValue) * 100;
    
    trade.status = 'closed';
    trade.exitPrice = trade.currentPrice;
    trade.exitTime = new Date();
    trade.exitReason = reason;
    trade.realizedPnL = realizedPnL;
    trade.realizedPnLPercent = realizedPnLPercent;
    
    // Add exit value back to balance
    this.paperBalance += exitValue;
    
    console.log(`Risk management exit: ${trade.tokenName} | Reason: ${reason} | P&L: $${realizedPnL.toFixed(2)}`);
    
    // Update database
    const dbTrades = await storage.getTradesByBacktestId('paper_trading');
    const matchingTrade = dbTrades.find(t => t.tokenAddress === trade.tokenAddress && !t.exitTime);
    
    if (matchingTrade) {
      await storage.updateTrade(matchingTrade.id, {
        exitPrice: trade.currentPrice,
        exitTime: new Date(),
        exitReason: reason
      });
    }
  }

  private async closeAllPositions(reason: string): Promise<void> {
    const openTrades = Array.from(this.paperTrades.values()).filter(trade => trade.status === 'open');
    
    for (const trade of openTrades) {
      await this.forceExitPosition(trade, reason);
    }
  }

  calculateStats(): PaperTradingStats {
    const allTrades = Array.from(this.paperTrades.values());
    const closedTrades = allTrades.filter(t => t.status === 'closed');
    const openTrades = allTrades.filter(t => t.status === 'open');
    
    const winningTrades = closedTrades.filter(t => (t.realizedPnL || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.realizedPnL || 0) < 0);
    
    const totalRealizedPnL = closedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
    const totalUnrealizedPnL = openTrades.reduce((sum, t) => sum + t.unrealizedPnL, 0);
    
    const avgWinPercent = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.realizedPnLPercent || 0), 0) / winningTrades.length 
      : 0;
    
    const avgLossPercent = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + (t.realizedPnLPercent || 0), 0) / losingTrades.length 
      : 0;
    
    const avgHoldTime = closedTrades.length > 0 
      ? closedTrades.reduce((sum, t) => sum + t.holdTimeSeconds, 0) / closedTrades.length 
      : 0;
    
    const avgExecutionDelay = allTrades.length > 0 
      ? allTrades.reduce((sum, t) => sum + t.executionDelay, 0) / allTrades.length 
      : 0;

    return {
      totalTrades: allTrades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      totalRealizedPnL: totalRealizedPnL,
      totalUnrealizedPnL: totalUnrealizedPnL,
      netPnL: totalRealizedPnL + totalUnrealizedPnL,
      avgWinPercent: avgWinPercent,
      avgLossPercent: Math.abs(avgLossPercent),
      avgHoldTime: avgHoldTime,
      largestWin: Math.max(...closedTrades.map(t => t.realizedPnL || 0), 0),
      largestLoss: Math.min(...closedTrades.map(t => t.realizedPnL || 0), 0),
      avgExecutionDelay: avgExecutionDelay,
      successfulCopies: allTrades.length, // All trades are successful copies for now
      missedCopies: 0, // We'll track this in real implementation
      copySuccessRate: 100
    };
  }

  getOpenPositions(): PaperTrade[] {
    return Array.from(this.paperTrades.values()).filter(trade => trade.status === 'open');
  }

  getClosedPositions(): PaperTrade[] {
    return Array.from(this.paperTrades.values()).filter(trade => trade.status === 'closed');
  }

  getAllPositions(): PaperTrade[] {
    return Array.from(this.paperTrades.values());
  }

  getCurrentBalance(): number {
    return this.paperBalance;
  }

  getPortfolioValue(): number {
    const openPositionsValue = this.getOpenPositions().reduce((sum, trade) => {
      return sum + (trade.quantity * trade.currentPrice);
    }, 0);
    
    return this.paperBalance + openPositionsValue;
  }

  private async loadPaperTrades(): Promise<void> {
    // In a real implementation, we'd load from database
    // For now, start fresh each session
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}

export const paperTradingService = new PaperTradingService();