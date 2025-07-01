import { storage } from '../storage';

export interface RetailUser {
  id: string;
  email: string;
  walletAddress: string;
  subscriptionTier: 'free' | 'basic' | 'premium';
  copyTradingSettings: {
    maxPositionSize: number; // USD
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
    followedTraders: string[]; // Wallet addresses
    autoExecute: boolean;
    stopLossPercent: number;
  };
  accountBalance: number; // USD
  totalTrades: number;
  totalPnL: number;
  joinedAt: Date;
  lastActive: Date;
}

export interface TraderProfile {
  walletAddress: string;
  displayName: string;
  strategy: string;
  performance: {
    winRate: number;
    totalPnL: number;
    totalTrades: number;
    avgHoldTime: number; // minutes
    maxDrawdown: number;
    sharpeRatio: number;
    last30DayReturn: number;
  };
  followers: number;
  tier: 'verified' | 'premium' | 'elite';
  feeStructure: {
    copyFeePercent: number; // e.g., 2% of profits
    minimumFee: number; // USD
  };
  isActive: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface CopyTradeExecution {
  id: string;
  userId: string;
  traderAddress: string;
  tokenAddress: string;
  action: 'buy' | 'sell';
  amount: number; // USD
  price: number;
  timestamp: Date;
  fees: {
    platformFee: number; // Our fee
    traderFee: number; // Trader's fee
    networkFee: number; // Gas fees
  };
  status: 'pending' | 'executed' | 'failed';
  originalTradeId?: string; // Reference to trader's original trade
}

export interface PlatformMetrics {
  totalUsers: number;
  activeTraders: number;
  totalVolumeUSD: number;
  platformRevenue: number;
  topPerformers: TraderProfile[];
  userGrowthRate: number;
  avgUserPnL: number;
}

export class CommercialCopyTradingService {
  private platformFeePercent = 0.5; // 0.5% platform fee on profits
  private traderFeePercent = 1.5; // 1.5% goes to trader
  private users: Map<string, RetailUser> = new Map();
  private traders: Map<string, TraderProfile> = new Map();
  private executions: CopyTradeExecution[] = [];

  constructor() {
    this.initializeDemoData();
  }

  // User Management
  async registerUser(email: string, walletAddress: string): Promise<RetailUser> {
    const user: RetailUser = {
      id: this.generateUserId(),
      email,
      walletAddress,
      subscriptionTier: 'free',
      copyTradingSettings: {
        maxPositionSize: 50, // $50 for free tier
        riskLevel: 'conservative',
        followedTraders: [],
        autoExecute: false, // Manual approval for free tier
        stopLossPercent: 20
      },
      accountBalance: 0,
      totalTrades: 0,
      totalPnL: 0,
      joinedAt: new Date(),
      lastActive: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  async upgradeSubscription(userId: string, tier: 'basic' | 'premium'): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    user.subscriptionTier = tier;
    
    // Upgrade benefits
    if (tier === 'basic') {
      user.copyTradingSettings.maxPositionSize = 200; // $200
      user.copyTradingSettings.autoExecute = true;
    } else if (tier === 'premium') {
      user.copyTradingSettings.maxPositionSize = 1000; // $1000
      user.copyTradingSettings.autoExecute = true;
      // Access to elite traders
    }
  }

  // Trader Discovery and Verification
  async discoverTopTraders(): Promise<TraderProfile[]> {
    // In production, this would analyze on-chain data from multiple sources
    return [
      {
        walletAddress: 'BHREKFkPQgAtDs8Vb1UfLkUpjG6ScidTjHaCWFuG2AtX',
        displayName: 'The Momentum Master',
        strategy: 'Selective Momentum Trading',
        performance: {
          winRate: 77.8,
          totalPnL: 29671,
          totalTrades: 87,
          avgHoldTime: 47,
          maxDrawdown: 8.2,
          sharpeRatio: 3.4,
          last30DayReturn: 51.2
        },
        followers: 0, // Will grow as users join
        tier: 'elite',
        feeStructure: {
          copyFeePercent: 15, // 15% of profits
          minimumFee: 5
        },
        isActive: true,
        verificationStatus: 'verified'
      },
      {
        walletAddress: 'suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK',
        displayName: 'Speed Demon',
        strategy: 'High-Frequency Scalping',
        performance: {
          winRate: 69.2,
          totalPnL: 20772,
          totalTrades: 341,
          avgHoldTime: 0.8, // 48 seconds
          maxDrawdown: 12.5,
          sharpeRatio: 2.1,
          last30DayReturn: 18.2
        },
        followers: 0,
        tier: 'premium',
        feeStructure: {
          copyFeePercent: 10, // 10% of profits
          minimumFee: 2
        },
        isActive: true,
        verificationStatus: 'verified'
      }
    ];
  }

  async verifyTrader(walletAddress: string): Promise<TraderProfile | null> {
    // Comprehensive trader verification process
    const performance = await this.analyzeTraderPerformance(walletAddress);
    
    if (performance.winRate < 60 || performance.totalTrades < 50) {
      return null; // Doesn't meet minimum standards
    }

    const profile: TraderProfile = {
      walletAddress,
      displayName: `Trader ${walletAddress.slice(0, 8)}...`,
      strategy: this.categorizeStrategy(performance),
      performance,
      followers: 0,
      tier: this.assignTier(performance),
      feeStructure: this.calculateFeeStructure(performance),
      isActive: true,
      verificationStatus: 'verified'
    };

    this.traders.set(walletAddress, profile);
    return profile;
  }

  // Copy Trading Execution
  async executeCopyTrade(
    userId: string, 
    traderAddress: string, 
    originalTrade: any
  ): Promise<CopyTradeExecution> {
    const user = this.users.get(userId);
    const trader = this.traders.get(traderAddress);
    
    if (!user || !trader) {
      throw new Error('User or trader not found');
    }

    // Calculate position size based on user settings
    const positionSize = Math.min(
      originalTrade.usdValue * 0.1, // Max 10% of original trade
      user.copyTradingSettings.maxPositionSize,
      user.accountBalance * 0.05 // Max 5% of user balance
    );

    // Calculate fees
    const platformFee = positionSize * (this.platformFeePercent / 100);
    const traderFee = positionSize * (trader.feeStructure.copyFeePercent / 100);
    const networkFee = 0.50; // Estimated SOL network fee

    const execution: CopyTradeExecution = {
      id: this.generateExecutionId(),
      userId,
      traderAddress,
      tokenAddress: originalTrade.tokenAddress,
      action: originalTrade.action,
      amount: positionSize,
      price: originalTrade.price,
      timestamp: new Date(),
      fees: {
        platformFee,
        traderFee,
        networkFee
      },
      status: 'pending',
      originalTradeId: originalTrade.id
    };

    // Execute the trade (in production, this would interact with DEX)
    execution.status = 'executed';
    this.executions.push(execution);

    // Update user metrics
    user.totalTrades++;
    user.accountBalance -= (positionSize + platformFee + traderFee + networkFee);
    user.lastActive = new Date();

    return execution;
  }

  // Revenue and Analytics
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    const totalRevenue = this.executions.reduce(
      (sum, exec) => sum + exec.fees.platformFee, 0
    );

    const activeTraders = Array.from(this.traders.values())
      .filter(t => t.isActive && t.followers > 0);

    const totalVolume = this.executions.reduce(
      (sum, exec) => sum + exec.amount, 0
    );

    return {
      totalUsers: this.users.size,
      activeTraders: activeTraders.length,
      totalVolumeUSD: totalVolume,
      platformRevenue: totalRevenue,
      topPerformers: activeTraders.slice(0, 10),
      userGrowthRate: 15.2, // Simulated growth rate
      avgUserPnL: this.calculateAvgUserPnL()
    };
  }

