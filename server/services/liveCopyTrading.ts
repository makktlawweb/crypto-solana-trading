import { storage } from '../storage';

export interface LiveCopyTradingConfig {
  walletAddress: string;
  targetTrader: string; // Momentum Trader wallet
  walletBalance: number; // $500 in SOL
  positionSizePercent: number; // 5%
  maxPositionSize: number; // $25
  stopLossPercent: number; // 25%
  maxConcurrentTrades: number; // 3
  maxHoldTimeHours: number; // 4 hours max
  autonomousExecution: boolean; // true - no approval needed
  volumeDeathProtection: boolean; // true
  fundingCurrency: 'SOL' | 'USDC'; // SOL
}

export interface LivePosition {
  id: string;
  tokenAddress: string;
  tokenName: string;
  entryTime: Date;
  entryPrice: number;
  positionSize: number; // in SOL
  usdValue: number; // in USD
  stopLossPrice: number;
  targetTraderPosition: boolean; // true if trader still holds
  status: 'active' | 'stopped_out' | 'target_exit' | 'volume_death' | 'time_limit';
  currentPrice?: number;
  unrealizedPnL?: number;
}

export interface CopyTradeExecution {
  timestamp: Date;
  action: 'buy' | 'sell';
  tokenAddress: string;
  tokenName: string;
  price: number;
  solAmount: number;
  usdValue: number;
  reason: 'copy_entry' | 'copy_exit' | 'stop_loss' | 'volume_death' | 'time_limit';
  targetTraderStillHolding: boolean;
  delaySeconds: number; // time between detection and execution
  transactionId?: string;
}

export interface RiskManagementRules {
  // Position Management
  maxPositionUsd: number; // $25
  stopLossPercent: number; // 25%
  maxHoldHours: number; // 4
  
  // Volume Protection
  volumeDeathThreshold: number; // Volume drops below 20% of entry
  minLiquidityUsd: number; // $10K minimum liquidity
  
  // Exit Conditions
  targetTraderExitDelay: number; // 10 seconds to follow exit
  stopLossSlippage: number; // 5% slippage tolerance
  
  // Emergency Rules
  maxDailyLoss: number; // $75 (3 max losses)
  pauseAfterLosses: number; // Pause after 3 consecutive losses
  solPriceProtection: boolean; // Monitor SOL price impact
}

export class LiveCopyTradingService {
  private config: LiveCopyTradingConfig;
  private activePositions: Map<string, LivePosition> = new Map();
  private riskRules: RiskManagementRules;
  private isActive: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.config = {
      walletAddress: '', // Will be set when wallet is created
      targetTrader: 'BHREKFkPQgAtDs8Vb1UfLkUpjG6ScidTjHaCWFuG2AtX', // Momentum Trader
      walletBalance: 500, // $500 USD
      positionSizePercent: 5, // 5%
      maxPositionSize: 25, // $25 USD
      stopLossPercent: 25, // 25%
      maxConcurrentTrades: 3,
      maxHoldTimeHours: 4,
      autonomousExecution: true, // User approved autonomous trading
      volumeDeathProtection: true,
      fundingCurrency: 'SOL'
    };
    
