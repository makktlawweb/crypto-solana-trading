import { storage } from '../storage';
import { Trade, Token } from '@shared/schema';

export interface PortfolioPosition {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  entryValue: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  entryTime: Date;
  holdDuration: number; // minutes
  riskLevel: 'low' | 'medium' | 'high';
  exitStrategy: {
    stopLoss: number;
    takeProfit: number;
    maxHoldTime: number; // minutes
  };
}

export interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  positions: PortfolioPosition[];
  cashBalance: number;
  portfolioAllocation: {
    cash: number;
    positions: number;
  };
  riskMetrics: {
    totalRisk: number;
    maxDrawdown: number;
    sharpeRatio: number;
    volatility: number;
    valueAtRisk: number; // 1% VaR
  };
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  riskScore: number; // 0-100
  warnings: string[];
  recommendations: string[];
  positionRisks: {
    tokenAddress: string;
    riskLevel: 'low' | 'medium' | 'high';
    concerns: string[];
  }[];
  portfolioHealth: {
    diversification: number; // 0-100
    correlation: number; // 0-100
    concentration: number; // 0-100
    liquidity: number; // 0-100
  };
}

export interface PerformanceAnalytics {
  timeframes: {
    '24h': { return: number; trades: number; winRate: number };
    '7d': { return: number; trades: number; winRate: number };
    '30d': { return: number; trades: number; winRate: number };
    'all': { return: number; trades: number; winRate: number };
  };
  bestTrade: {
    tokenName: string;
    pnl: number;
    pnlPercent: number;
    holdTime: number;
  };
  worstTrade: {
    tokenName: string;
    pnl: number;
    pnlPercent: number;
    holdTime: number;
  };
  tradingPatterns: {
    avgHoldTime: number;
    avgPositionSize: number;
    mostTradedHour: number;
    successByHoldTime: Array<{ timeRange: string; winRate: number; avgReturn: number }>;
  };
  streaks: {
    currentWinStreak: number;
    currentLossStreak: number;
    longestWinStreak: number;
    longestLossStreak: number;
  };
}

export class PortfolioManager {
  private portfolioValue = 500; // Starting with $500
  private cashBalance = 500;
  private positions: Map<string, PortfolioPosition> = new Map();

  async getPortfolioMetrics(): Promise<PortfolioMetrics> {
    const positions = Array.from(this.positions.values());
    const totalPositionValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalInvested = positions.reduce((sum, pos) => sum + pos.entryValue, 0);
    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);

    // Calculate realized P&L from completed trades
    const trades = await storage.getAllTrades();
    const realizedPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

    const totalValue = this.cashBalance + totalPositionValue;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Calculate day/week changes (simplified for demo)
    const dayChange = totalPnL * 0.1; // Simulated day change
    const weekChange = totalPnL * 0.3; // Simulated week change

    const riskMetrics = await this.calculateRiskMetrics(positions, trades);