  async getTraderEarnings(walletAddress: string): Promise<{
    totalEarnings: number;
    followers: number;
    copiedTrades: number;
    monthlyGrowth: number;
  }> {
    const traderExecutions = this.executions.filter(
      exec => exec.traderAddress === walletAddress
    );

    const totalEarnings = traderExecutions.reduce(
      (sum, exec) => sum + exec.fees.traderFee, 0
    );

    return {
      totalEarnings,
      followers: this.getUsersFollowingTrader(walletAddress),
      copiedTrades: traderExecutions.length,
      monthlyGrowth: 23.5 // Simulated growth
    };
  }

  // Market Analysis for Retail Scaling
  async analyzeMarketOpportunity(): Promise<{
    targetMarket: string;
    estimatedUsers: number;
    revenueProjection: number;
    competitorAnalysis: string[];
    keyDifferentiators: string[];
  }> {
    return {
      targetMarket: "Retail crypto traders seeking professional-grade strategies",
      estimatedUsers: 50000, // Conservative estimate for first year
      revenueProjection: 2500000, // $2.5M annual revenue potential
      competitorAnalysis: [
        "eToro: Limited crypto copy trading, high fees",
        "BitGet: Basic copy trading, poor risk management",
        "OKX: Manual copying only, no automation"
      ],
      keyDifferentiators: [
        "Real-time autonomous execution (2-10 second delay)",
        "Advanced risk management with volume death detection",
        "Transparent trader verification and performance tracking",
        "Low fees (2% total vs 5-10% competitors)",
        "Solana speed advantage over Ethereum-based platforms"
      ]
    };
  }

  // Helper Methods
  private async analyzeTraderPerformance(walletAddress: string): Promise<any> {
    // In production, this would analyze real on-chain data
    return {
      winRate: 65 + Math.random() * 20,
      totalPnL: Math.random() * 50000,
      totalTrades: 50 + Math.random() * 200,
      avgHoldTime: Math.random() * 120,
      maxDrawdown: Math.random() * 20,
      sharpeRatio: 1 + Math.random() * 3,
      last30DayReturn: -10 + Math.random() * 60
    };
  }

  private categorizeStrategy(performance: any): string {
    if (performance.avgHoldTime < 5) return "High-Frequency Scalping";
    if (performance.avgHoldTime < 60) return "Momentum Trading";
    return "Position Trading";
  }

  private assignTier(performance: any): 'verified' | 'premium' | 'elite' {
    if (performance.winRate > 75 && performance.sharpeRatio > 3) return 'elite';
    if (performance.winRate > 65 && performance.sharpeRatio > 2) return 'premium';
    return 'verified';
  }

  private calculateFeeStructure(performance: any): { copyFeePercent: number; minimumFee: number } {
    const baseFee = Math.max(5, Math.min(20, performance.winRate * 0.25));
    return {
      copyFeePercent: baseFee,
      minimumFee: Math.max(1, baseFee * 0.25)
    };
  }

  private calculateAvgUserPnL(): number {
    if (this.users.size === 0) return 0;
    const totalPnL = Array.from(this.users.values())
      .reduce((sum, user) => sum + user.totalPnL, 0);
    return totalPnL / this.users.size;
  }

  private getUsersFollowingTrader(walletAddress: string): number {
    return Array.from(this.users.values())
      .filter(user => user.copyTradingSettings.followedTraders.includes(walletAddress))
      .length;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private initializeDemoData(): void {
    // Initialize with discovered traders
    this.discoverTopTraders().then(traders => {
      traders.forEach(trader => {
        this.traders.set(trader.walletAddress, trader);
      });
    });
  }
}

export const commercialCopyTradingService = new CommercialCopyTradingService();