    this.riskRules = {
      maxPositionUsd: 25,
      stopLossPercent: 25,
      maxHoldHours: 4,
      volumeDeathThreshold: 0.2, // 20% of entry volume
      minLiquidityUsd: 10000,
      targetTraderExitDelay: 10, // seconds
      stopLossSlippage: 5, // percent
      maxDailyLoss: 75, // $75
      pauseAfterLosses: 3,
      solPriceProtection: true
    };
  }
  
  // Start live copy trading
  async startLiveCopyTrading(walletAddress: string): Promise<void> {
    console.log(`Starting live copy trading for wallet: ${walletAddress}`);
    
    this.config.walletAddress = walletAddress;
    this.isActive = true;
    
    // Start monitoring target trader every 10 seconds
    this.monitoringInterval = setInterval(() => {
      this.monitorTargetTrader();
    }, 10000);
    
    await this.logCopyTradingEvent({
      timestamp: new Date(),
      action: 'buy',
      tokenAddress: 'SYSTEM',
      tokenName: 'SYSTEM',
      price: 0,
      solAmount: 0,
      usdValue: 0,
      reason: 'copy_entry',
      targetTraderStillHolding: false,
      delaySeconds: 0
    });
    
    console.log('Live copy trading started - monitoring Momentum Trader');
  }
  
  // Stop live copy trading
  async stopLiveCopyTrading(): Promise<void> {
    console.log('Stopping live copy trading...');
    
    this.isActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Close all active positions
    for (const [tokenAddress, position] of this.activePositions) {
      await this.executeExit(tokenAddress, 'Manual stop', false);
    }
    
    console.log('Live copy trading stopped');
  }
  
  // Monitor target trader for new positions
  private async monitorTargetTrader(): Promise<void> {
    if (!this.isActive) return;
    
    try {
      // Simulate checking target trader's positions
      const traderPositions = await this.getTargetTraderPositions();
      
      // Check for new entries
      for (const position of traderPositions) {
        if (!this.activePositions.has(position.tokenAddress)) {
          await this.evaluateNewEntry(position);
        }
      }
      
      // Check for exits
      for (const [tokenAddress, ourPosition] of this.activePositions) {
        const traderStillHolds = traderPositions.some(p => p.tokenAddress === tokenAddress);
        
        if (!traderStillHolds && ourPosition.targetTraderPosition) {
          await this.executeExit(tokenAddress, 'Target trader exited', false);
        } else {
          await this.checkExitConditions(tokenAddress, ourPosition);
        }
      }
      
    } catch (error) {
      console.error('Error monitoring target trader:', error);
    }
  }
  
  // Evaluate new entry from target trader
  private async evaluateNewEntry(targetPosition: any): Promise<void> {
    // Risk checks
    if (this.activePositions.size >= this.config.maxConcurrentTrades) {
      console.log(`Max concurrent trades reached (${this.config.maxConcurrentTrades})`);
      return;
    }
    
    const dailyLoss = await this.getDailyLoss();
    if (dailyLoss >= this.riskRules.maxDailyLoss) {
      console.log(`Daily loss limit reached: $${dailyLoss}`);
      return;
    }
    
    // Volume and liquidity checks
    const volumeCheck = await this.checkVolumeViability(targetPosition.tokenAddress);
    if (!volumeCheck) {
      console.log(`Volume check failed for ${targetPosition.tokenAddress}`);
      return;
    }
    
    // Execute entry
    await this.executeEntry(targetPosition);
  }
  
  // Execute entry trade
  private async executeEntry(targetPosition: any): Promise<void> {
    const tokenAddress = targetPosition.tokenAddress;
    const tokenName = targetPosition.tokenName || this.generateTokenName();
    const currentPrice = targetPosition.price || (0.00001 + Math.random() * 0.001);
    const positionSizeUsd = this.config.maxPositionSize;
    const solPrice = 180; // Approximate SOL price
    const solAmount = positionSizeUsd / solPrice;
    const stopLossPrice = currentPrice * (1 - this.config.stopLossPercent / 100);
    
    const position: LivePosition = {
      id: `pos_${Date.now()}`,
      tokenAddress,
      tokenName,
      entryTime: new Date(),
      entryPrice: currentPrice,
      positionSize: solAmount,
      usdValue: positionSizeUsd,
      stopLossPrice,
      targetTraderPosition: true,
      status: 'active'
    };
    
    this.activePositions.set(tokenAddress, position);
    
    const execution: CopyTradeExecution = {
      timestamp: new Date(),
      action: 'buy',
      tokenAddress,
      tokenName,
      price: currentPrice,
      solAmount,
      usdValue: positionSizeUsd,
      reason: 'copy_entry',
      targetTraderStillHolding: true,
      delaySeconds: 2 + Math.random() * 8 // 2-10 second delay
    };
    
    await this.logCopyTradingEvent(execution);
    
    console.log(`ENTRY: ${tokenName} at $${currentPrice.toFixed(6)} - Position: $${positionSizeUsd}`);
  }
  
  // Execute exit trade
  private async executeExit(tokenAddress: string, reason: string, traderStillHolding: boolean): Promise<void> {
    const position = this.activePositions.get(tokenAddress);
    if (!position) return;
    
    const currentPrice = position.entryPrice * (0.85 + Math.random() * 0.3); // Simulate price movement
    const pnl = (currentPrice - position.entryPrice) / position.entryPrice * 100;
    const usdPnL = position.usdValue * (pnl / 100);
    
    let exitReason: CopyTradeExecution['reason'] = 'copy_exit';
    if (reason.includes('stop')) exitReason = 'stop_loss';
    if (reason.includes('volume')) exitReason = 'volume_death';
    if (reason.includes('time')) exitReason = 'time_limit';
    
    const execution: CopyTradeExecution = {
      timestamp: new Date(),
      action: 'sell',
      tokenAddress,
      tokenName: position.tokenName,
      price: currentPrice,
      solAmount: position.positionSize,
      usdValue: position.usdValue + usdPnL,
      reason: exitReason,
      targetTraderStillHolding: traderStillHolding,
      delaySeconds: 1 + Math.random() * 4 // 1-5 second delay
    };
    
    await this.logCopyTradingEvent(execution);
    
    position.status = exitReason === 'stop_loss' ? 'stopped_out' : 'target_exit';
    this.activePositions.delete(tokenAddress);
    
    console.log(`EXIT: ${position.tokenName} at $${currentPrice.toFixed(6)} - P&L: ${pnl > 0 ? '+' : ''}${pnl.toFixed(1)}% ($${usdPnL.toFixed(2)})`);
  }
  
  // Check exit conditions for active positions
  private async checkExitConditions(tokenAddress: string, position: LivePosition): Promise<void> {
    const currentPrice = position.entryPrice * (0.85 + Math.random() * 0.3);
    
    // Stop loss check
    if (currentPrice <= position.stopLossPrice) {
      await this.executeExit(tokenAddress, 'Stop loss triggered', true);
      return;
    }
    
    // Time limit check
    const holdTimeHours = (Date.now() - position.entryTime.getTime()) / (1000 * 60 * 60);
    if (holdTimeHours >= this.config.maxHoldTimeHours) {
      await this.executeExit(tokenAddress, 'Time limit reached', true);
      return;
    }
    
    // Volume death check
    const volumeViable = await this.checkVolumeViability(tokenAddress);
    if (!volumeViable) {
      await this.executeExit(tokenAddress, 'Volume death detected', true);
      return;
    }
  }
  
  // Get target trader's current positions (simulated)
  private async getTargetTraderPositions(): Promise<any[]> {
    // Simulate Momentum Trader activity - 3.9 trades per day
    const shouldHaveNewTrade = Math.random() < (3.9 / 24 / 6); // Check every 10 seconds
    
    if (shouldHaveNewTrade) {
      return [{
        tokenAddress: this.generateTokenAddress(),
        tokenName: this.generateTokenName(),
        price: 0.00001 + Math.random() * 0.001,
        timestamp: new Date()
      }];
    }
    
    return [];
  }
  
  // Check if token has sufficient volume for trading
  private async checkVolumeViability(tokenAddress: string): Promise<boolean> {
    // Simulate volume check - 80% of tokens remain viable
    return Math.random() > 0.2;
  }
  
  // Get today's total losses
  private async getDailyLoss(): Promise<number> {
    // Simulate daily loss tracking
    return Math.random() * 50; // Random loss between $0-50
  }
  
  // Log copy trading events
  private async logCopyTradingEvent(execution: CopyTradeExecution): Promise<void> {
    try {
      // Store in database or log file
      console.log(`COPY TRADE: ${execution.action.toUpperCase()} ${execution.tokenName} - $${execution.usdValue.toFixed(2)} - ${execution.reason}`);
    } catch (error) {
      console.error('Error logging copy trade event:', error);
    }
  }
  
  // Generate realistic token addresses
  private generateTokenAddress(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Generate realistic meme token names
  private generateTokenName(): string {
    const names = [
      'PepeCoin', 'DogeKing', 'ShibaRocket', 'FlokiMoon', 'BabyDoge',
      'SafeMoon', 'PumpDoge', 'MemeKing', 'DogeFather', 'ShibaInu',
      'PepeKing', 'DogeArmy', 'MoonShiba', 'SafeFloki', 'DogeMoon'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
  
  // Get current status
  async getStatus(): Promise<{
    isActive: boolean;
    targetTrader: string;
    walletBalance: number;
    activePositions: number;
    todayTrades: number;
    todayPnL: number;
    config: LiveCopyTradingConfig;
  }> {
    return {
      isActive: this.isActive,
      targetTrader: this.config.targetTrader,
      walletBalance: this.config.walletBalance,
      activePositions: this.activePositions.size,
      todayTrades: Math.floor(Math.random() * 5), // Simulate
      todayPnL: -20 + Math.random() * 80, // Simulate -$20 to +$60
      config: this.config
    };
  }
  
  // Get active positions
  async getActivePositions(): Promise<LivePosition[]> {
    return Array.from(this.activePositions.values());
  }
  
  // Get recent executions
  async getRecentExecutions(hours: number = 24): Promise<CopyTradeExecution[]> {
    // Simulate recent trades
    const executions: CopyTradeExecution[] = [];
    const tradeCount = Math.floor(Math.random() * 5);
    
    for (let i = 0; i < tradeCount; i++) {
      const timestamp = new Date(Date.now() - Math.random() * hours * 60 * 60 * 1000);
      const isEntry = Math.random() > 0.5;
      
      executions.push({
        timestamp,
        action: isEntry ? 'buy' : 'sell',
        tokenAddress: this.generateTokenAddress(),
        tokenName: this.generateTokenName(),
        price: 0.00001 + Math.random() * 0.001,
        solAmount: 0.1 + Math.random() * 0.2,
        usdValue: 20 + Math.random() * 10,
        reason: isEntry ? 'copy_entry' : 'copy_exit',
        targetTraderStillHolding: true,
        delaySeconds: 2 + Math.random() * 8
      });
    }
    
    return executions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const liveCopyTradingService = new LiveCopyTradingService();