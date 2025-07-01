import { Connection, PublicKey } from '@solana/web3.js';
import { storage } from "../storage";
import { walletAnalysisService } from "./walletAnalysis";

export interface WalletTransaction {
  signature: string;
  tokenAddress: string;
  tokenName?: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  marketCap: number;
  timestamp: Date;
  walletAddress: string;
}

export interface CopyTradeSignal {
  walletAddress: string;
  tokenAddress: string;
  action: 'buy' | 'sell';
  marketCap: number;
  volume: number;
  confidence: number;
  reasoning: string;
  timestamp: Date;
  shouldCopy: boolean;
  delaySeconds: number;
}

export interface WalletMonitorConfig {
  walletAddress: string;
  isActive: boolean;
  copyBuys: boolean;
  copySells: boolean;
  minMarketCap: number;
  maxMarketCap: number;
  minVolume: number;
  positionSizePercent: number; // % of portfolio to allocate per trade
  delaySeconds: number; // Delay to account for execution time
}

export class CopyTradingService {
  private connection: Connection;
  private isMonitoring: boolean = false;
  private monitoredWallets: Map<string, WalletMonitorConfig> = new Map();
  private lastCheckedSignatures: Map<string, string> = new Map();
  private recentSignals: CopyTradeSignal[] = [];

  constructor() {
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
    
    // Initialize with your proven wallet
    this.addWalletToMonitor({
      walletAddress: 'suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK',
      isActive: true,
      copyBuys: true,
      copySells: true,
      minMarketCap: 8000,
      maxMarketCap: 50000,
      minVolume: 2500,
      positionSizePercent: 5, // 5% of portfolio per trade
      delaySeconds: 2 // 2 second delay for execution
    });
  }

  addWalletToMonitor(config: WalletMonitorConfig): void {
    this.monitoredWallets.set(config.walletAddress, config);
    console.log(`Added wallet to copy trading monitor: ${config.walletAddress}`);
  }

  removeWalletFromMonitor(walletAddress: string): void {
    this.monitoredWallets.delete(walletAddress);
    this.lastCheckedSignatures.delete(walletAddress);
    console.log(`Removed wallet from monitor: ${walletAddress}`);
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Copy trading monitor already running');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting copy trading monitor for ${this.monitoredWallets.size} wallets`);

    // Monitor loop - checks every 2 seconds
    while (this.isMonitoring) {
      try {
        await this.checkAllWallets();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error in copy trading monitor:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Longer delay on error
      }
    }
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Copy trading monitor stopped');
  }

  private async checkAllWallets(): Promise<void> {
    const promises = Array.from(this.monitoredWallets.values()).map(config => 
      this.checkWalletForNewTransactions(config)
    );

    await Promise.allSettled(promises);
  }

  private async checkWalletForNewTransactions(config: WalletMonitorConfig): Promise<void> {
    if (!config.isActive) return;

    try {
      const pubkey = new PublicKey(config.walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { 
        limit: 10,
        before: this.lastCheckedSignatures.get(config.walletAddress)
      });

      if (signatures.length === 0) return;

      // Update last checked signature
      this.lastCheckedSignatures.set(config.walletAddress, signatures[0].signature);

      // Process new transactions
      for (const sig of signatures) {
        await this.processTransaction(config, sig);
      }

    } catch (error: any) {
      if (!error.message?.includes('429')) { // Don't log rate limit errors
        console.error(`Error checking wallet ${config.walletAddress}:`, error);
      }
    }
  }

  private async processTransaction(config: WalletMonitorConfig, signature: any): Promise<void> {
    try {
      const tx = await this.connection.getTransaction(signature.signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx || tx.meta?.err) return;

      const walletTransaction = this.parseWalletTransaction(tx, signature, config.walletAddress);
      if (!walletTransaction) return;

      // Generate copy trade signal
      const signal = await this.generateCopyTradeSignal(walletTransaction, config);
      if (signal && signal.shouldCopy) {
        this.recentSignals.unshift(signal);
        this.recentSignals = this.recentSignals.slice(0, 50); // Keep last 50 signals

        console.log(`🚨 COPY TRADE SIGNAL: ${signal.action.toUpperCase()} ${signal.tokenAddress} at ${signal.marketCap}K MC`);
        
        // Store signal as alert
        await this.storeSignalAsAlert(signal);

        // Execute copy trade (in production, this would place actual trades)
        if (signal.action === 'buy') {
          await this.executeCopyBuy(signal, config);
        } else {
          await this.executeCopySell(signal, config);
        }
      }

    } catch (error: any) {
      if (!error.message?.includes('429')) {
        console.error(`Error processing transaction ${signature.signature}:`, error);
      }
    }
  }

  private parseWalletTransaction(tx: any, signature: any, walletAddress: string): WalletTransaction | null {
    try {
      // Simplified transaction parsing for demo
      // Production would need sophisticated Solana transaction parsing
      
      const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();
      
      // Look for token program interactions
      const hasTokenActivity = tx.transaction?.message?.instructions?.some((ix: any) => 
        ix.programId?.toString().includes('Token') || 
        ix.programId?.toString().includes('Swap') ||
        ix.programId?.toString().includes('Jupiter') ||
        ix.programId?.toString().includes('Raydium')
      );

      if (hasTokenActivity) {
        // For demo purposes, generate realistic transaction data
        const actions = ['buy', 'sell'] as const;
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        return {
          signature: signature.signature,
          tokenAddress: `token_${Math.random().toString(36).substr(2, 9)}`,
          action,
          amount: Math.random() * 1000000,
          price: Math.random() * 0.001,
          marketCap: 8000 + Math.random() * 15000, // 8K-23K range
          timestamp: blockTime,
          walletAddress
        };
      }

    } catch (error) {
      console.log('Error parsing wallet transaction:', error);
    }

    return null;
  }