    return {
      totalValue,
      totalInvested,
      totalPnL: totalPnL + realizedPnL,
      totalPnLPercent,
      dayChange,
      dayChangePercent: totalInvested > 0 ? (dayChange / totalInvested) * 100 : 0,
      weekChange,
      weekChangePercent: totalInvested > 0 ? (weekChange / totalInvested) * 100 : 0,
      positions,
      cashBalance: this.cashBalance,
      portfolioAllocation: {
        cash: (this.cashBalance / totalValue) * 100,
        positions: (totalPositionValue / totalValue) * 100
      },
      riskMetrics
    };
  }

  async assessRisk(): Promise<RiskAssessment> {
    const positions = Array.from(this.positions.values());
    const trades = await storage.getAllTrades();
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const positionRisks: RiskAssessment['positionRisks'] = [];

    let riskScore = 0;

    // Analyze each position
    for (const position of positions) {
      const positionRisk = this.analyzePositionRisk(position);
      positionRisks.push(positionRisk);
      
      if (positionRisk.riskLevel === 'high') {
        riskScore += 30;
        warnings.push(`High risk position: ${position.tokenName} (${positionRisk.concerns.join(', ')})`);
      } else if (positionRisk.riskLevel === 'medium') {
        riskScore += 15;
      }
    }

    // Portfolio concentration risk
    const maxPosition = Math.max(...positions.map(p => p.currentValue));
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0) + this.cashBalance;
    const concentration = totalValue > 0 ? (maxPosition / totalValue) * 100 : 0;

    if (concentration > 40) {
      riskScore += 25;
      warnings.push(`Portfolio too concentrated: ${concentration.toFixed(1)}% in single position`);
      recommendations.push('Diversify portfolio - reduce largest position to under 25%');
    }

    // Number of positions risk
    if (positions.length > 5) {
      riskScore += 20;
      warnings.push('Too many positions may be hard to monitor effectively');
      recommendations.push('Consider reducing to 3-5 core positions');
    }

    // Hold time risk
    const longHolds = positions.filter(p => p.holdDuration > 240); // > 4 hours
    if (longHolds.length > 0) {
      riskScore += 15;
      warnings.push(`${longHolds.length} position(s) held longer than 4 hours`);
      recommendations.push('Review exit strategy for long-held positions');
    }

    // Cash allocation risk
    const cashPercent = (this.cashBalance / totalValue) * 100;
    if (cashPercent < 10) {
      riskScore += 20;
      warnings.push('Low cash reserves - limited flexibility for new opportunities');
      recommendations.push('Maintain at least 20% cash for new opportunities');
    }

    // Calculate portfolio health metrics
    const portfolioHealth = {
      diversification: Math.max(0, 100 - concentration),
      correlation: 85, // Simulated - most meme coins are highly correlated
      concentration: Math.min(100, concentration),
      liquidity: this.calculateLiquidityScore(positions)
    };

    // Overall risk assessment
    let overallRisk: RiskAssessment['overallRisk'] = 'low';
    if (riskScore > 70) overallRisk = 'extreme';
    else if (riskScore > 50) overallRisk = 'high';
    else if (riskScore > 25) overallRisk = 'medium';

    if (recommendations.length === 0) {
      recommendations.push('Portfolio risk appears well-managed');
      recommendations.push('Continue monitoring position sizes and hold times');
    }

    return {
      overallRisk,
      riskScore: Math.min(100, riskScore),
      warnings,
      recommendations,
      positionRisks,
      portfolioHealth
    };
  }

  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    const trades = await storage.getAllTrades();
    const now = new Date();

    // Calculate timeframe performance
    const timeframes = {
      '24h': this.calculateTimeframePerformance(trades, now, 24 * 60 * 60 * 1000),
      '7d': this.calculateTimeframePerformance(trades, now, 7 * 24 * 60 * 60 * 1000),
      '30d': this.calculateTimeframePerformance(trades, now, 30 * 24 * 60 * 60 * 1000),
      'all': this.calculateTimeframePerformance(trades, now, Infinity)
    };

    // Find best and worst trades
    const completedTrades = trades.filter(t => t.pnl !== undefined);
    const bestTrade = completedTrades.reduce((best, trade) => 
      !best || (trade.pnl || 0) > (best.pnl || 0) ? trade : best, null as Trade | null);
    const worstTrade = completedTrades.reduce((worst, trade) => 
      !worst || (trade.pnl || 0) < (worst.pnl || 0) ? trade : worst, null as Trade | null);

    // Calculate trading patterns
    const avgHoldTime = trades.reduce((sum, t) => sum + (t.duration || 0), 0) / trades.length || 0;
    const avgPositionSize = trades.reduce((sum, t) => sum + (t.entryValue || 0), 0) / trades.length || 0;
    
    // Trading hours analysis
    const hourCounts = new Array(24).fill(0);
    trades.forEach(trade => {
      if (trade.entryTime) {
        const hour = new Date(trade.entryTime).getHours();
        hourCounts[hour]++;
      }
    });
    const mostTradedHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Success by hold time
    const successByHoldTime = [
      { timeRange: '< 1 min', winRate: 0, avgReturn: 0 },
      { timeRange: '1-10 min', winRate: 0, avgReturn: 0 },
      { timeRange: '10-60 min', winRate: 0, avgReturn: 0 },
      { timeRange: '> 1 hour', winRate: 0, avgReturn: 0 }
    ];

    // Calculate win/loss streaks
    const streaks = this.calculateStreaks(trades);

    return {
      timeframes,
      bestTrade: bestTrade ? {
        tokenName: bestTrade.tokenName || 'Unknown',
        pnl: bestTrade.pnl || 0,
        pnlPercent: bestTrade.pnlPercent || 0,
        holdTime: bestTrade.duration || 0
      } : { tokenName: 'None', pnl: 0, pnlPercent: 0, holdTime: 0 },
      worstTrade: worstTrade ? {
        tokenName: worstTrade.tokenName || 'Unknown',
        pnl: worstTrade.pnl || 0,
        pnlPercent: worstTrade.pnlPercent || 0,
        holdTime: worstTrade.duration || 0
      } : { tokenName: 'None', pnl: 0, pnlPercent: 0, holdTime: 0 },
      tradingPatterns: {
        avgHoldTime,
        avgPositionSize,
        mostTradedHour,
        successByHoldTime
      },
      streaks
    };
  }

  // Position Management
  async addPosition(tokenAddress: string, entryPrice: number, quantity: number): Promise<void> {
    const token = await storage.getTokenByAddress(tokenAddress);
    const entryValue = entryPrice * quantity;

    const position: PortfolioPosition = {
      tokenAddress,
      tokenName: token?.name || 'Unknown Token',
      tokenSymbol: token?.symbol || 'UNK',
      entryPrice,
      currentPrice: entryPrice, // Will be updated by market data
      quantity,
      entryValue,
      currentValue: entryValue,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      entryTime: new Date(),
      holdDuration: 0,
      riskLevel: 'medium',
      exitStrategy: {
        stopLoss: entryPrice * 0.75, // 25% stop loss
        takeProfit: entryPrice * 2.0, // 100% take profit
        maxHoldTime: 240 // 4 hours
      }
    };

    this.positions.set(tokenAddress, position);
    this.cashBalance -= entryValue;
  }

  async updatePositionPrice(tokenAddress: string, currentPrice: number): Promise<void> {
    const position = this.positions.get(tokenAddress);
    if (!position) return;

    position.currentPrice = currentPrice;
    position.currentValue = currentPrice * position.quantity;
    position.unrealizedPnL = position.currentValue - position.entryValue;
    position.unrealizedPnLPercent = (position.unrealizedPnL / position.entryValue) * 100;
    position.holdDuration = Math.floor((Date.now() - position.entryTime.getTime()) / (1000 * 60));
    
    // Update risk level based on current performance
    if (position.unrealizedPnLPercent < -15 || position.holdDuration > 180) {
      position.riskLevel = 'high';
    } else if (position.unrealizedPnLPercent < -5 || position.holdDuration > 60) {
      position.riskLevel = 'medium';
    } else {
      position.riskLevel = 'low';
    }
  }

  async closePosition(tokenAddress: string, exitPrice: number): Promise<void> {
    const position = this.positions.get(tokenAddress);
    if (!position) return;

    const exitValue = exitPrice * position.quantity;
    this.cashBalance += exitValue;
    this.positions.delete(tokenAddress);

    // Record the trade
    await storage.createTrade({
      tokenAddress,
      tokenName: position.tokenName,
      entryPrice: position.entryPrice,
      exitPrice,
      quantity: position.quantity,
      entryTime: position.entryTime,
      exitTime: new Date(),
      duration: position.holdDuration,
      pnl: position.unrealizedPnL,
      pnlPercent: position.unrealizedPnLPercent,
      exitReason: 'manual_close',
      entryValue: position.entryValue,
      exitValue
    });
  }

  // Helper Methods
  private async calculateRiskMetrics(positions: PortfolioPosition[], trades: Trade[]) {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0) + this.cashBalance;
    const totalRisk = positions.reduce((sum, p) => {
      const positionRisk = (p.currentValue / totalValue) * this.getPositionRiskWeight(p);
      return sum + positionRisk;
    }, 0);

    // Calculate max drawdown from trade history
    let peak = this.portfolioValue;
    let maxDrawdown = 0;
    let runningValue = this.portfolioValue;

    trades.forEach(trade => {
      runningValue += (trade.pnl || 0);
      if (runningValue > peak) peak = runningValue;
      const drawdown = ((peak - runningValue) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calculate Sharpe ratio (simplified)
    const returns = trades.map(t => (t.pnlPercent || 0) / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length || 0;
    const returnStdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length) || 1;
    const sharpeRatio = (avgReturn / returnStdDev) * Math.sqrt(252); // Annualized

    // Calculate volatility
    const volatility = returnStdDev * Math.sqrt(252) * 100;

    // Calculate Value at Risk (1% VaR)
    const sortedReturns = returns.sort((a, b) => a - b);
    const varIndex = Math.floor(returns.length * 0.01);
    const valueAtRisk = sortedReturns[varIndex] ? Math.abs(sortedReturns[varIndex] * totalValue) : 0;

    return {
      totalRisk: totalRisk * 100,
      maxDrawdown,
      sharpeRatio,
      volatility,
      valueAtRisk
    };
  }

  private analyzePositionRisk(position: PortfolioPosition): RiskAssessment['positionRisks'][0] {
    const concerns: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // P&L risk
    if (position.unrealizedPnLPercent < -20) {
      concerns.push('Heavy losses');
      riskLevel = 'high';
    } else if (position.unrealizedPnLPercent < -10) {
      concerns.push('Moderate losses');
      riskLevel = 'medium';
    }

    // Hold time risk
    if (position.holdDuration > 240) { // > 4 hours
      concerns.push('Extended hold time');
      riskLevel = 'high';
    } else if (position.holdDuration > 120) { // > 2 hours
      concerns.push('Long hold time');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Size risk
    const totalValue = this.cashBalance + Array.from(this.positions.values()).reduce((sum, p) => sum + p.currentValue, 0);
    const positionPercent = (position.currentValue / totalValue) * 100;
    if (positionPercent > 30) {
      concerns.push('Large position size');
      riskLevel = 'high';
    } else if (positionPercent > 20) {
      concerns.push('Moderate position size');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    if (concerns.length === 0) {
      concerns.push('No significant concerns');
    }

    return {
      tokenAddress: position.tokenAddress,
      riskLevel,
      concerns
    };
  }

  private getPositionRiskWeight(position: PortfolioPosition): number {
    let weight = 1;
    if (position.unrealizedPnLPercent < -15) weight += 0.5;
    if (position.holdDuration > 180) weight += 0.3;
    if (position.riskLevel === 'high') weight += 0.4;
    return Math.min(weight, 2); // Cap at 2x weight
  }

  private calculateLiquidityScore(positions: PortfolioPosition[]): number {
    // Simplified liquidity scoring - in production would use real volume data
    const avgScore = positions.reduce((sum, pos) => {
      let score = 100;
      if (pos.holdDuration > 180) score -= 30; // Older positions may have less liquidity
      if (pos.currentValue < 10) score -= 20; // Small positions harder to exit
      return sum + Math.max(20, score);
    }, 0) / positions.length || 100;
    
    return Math.round(avgScore);
  }

  private calculateTimeframePerformance(trades: Trade[], now: Date, timeframe: number) {
    const cutoff = new Date(now.getTime() - timeframe);
    const relevantTrades = trades.filter(t => 
      t.entryTime && new Date(t.entryTime) >= cutoff
    );

    const totalReturn = relevantTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = relevantTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = relevantTrades.length > 0 ? (winningTrades / relevantTrades.length) * 100 : 0;

    return {
      return: totalReturn,
      trades: relevantTrades.length,
      winRate
    };
  }

  private calculateStreaks(trades: Trade[]) {
    const sortedTrades = trades
      .filter(t => t.pnl !== undefined)
      .sort((a, b) => new Date(a.entryTime || 0).getTime() - new Date(b.entryTime || 0).getTime());

    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    sortedTrades.forEach((trade, index) => {
      const isWin = (trade.pnl || 0) > 0;
      
      if (isWin) {
        tempWinStreak++;
        tempLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      } else {
        tempLossStreak++;
        tempWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
      }

      // Calculate current streaks (from end of array)
      if (index === sortedTrades.length - 1) {
        currentWinStreak = tempWinStreak;
        currentLossStreak = tempLossStreak;
      }
    });

    return {
      currentWinStreak,
      currentLossStreak,
      longestWinStreak,
      longestLossStreak
    };
  }
}

export const portfolioManager = new PortfolioManager();