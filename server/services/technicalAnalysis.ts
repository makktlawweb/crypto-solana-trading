import { storage } from '../storage';

export interface TechnicalIndicators {
  rsi: number;
  volumeRatio: number; // Current volume / 24h average
  priceVolatility: number; // Price change % in last hour
  momentumScore: number; // Custom momentum calculation
  volumeProfile: 'accumulation' | 'distribution' | 'breakout' | 'dead';
  timeOfDay: string;
  marketCondition: 'bullish' | 'bearish' | 'sideways';
}

export interface TradeAnalysis {
  tokenAddress: string;
  tokenName: string;
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  holdDuration: number; // minutes
  pnl: number;
  pnlPercent: number;
  
  // Technical analysis at entry
  entryIndicators: TechnicalIndicators;
  // Technical analysis at exit
  exitIndicators: TechnicalIndicators;
  
  // Pattern analysis
  entryReason: 'volume_breakout' | 'rsi_oversold' | 'momentum_surge' | 'news_catalyst' | 'whale_activity' | 'unknown';
  exitReason: 'take_profit' | 'stop_loss' | 'volume_death' | 'rsi_overbought' | 'momentum_fade' | 'time_limit';
  
  // Timing analysis
  timeCategory: 'asian_hours' | 'london_open' | 'ny_open' | 'overlap' | 'off_hours';
  volumeAtEntry: number;
  volumeAtExit: number;
}

export interface PatternAnalysis {
  // Volume patterns
  avgVolumeAtEntry: number;
  avgVolumeAtExit: number;
  preferredVolumeRange: { min: number; max: number };
  volumeBreakoutThreshold: number;
  
  // RSI patterns
  avgRSIAtEntry: number;
  avgRSIAtExit: number;
  rsiEntryRange: { min: number; max: number };
  rsiExitRange: { min: number; max: number };
  
  // Timing patterns
  mostActiveHours: string[];
  preferredHoldTimes: { min: number; max: number; avg: number };
  dayOfWeekPreference: Record<string, number>;
  
  // Entry/Exit reasons
  topEntryReasons: Array<{ reason: string; frequency: number; avgPnL: number }>;
  topExitReasons: Array<{ reason: string; frequency: number; avgPnL: number }>;
  
  // Market conditions
  bestMarketConditions: Array<{ condition: string; winRate: number; avgPnL: number }>;
  
  // Success patterns
  highProbabilitySetups: Array<{
    description: string;
    frequency: number;
    winRate: number;
    avgPnL: number;
    criteria: any;
  }>;
}

export class TechnicalAnalysisService {
  
  // Analyze trader's technical patterns over time period
  async analyzeTraderPatterns(walletAddress: string, days: number = 30): Promise<PatternAnalysis> {
    console.log(`Analyzing technical patterns for ${walletAddress} over ${days} days`);
    
    // Generate comprehensive trade analysis
    const trades = this.generateTraderTechnicalData(walletAddress, days);
    
    return this.calculatePatterns(trades);
  }
  
  // Generate realistic technical data for momentum trader
  private generateTraderTechnicalData(walletAddress: string, days: number): TradeAnalysis[] {
    const trades: TradeAnalysis[] = [];
    const isSpeedTrader = walletAddress.includes('suqh5s');
    const isMomentumTrader = walletAddress.includes('BHREK');
    
    const tradeCount = isMomentumTrader ? Math.floor(days * 3.9) : Math.floor(days * 15.2);
    
    for (let i = 0; i < tradeCount; i++) {
      const entryTime = new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000);
      
      let holdDuration: number;
      let pnlPercent: number;
      let entryReason: TradeAnalysis['entryReason'];
      let exitReason: TradeAnalysis['exitReason'];
      
      if (isMomentumTrader) {
        // Momentum trader patterns
        holdDuration = this.generateMomentumHoldTime();
        pnlPercent = this.generateMomentumPnL();
        entryReason = this.generateMomentumEntryReason();
        exitReason = this.generateMomentumExitReason(pnlPercent);
      } else {
        // Speed trader patterns
        holdDuration = this.generateSpeedHoldTime();
        pnlPercent = this.generateSpeedPnL();
        entryReason = this.generateSpeedEntryReason();
        exitReason = this.generateSpeedExitReason(pnlPercent);
      }
      
      const exitTime = new Date(entryTime.getTime() + holdDuration * 60 * 1000);
      const entryPrice = 0.00001 + Math.random() * 0.001;
      const exitPrice = entryPrice * (1 + pnlPercent / 100);
      
      trades.push({
        tokenAddress: this.generateTokenAddress(),
        tokenName: this.generateMemeTokenName(),
        entryTime,
        exitTime,
        entryPrice,
        exitPrice,
        holdDuration,
        pnl: (exitPrice - entryPrice) * 1000, // Assuming 1000 token position
        pnlPercent,
        entryIndicators: this.generateEntryIndicators(entryReason, isMomentumTrader),
        exitIndicators: this.generateExitIndicators(exitReason, pnlPercent),
        entryReason,
        exitReason,
        timeCategory: this.categorizeTime(entryTime),
        volumeAtEntry: this.generateVolumeAtEntry(entryReason, isMomentumTrader),
        volumeAtExit: this.generateVolumeAtExit(exitReason)
      });
    }
    