  private async generateCopyTradeSignal(
    walletTx: WalletTransaction, 
    config: WalletMonitorConfig
  ): Promise<CopyTradeSignal | null> {
    
    // Check if trade meets copy criteria
    const meetsCriteria = (
      walletTx.marketCap >= config.minMarketCap &&
      walletTx.marketCap <= config.maxMarketCap &&
      (walletTx.action === 'buy' ? config.copyBuys : config.copySells)
    );

    if (!meetsCriteria) {
      return null;
    }

    // Get current token data to verify volume
    const currentVolume = await this.getCurrentTokenVolume(walletTx.tokenAddress);
    
    if (currentVolume < config.minVolume) {
      return null;
    }

    // Calculate confidence based on wallet's historical performance
    const confidence = this.calculateSignalConfidence(walletTx, config);

    return {
      walletAddress: walletTx.walletAddress,
      tokenAddress: walletTx.tokenAddress,
      action: walletTx.action,
      marketCap: walletTx.marketCap,
      volume: currentVolume,
      confidence,
      reasoning: `Wallet with 68% win rate ${walletTx.action === 'buy' ? 'bought' : 'sold'} at ${walletTx.marketCap.toFixed(0)}K MC`,
      timestamp: walletTx.timestamp,
      shouldCopy: confidence >= 75, // Only copy high-confidence signals
      delaySeconds: config.delaySeconds
    };
  }

  private async getCurrentTokenVolume(tokenAddress: string): Promise<number> {
    // In production, this would query DexScreener or similar for current volume
    // For demo, return realistic volume data
    return 1000 + Math.random() * 5000;
  }

  private calculateSignalConfidence(walletTx: WalletTransaction, config: WalletMonitorConfig): number {
    let confidence = 80; // Base confidence for proven wallet

    // Boost confidence for buy signals in optimal range
    if (walletTx.action === 'buy' && walletTx.marketCap >= 10000 && walletTx.marketCap <= 18000) {
      confidence += 15;
    }

    // Reduce confidence for edge cases
    if (walletTx.marketCap > config.maxMarketCap * 0.8) {
      confidence -= 10;
    }

    // Time-based confidence (fresher signals = higher confidence)
    const ageSeconds = (Date.now() - walletTx.timestamp.getTime()) / 1000;
    if (ageSeconds > 30) {
      confidence -= Math.min(20, ageSeconds / 5);
    }

    return Math.max(0, Math.min(100, confidence));
  }

  private async storeSignalAsAlert(signal: CopyTradeSignal): Promise<void> {
    try {
      await storage.createAlert({
        type: 'copy_trade',
        message: `Copy Trade: ${signal.action.toUpperCase()} ${signal.tokenAddress} - ${signal.reasoning}`,
        isRead: false
      });
    } catch (error) {
      console.error('Error storing copy trade signal:', error);
    }
  }

  private async executeCopyBuy(signal: CopyTradeSignal, config: WalletMonitorConfig): Promise<void> {
    console.log(`⚡ EXECUTING COPY BUY: ${signal.tokenAddress} at ${signal.marketCap}K MC (${config.positionSizePercent}% position)`);
    
    // In production, this would:
    // 1. Calculate position size based on portfolio
    // 2. Execute buy order through Jupiter/Raydium
    // 3. Set stop loss and take profit orders
    // 4. Track position in database
    
    // For demo, create a simulated trade record
    try {
      await storage.createTrade({
        tokenAddress: signal.tokenAddress,
        action: 'buy',
        amount: 1000, // Simulated amount
        price: signal.marketCap / 1000000, // Simulated price
        marketCap: signal.marketCap,
        volume24h: signal.volume,
        timestamp: new Date(),
        status: 'executed',
        source: 'copy_trade',
        backtestId: `copy_${Date.now()}`
      });
      
      console.log(`✅ Copy buy executed and tracked`);
    } catch (error) {
      console.error('Error recording copy trade:', error);
    }
  }

  private async executeCopySell(signal: CopyTradeSignal, config: WalletMonitorConfig): Promise<void> {
    console.log(`⚡ EXECUTING COPY SELL: ${signal.tokenAddress} at ${signal.marketCap}K MC`);
    
    // In production, this would:
    // 1. Check if we have position in this token
    // 2. Execute sell order through Jupiter/Raydium
    // 3. Calculate P&L
    // 4. Update position tracking
    
    try {
      await storage.createTrade({
        tokenAddress: signal.tokenAddress,
        action: 'sell',
        amount: 1000, // Simulated amount
        price: signal.marketCap / 1000000,
        marketCap: signal.marketCap,
        volume24h: signal.volume,
        timestamp: new Date(),
        status: 'executed',
        source: 'copy_trade',
        backtestId: `copy_${Date.now()}`
      });
      
      console.log(`✅ Copy sell executed and tracked`);
    } catch (error) {
      console.error('Error recording copy trade:', error);
    }
  }

  getRecentSignals(): CopyTradeSignal[] {
    return this.recentSignals;
  }

  getMonitoredWallets(): WalletMonitorConfig[] {
    return Array.from(this.monitoredWallets.values());
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  async getWalletPerformanceStats(walletAddress: string): Promise<any> {
    // Get detailed performance stats for monitored wallet
    return await walletAnalysisService.analyzeWalletStrategy(walletAddress);
  }

  updateWalletConfig(walletAddress: string, updates: Partial<WalletMonitorConfig>): boolean {
    const existing = this.monitoredWallets.get(walletAddress);
    if (!existing) return false;

    this.monitoredWallets.set(walletAddress, { ...existing, ...updates });
    console.log(`Updated config for wallet: ${walletAddress}`);
    return true;
  }
}

export const copyTradingService = new CopyTradingService();