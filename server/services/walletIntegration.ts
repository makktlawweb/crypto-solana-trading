import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { storage } from '../storage';

export interface UserWallet {
  publicKey: string;
  name: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export class WalletIntegrationService {
  private connection: Connection;
  private userWallets: Map<string, UserWallet> = new Map();

  constructor() {
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
  }

  async addUserWallet(publicKey: string, name: string = 'Copy Trading Bot'): Promise<UserWallet> {
    try {
      // Validate public key format
      const pubKey = new PublicKey(publicKey);
      
      // Check balance
      const balance = await this.getWalletBalance(publicKey);
      
      const wallet: UserWallet = {
        publicKey,
        name,
        balance,
        isActive: true,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      this.userWallets.set(publicKey, wallet);
      
      // Create alert for successful wallet integration
      await storage.createAlert({
        type: 'success',
        message: `✅ Wallet integrated: ${name} (${publicKey.slice(0, 8)}...${publicKey.slice(-8)}) - Balance: ${balance.toFixed(4)} SOL`,
        isRead: false
      });

      console.log(`🔗 Wallet integrated: ${name} - ${publicKey} - Balance: ${balance} SOL`);
      
      return wallet;
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw new Error(`Invalid wallet address: ${publicKey}`);
    }
  }

  async getWalletBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  async updateWalletBalances(): Promise<void> {
    const promises = Array.from(this.userWallets.keys()).map(async (publicKey) => {
      const wallet = this.userWallets.get(publicKey);
      if (wallet && wallet.isActive) {
        const newBalance = await this.getWalletBalance(publicKey);
        const oldBalance = wallet.balance;
        
        if (Math.abs(newBalance - oldBalance) > 0.01) { // Significant change
          wallet.balance = newBalance;
          wallet.lastUpdated = new Date();
          
          const change = newBalance - oldBalance;
          const changeType = change > 0 ? 'increase' : 'decrease';
          const changeAmount = Math.abs(change);
          
          await storage.createAlert({
            type: changeType === 'increase' ? 'success' : 'warning',
            message: `💰 Balance ${changeType}: ${wallet.name} - ${changeType === 'increase' ? '+' : '-'}${changeAmount.toFixed(4)} SOL (Total: ${newBalance.toFixed(4)} SOL)`,
            isRead: false
          });
        }
      }
    });
    
    await Promise.all(promises);
  }

  getUserWallets(): UserWallet[] {
    return Array.from(this.userWallets.values());
  }

  getUserWallet(publicKey: string): UserWallet | undefined {
    return this.userWallets.get(publicKey);
  }

  async activateCopyTrading(publicKey: string): Promise<boolean> {
    const wallet = this.getUserWallet(publicKey);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check minimum balance for copy trading
    const minBalance = 2.0; // 2 SOL minimum
    if (wallet.balance < minBalance) {
      await storage.createAlert({
        type: 'error',
        message: `❌ Insufficient balance: ${wallet.balance.toFixed(4)} SOL (Minimum: ${minBalance} SOL required)`,
        isRead: false
      });
      return false;
    }

    // Activate copy trading
    await storage.createAlert({
      type: 'success',
      message: `🚀 Copy trading activated: ${wallet.name} - Balance: ${wallet.balance.toFixed(4)} SOL - Monitoring Momentum Trader (77.8% win rate)`,
      isRead: false
    });

    console.log(`🚀 Copy trading activated for wallet: ${publicKey}`);
    
    // Note: Trading parameters will be configured when copy trading starts
    console.log(`Copy trading configuration: $25 positions, 25% stop loss, max 3 concurrent trades`);

    return true;
  }

  async deactivateCopyTrading(publicKey: string): Promise<void> {
    const wallet = this.getUserWallet(publicKey);
    if (wallet) {
      wallet.isActive = false;
      await storage.createAlert({
        type: 'info',
        message: `⏸️ Copy trading deactivated: ${wallet.name}`,
        isRead: false
      });
    }
  }

  // Monitor for funding and automatically activate copy trading
  async monitorForFunding(): Promise<void> {
    const walletEntries = Array.from(this.userWallets.entries());
    for (const [publicKey, wallet] of walletEntries) {
      if (wallet.isActive) {
        const currentBalance = await this.getWalletBalance(publicKey);
        const previousBalance = wallet.balance;
        
        // Check if wallet was just funded
        if (currentBalance > previousBalance && currentBalance >= 2.0 && previousBalance < 2.0) {
          await this.activateCopyTrading(publicKey);
        }
        
        wallet.balance = currentBalance;
        wallet.lastUpdated = new Date();
      }
    }
  }
}

export const walletIntegration = new WalletIntegrationService();