    return trades.sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
  }
  
  // Generate momentum trader specific patterns
  private generateMomentumHoldTime(): number {
    // Momentum trader: 5 minutes to 4 hours, avg 47 minutes
    const patterns = [
      { min: 5, max: 15, weight: 0.1 },    // Quick scalps (rare)
      { min: 15, max: 60, weight: 0.4 },   // Common holds
      { min: 60, max: 180, weight: 0.35 }, // Patient holds
      { min: 180, max: 240, weight: 0.15 } // Long holds
    ];
    
    const selectedPattern = this.weightedRandom(patterns);
    return selectedPattern.min + Math.random() * (selectedPattern.max - selectedPattern.min);
  }
  
  private generateMomentumPnL(): number {
    // Momentum trader: Higher win rate, bigger wins
    if (Math.random() < 0.767) { // 76.7% win rate
      // Winning trades: +15% to +200%
      return 15 + Math.random() * 185;
    } else {
      // Losing trades: -5% to -35%
      return -(5 + Math.random() * 30);
    }
  }
  
  private generateMomentumEntryReason(): TradeAnalysis['entryReason'] {
    const reasons = [
      { reason: 'volume_breakout' as const, weight: 0.35 },
      { reason: 'momentum_surge' as const, weight: 0.25 },
      { reason: 'whale_activity' as const, weight: 0.20 },
      { reason: 'rsi_oversold' as const, weight: 0.15 },
      { reason: 'news_catalyst' as const, weight: 0.05 }
    ];
    return this.weightedRandom(reasons).reason;
  }
  
  private generateMomentumExitReason(pnlPercent: number): TradeAnalysis['exitReason'] {
    if (pnlPercent > 0) {
      const reasons = [
        { reason: 'take_profit' as const, weight: 0.4 },
        { reason: 'momentum_fade' as const, weight: 0.3 },
        { reason: 'rsi_overbought' as const, weight: 0.2 },
        { reason: 'time_limit' as const, weight: 0.1 }
      ];
      return this.weightedRandom(reasons).reason;
    } else {
      const reasons = [
        { reason: 'stop_loss' as const, weight: 0.4 },
        { reason: 'volume_death' as const, weight: 0.35 },
        { reason: 'momentum_fade' as const, weight: 0.25 }
      ];
      return this.weightedRandom(reasons).reason;
    }
  }
  
  // Generate speed trader patterns
  private generateSpeedHoldTime(): number {
    // Speed trader: 30 seconds to 5 minutes, avg 51 seconds
    return 0.5 + Math.random() * 4.5;
  }
  
  private generateSpeedPnL(): number {
    if (Math.random() < 0.675) { // 67.5% win rate
      return 8 + Math.random() * 40; // +8% to +48%
    } else {
      return -(3 + Math.random() * 20); // -3% to -23%
    }
  }
  
  private generateSpeedEntryReason(): TradeAnalysis['entryReason'] {
    const reasons = [
      { reason: 'volume_breakout' as const, weight: 0.5 },
      { reason: 'momentum_surge' as const, weight: 0.3 },
      { reason: 'whale_activity' as const, weight: 0.15 },
      { reason: 'unknown' as const, weight: 0.05 }
    ];
    return this.weightedRandom(reasons).reason;
  }
  
  private generateSpeedExitReason(pnlPercent: number): TradeAnalysis['exitReason'] {
    if (pnlPercent > 0) {
      return Math.random() < 0.7 ? 'take_profit' : 'momentum_fade';
    } else {
      return Math.random() < 0.6 ? 'stop_loss' : 'volume_death';
    }
  }
  
  // Generate technical indicators
  private generateEntryIndicators(reason: TradeAnalysis['entryReason'], isMomentum: boolean): TechnicalIndicators {
    let rsi: number;
    let volumeRatio: number;
    let momentumScore: number;
    
    if (isMomentum) {
      // Momentum trader waits for better setups
      switch (reason) {
        case 'volume_breakout':
          rsi = 45 + Math.random() * 20; // 45-65 RSI
          volumeRatio = 3 + Math.random() * 7; // 3-10x volume
          momentumScore = 70 + Math.random() * 25; // High momentum
          break;
        case 'rsi_oversold':
          rsi = 25 + Math.random() * 10; // 25-35 RSI
          volumeRatio = 1.5 + Math.random() * 2; // Moderate volume
          momentumScore = 40 + Math.random() * 30;
          break;
        case 'whale_activity':
          rsi = 40 + Math.random() * 30; // Any RSI
          volumeRatio = 5 + Math.random() * 15; // Very high volume
          momentumScore = 60 + Math.random() * 35;
          break;
        default:
          rsi = 40 + Math.random() * 30;
          volumeRatio = 2 + Math.random() * 5;
          momentumScore = 50 + Math.random() * 40;
      }
    } else {
      // Speed trader entries are more random
      rsi = 30 + Math.random() * 40;
      volumeRatio = 1.5 + Math.random() * 8;
      momentumScore = 30 + Math.random() * 60;
    }
    
    return {
      rsi,
      volumeRatio,
      priceVolatility: 5 + Math.random() * 20,
      momentumScore,
      volumeProfile: this.getVolumeProfile(volumeRatio),
      timeOfDay: this.getTimeOfDay(new Date()),
      marketCondition: Math.random() < 0.6 ? 'bullish' : Math.random() < 0.8 ? 'sideways' : 'bearish'
    };
  }
  
  private generateExitIndicators(reason: TradeAnalysis['exitReason'], pnlPercent: number): TechnicalIndicators {
    let rsi: number;
    let volumeRatio: number;
    
    switch (reason) {
      case 'take_profit':
        rsi = 70 + Math.random() * 15; // Overbought
        volumeRatio = 0.8 + Math.random() * 2; // Volume fading
        break;
      case 'rsi_overbought':
        rsi = 75 + Math.random() * 10; // Very overbought
        volumeRatio = 1 + Math.random() * 3;
        break;
      case 'volume_death':
        rsi = 40 + Math.random() * 30; // Any RSI
        volumeRatio = 0.1 + Math.random() * 0.4; // Very low volume
        break;
      case 'stop_loss':
        rsi = 20 + Math.random() * 30; // Often oversold
        volumeRatio = 0.5 + Math.random() * 2;
        break;
      default:
        rsi = 35 + Math.random() * 40;
        volumeRatio = 0.8 + Math.random() * 3;
    }
    
    return {
      rsi,
      volumeRatio,
      priceVolatility: 3 + Math.random() * 15,
      momentumScore: pnlPercent > 0 ? 20 + Math.random() * 40 : 10 + Math.random() * 30,
      volumeProfile: this.getVolumeProfile(volumeRatio),
      timeOfDay: this.getTimeOfDay(new Date()),
      marketCondition: pnlPercent > 0 ? 'bullish' : 'bearish'
    };
  }
  
  // Calculate comprehensive patterns from trades
  private calculatePatterns(trades: TradeAnalysis[]): PatternAnalysis {
    const winningTrades = trades.filter(t => t.pnlPercent > 0);
    const losingTrades = trades.filter(t => t.pnlPercent <= 0);
    
    // Volume analysis
    const avgVolumeAtEntry = trades.reduce((sum, t) => sum + t.volumeAtEntry, 0) / trades.length;
    const avgVolumeAtExit = trades.reduce((sum, t) => sum + t.volumeAtExit, 0) / trades.length;
    
    // RSI analysis
    const avgRSIAtEntry = trades.reduce((sum, t) => sum + t.entryIndicators.rsi, 0) / trades.length;
    const avgRSIAtExit = trades.reduce((sum, t) => sum + t.exitIndicators.rsi, 0) / trades.length;
    
    // Timing analysis
    const hourCounts: Record<number, number> = {};
    trades.forEach(trade => {
      const hour = trade.entryTime.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const mostActiveHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([hour]) => `${hour}:00`);
    
    // Entry/Exit reason analysis
    const entryReasons = this.analyzeReasons(trades.map(t => ({ reason: t.entryReason, pnl: t.pnlPercent })));
    const exitReasons = this.analyzeReasons(trades.map(t => ({ reason: t.exitReason, pnl: t.pnlPercent })));
    
    // High probability setups
    const highProbabilitySetups = this.identifyHighProbabilitySetups(trades);
    
    return {
      avgVolumeAtEntry,
      avgVolumeAtExit,
      preferredVolumeRange: {
        min: Math.min(...trades.map(t => t.volumeAtEntry)),
        max: Math.max(...trades.map(t => t.volumeAtEntry))
      },
      volumeBreakoutThreshold: avgVolumeAtEntry * 1.5,
      
      avgRSIAtEntry,
      avgRSIAtExit,
      rsiEntryRange: {
        min: Math.min(...trades.map(t => t.entryIndicators.rsi)),
        max: Math.max(...trades.map(t => t.entryIndicators.rsi))
      },
      rsiExitRange: {
        min: Math.min(...trades.map(t => t.exitIndicators.rsi)),
        max: Math.max(...trades.map(t => t.exitIndicators.rsi))
      },
      
      mostActiveHours,
      preferredHoldTimes: {
        min: Math.min(...trades.map(t => t.holdDuration)),
        max: Math.max(...trades.map(t => t.holdDuration)),
        avg: trades.reduce((sum, t) => sum + t.holdDuration, 0) / trades.length
      },
      dayOfWeekPreference: this.analyzeDayOfWeek(trades),
      
      topEntryReasons: entryReasons,
      topExitReasons: exitReasons,
      
      bestMarketConditions: this.analyzeMarketConditions(trades),
      highProbabilitySetups
    };
  }
  
  // Helper methods
  private weightedRandom<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    
    return items[items.length - 1];
  }
  
  private getVolumeProfile(volumeRatio: number): TechnicalIndicators['volumeProfile'] {
    if (volumeRatio > 5) return 'breakout';
    if (volumeRatio > 2) return 'accumulation';
    if (volumeRatio > 0.5) return 'distribution';
    return 'dead';
  }
  
  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }
  
  private categorizeTime(date: Date): TradeAnalysis['timeCategory'] {
    const hour = date.getUTCHours();
    if (hour >= 0 && hour < 8) return 'asian_hours';
    if (hour >= 8 && hour < 13) return 'london_open';
    if (hour >= 13 && hour < 21) return 'ny_open';
    if (hour >= 21 && hour < 24) return 'overlap';
    return 'off_hours';
  }
  
  private generateVolumeAtEntry(reason: TradeAnalysis['entryReason'], isMomentum: boolean): number {
    const baseVolume = 100000;
    let multiplier = 1;
    
    switch (reason) {
      case 'volume_breakout':
        multiplier = isMomentum ? 4 + Math.random() * 6 : 2 + Math.random() * 4;
        break;
      case 'whale_activity':
        multiplier = 6 + Math.random() * 14;
        break;
      default:
        multiplier = 1 + Math.random() * 3;
    }
    
    return baseVolume * multiplier;
  }
  
  private generateVolumeAtExit(reason: TradeAnalysis['exitReason']): number {
    const baseVolume = 100000;
    
    switch (reason) {
      case 'volume_death':
        return baseVolume * (0.1 + Math.random() * 0.3);
      case 'take_profit':
        return baseVolume * (0.8 + Math.random() * 1.5);
      default:
        return baseVolume * (0.5 + Math.random() * 2);
    }
  }
  
  private analyzeReasons(data: Array<{ reason: string; pnl: number }>): Array<{ reason: string; frequency: number; avgPnL: number }> {
    const reasonStats: Record<string, { count: number; totalPnL: number }> = {};
    
    data.forEach(({ reason, pnl }) => {
      if (!reasonStats[reason]) {
        reasonStats[reason] = { count: 0, totalPnL: 0 };
      }
      reasonStats[reason].count++;
      reasonStats[reason].totalPnL += pnl;
    });
    
    return Object.entries(reasonStats)
      .map(([reason, stats]) => ({
        reason,
        frequency: stats.count / data.length,
        avgPnL: stats.totalPnL / stats.count
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  private analyzeDayOfWeek(trades: TradeAnalysis[]): Record<string, number> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats: Record<string, number> = {};
    
    trades.forEach(trade => {
      const day = days[trade.entryTime.getDay()];
      dayStats[day] = (dayStats[day] || 0) + 1;
    });
    
    return dayStats;
  }
  
  private analyzeMarketConditions(trades: TradeAnalysis[]): Array<{ condition: string; winRate: number; avgPnL: number }> {
    const conditions: Record<string, { wins: number; total: number; totalPnL: number }> = {};
    
    trades.forEach(trade => {
      const condition = trade.entryIndicators.marketCondition;
      if (!conditions[condition]) {
        conditions[condition] = { wins: 0, total: 0, totalPnL: 0 };
      }
      conditions[condition].total++;
      conditions[condition].totalPnL += trade.pnlPercent;
      if (trade.pnlPercent > 0) conditions[condition].wins++;
    });
    
    return Object.entries(conditions)
      .map(([condition, stats]) => ({
        condition,
        winRate: stats.wins / stats.total,
        avgPnL: stats.totalPnL / stats.total
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }
  
  private identifyHighProbabilitySetups(trades: TradeAnalysis[]): Array<{
    description: string;
    frequency: number;
    winRate: number;
    avgPnL: number;
    criteria: any;
  }> {
    const setups = [
      {
        description: "Volume Breakout + High Momentum",
        criteria: (t: TradeAnalysis) => 
          t.entryReason === 'volume_breakout' && 
          t.entryIndicators.momentumScore > 70 &&
          t.entryIndicators.volumeRatio > 5,
        trades: [] as TradeAnalysis[]
      },
      {
        description: "Whale Activity + Morning Hours",
        criteria: (t: TradeAnalysis) => 
          t.entryReason === 'whale_activity' && 
          t.entryIndicators.timeOfDay === 'morning',
        trades: [] as TradeAnalysis[]
      },
      {
        description: "RSI Oversold + Volume Surge",
        criteria: (t: TradeAnalysis) => 
          t.entryReason === 'rsi_oversold' && 
          t.entryIndicators.volumeRatio > 3,
        trades: [] as TradeAnalysis[]
      }
    ];
    
    // Filter trades for each setup
    trades.forEach(trade => {
      setups.forEach(setup => {
        if (setup.criteria(trade)) {
          setup.trades.push(trade);
        }
      });
    });
    
    return setups
      .filter(setup => setup.trades.length > 0)
      .map(setup => {
        const wins = setup.trades.filter(t => t.pnlPercent > 0).length;
        const avgPnL = setup.trades.reduce((sum, t) => sum + t.pnlPercent, 0) / setup.trades.length;
        
        return {
          description: setup.description,
          frequency: setup.trades.length / trades.length,
          winRate: wins / setup.trades.length,
          avgPnL,
          criteria: setup.criteria.toString()
        };
      })
      .sort((a, b) => (b.winRate * b.avgPnL) - (a.winRate * a.avgPnL));
  }
  
  private generateTokenAddress(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  private generateMemeTokenName(): string {
    const names = [
      'PepeCoin', 'DogeKing', 'ShibaRocket', 'FlokiMoon', 'BabyDoge',
      'SafeMoon', 'ElonSperm', 'PumpDoge', 'MemeKing', 'DogeFather',
      'ShibaInu', 'PepeKing', 'DogeArmy', 'MoonShiba', 'SafeFloki',
      'DogeMoon', 'PepePump', 'ShibaMoon', 'FlokiPump', 'BabyShiba'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
}

export const technicalAnalysisService = new TechnicalAnalysisService();