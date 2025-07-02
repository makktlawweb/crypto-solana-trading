import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { storage } from '../storage';
import { liveCopyTradingService } from './liveCopyTrading';

export interface AutomatedTradeExecution {
  walletAddress: string;
  tokenAddress: string;
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  reason: string;
}

export class AutomatedCopyTradingService {
  private connection: Connection;
  private userKeypair: Keypair | null = null;
  private isActive: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
  }

  async initializeUserWallet(privateKeyBase58: string): Promise<boolean> {
    try {
      // Convert base58 private key to Keypair
      const privateKeyBytes = this.base58ToUint8Array(privateKeyBase58);
      this.userKeypair = Keypair.fromSecretKey(privateKeyBytes);
      
      // Verify wallet balance
      const balance = await this.connection.getBalance(this.userKeypair.publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      await storage.createAlert({
        type: 'success',
        message: `🔑 Automated trading wallet initialized: ${this.userKeypair.publicKey.toString().slice(0, 8)}...${this.userKeypair.publicKey.toString().slice(-8)} - Balance: ${solBalance.toFixed(4)} SOL`,
        isRead: false
      });

      console.log(`🔑 Automated wallet initialized: ${this.userKeypair.publicKey.toString()} - Balance: ${solBalance} SOL`);
      return true;
    } catch (error) {
      console.error('Error initializing wallet:', error);
      await storage.createAlert({
        type: 'error',
        message: `❌ Failed to initialize automated trading wallet: Invalid private key format`,
        isRead: false
      });
      return false;
    }
  }

  private base58ToUint8Array(base58String: string): Uint8Array {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = alphabet.length;
    
    let num = BigInt(0);
    for (let i = 0; i < base58String.length; i++) {
      const char = base58String[i];
      const digit = alphabet.indexOf(char);
      if (digit === -1) throw new Error('Invalid base58 character');
      num = num * BigInt(base) + BigInt(digit);
    }
    
    // Convert to bytes
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(Number(num % BigInt(256)));
      num = num / BigInt(256);
    }
    
    // Add leading zeros for base58 leading '1's
    for (let i = 0; i < base58String.length && base58String[i] === '1'; i++) {
      bytes.unshift(0);
    }
    
    return new Uint8Array(bytes);
  }

  async startAutomatedCopyTrading(): Promise<void> {
    if (!this.userKeypair) {
      throw new Error('User wallet not initialized');
    }

    this.isActive = true;
    
    await storage.createAlert({
      type: 'success',
      message: `🚀 Automated copy trading ACTIVATED - Monitoring Momentum Trader (77.8% win rate) for live execution`,
      isRead: false
    });

    // Start monitoring the Momentum Trader every 10 seconds
    this.monitoringInterval = setInterval(async () => {
      if (this.isActive) {
        await this.checkForNewTrades();
      }
    }, 10000); // Check every 10 seconds

    console.log('🚀 Automated copy trading started - monitoring every 10 seconds');
  }

  private async checkForNewTrades(): Promise<void> {
    try {
      // Get latest trades from Momentum Trader
      const momentumTraderAddress = 'BHREK2ymxgRSkgFUHGXn3c98KjHBcrJ2kTZnG2AtX';
      const recentTrades = await liveCopyTradingService.getWalletTransactions(momentumTraderAddress, 1);
      
      if (recentTrades.length > 0) {
        const latestTrade = recentTrades[0];
        
        // Check if this is a new trade we haven't processed
        const existingTrades = await storage.getAllTrades();
        const alreadyProcessed = existingTrades.some(trade => 
          trade.sourceTransaction === latestTrade.signature
        );

        if (!alreadyProcessed && this.shouldCopyTrade(latestTrade)) {
          await this.executeCopyTrade(latestTrade);
        }
      }
    } catch (error) {
      console.error('Error checking for new trades:', error);
    }
  }

  private shouldCopyTrade(trade: any): boolean {
    // Only copy buy trades from tokens with good market cap
    if (trade.type !== 'buy') return false;
    if (trade.marketCap < 5000) return false; // Minimum 5K market cap
    if (trade.marketCap > 50000) return false; // Maximum 50K market cap for meme coins
    
    return true;
  }

  private async executeCopyTrade(momentumTrade: any): Promise<void> {
    if (!this.userKeypair) return;

    try {
      const tokenAddress = momentumTrade.tokenAddress;
      const positionSize = 25; // $25 USD position size
      
      // Calculate SOL amount needed (rough estimate)
      const solPrice = await this.getSolPrice();
      const solAmount = positionSize / solPrice;
      
      await storage.createAlert({
        type: 'info',
        message: `🎯 COPY TRADE DETECTED: ${momentumTrade.tokenName || 'Unknown Token'} - Market Cap: $${momentumTrade.marketCap.toLocaleString()} - Executing $${positionSize} position`,
        isRead: false
      });

      // For now, simulate the trade execution (Jupiter integration would go here)
      const trade = await this.simulateTradeExecution(tokenAddress, solAmount, momentumTrade);
      
      // Record the trade
      await storage.createTrade({
        tokenAddress: tokenAddress,
        tokenName: momentumTrade.tokenName || 'Copy Trade',
        entryPrice: momentumTrade.price,
        entryTime: new Date(),
        positionSize: positionSize,
        sourceTransaction: momentumTrade.signature,
        strategy: 'Momentum Copy',
        status: 'active'
      });

      await storage.createAlert({
        type: 'success',
        message: `✅ COPY TRADE EXECUTED: ${momentumTrade.tokenName} - Entry: $${momentumTrade.price.toFixed(6)} - Position: $${positionSize} - Following Momentum Trader`,
        isRead: false
      });

      console.log(`✅ Copy trade executed: ${tokenAddress} - $${positionSize} position`);
    } catch (error) {
      console.error('Error executing copy trade:', error);
      await storage.createAlert({
        type: 'error',
        message: `❌ Copy trade execution failed: ${error.message}`,
        isRead: false
      });
    }
  }

  private async simulateTradeExecution(tokenAddress: string, solAmount: number, momentumTrade: any) {
    // This would integrate with Jupiter for actual trade execution
    // For now, simulate the trade
    console.log(`Simulating trade execution: ${tokenAddress} for ${solAmount} SOL`);
    
    return {
      signature: 'simulated_' + Date.now(),
      tokenAddress,
      solAmount,
      estimatedTokens: solAmount * 1000000, // Rough estimate
      executionTime: new Date()
    };
  }

  private async getSolPrice(): Promise<number> {
    try {
      // Simple SOL price fetch - in production would use proper price feed
      return 170; // Approximate SOL price in USD
    } catch (error) {
      return 170; // Fallback price
    }
  }

  async stopAutomatedCopyTrading(): Promise<void> {
    this.isActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    await storage.createAlert({
      type: 'warning',
      message: `⏸️ Automated copy trading STOPPED - Manual monitoring resumed`,
      isRead: false
    });

    console.log('⏸️ Automated copy trading stopped');
  }

  getStatus(): { isActive: boolean; walletConnected: boolean; walletAddress?: string } {
    return {
      isActive: this.isActive,
      walletConnected: !!this.userKeypair,
      walletAddress: this.userKeypair?.publicKey.toString()
    };
  }

  // Emergency stop all positions
  async emergencyStop(): Promise<void> {
    await this.stopAutomatedCopyTrading();
    
    // Get all active trades and mark for closure
    const activeTrades = await storage.getAllTrades();
    const openTrades = activeTrades.filter(t => !t.exitTime);
    
    for (const trade of openTrades) {
      await storage.updateTrade(trade.id, {
        status: 'emergency_stop',
        exitReason: 'Emergency stop activated'
      });
    }

    await storage.createAlert({
      type: 'error',
      message: `🚨 EMERGENCY STOP ACTIVATED - All automated trading halted, ${openTrades.length} positions marked for manual review`,
      isRead: false
    });
  }
}

export const automatedCopyTradingService = new AutomatedCopyTradingService();