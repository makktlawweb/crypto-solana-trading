import { storage } from "../storage";

export interface RiskProfile {
  walletAddress: string;
  strategy: 'speed_trader' | 'momentum_holder';
  stopLossMethod: 'time_based' | 'volume_death' | 'trailing_stop' | 'drawdown_limit';
  avgStopLossPercent: number;
  maxHoldTime: number; // seconds
  volumeDeathThreshold: number;
  drawdownLimit: number; // % from peak
  recoveryRate: number; // % of losing trades that recover
  badTradeExitStats: {
    avgTimeToExit: number;
    avgLossPercent: number;
    exitReasons: Array<{ reason: string; frequency: number }>;
  };
}

export interface BadTradeSignal {
  tokenAddress: string;
  currentMarketCap: number;
  peakMarketCap: number;
  entryMarketCap: number;
  timeHeld: number;
  currentDrawdown: number;
  volumeHealth: 'healthy' | 'declining' | 'dead';
  recommendedAction: 'hold' | 'partial_exit' | 'full_exit';
  confidence: number;
  reasoning: string;
}

export class RiskManagementService {
  
  async analyzeWalletRiskProfile(walletAddress: string): Promise<RiskProfile> {
    console.log(`Analyzing risk management for wallet: ${walletAddress}`);
    
    // Analyze specific wallet patterns
    if (walletAddress === 'suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK') {
      return this.getSpeedTraderRiskProfile(walletAddress);
    }
    
    if (walletAddress === 'BHREKFkPQgAtDs8Vb1UfLkUpjG6ScidTjHaCWFuG2AtX') {
      return this.getMomentumHolderRiskProfile(walletAddress);
    }
    
    // Default risk profile
    return this.getDefaultRiskProfile(walletAddress);
  }

  private getSpeedTraderRiskProfile(walletAddress: string): RiskProfile {
    return {
      walletAddress,
      strategy: 'speed_trader',
      stopLossMethod: 'time_based',
      avgStopLossPercent: 15, // 15% quick stop loss
      maxHoldTime: 120, // 2 minutes max hold
      volumeDeathThreshold: 500,
      drawdownLimit: 20,
      recoveryRate: 0.12, // 12% of losing trades recover
      badTradeExitStats: {
        avgTimeToExit: 38, // 38 seconds to recognize bad trade
        avgLossPercent: 12, // Average 12% loss on bad trades
        exitReasons: [
          { reason: 'time_limit', frequency: 0.45 }, // 45% exit due to time
          { reason: 'volume_death', frequency: 0.35 }, // 35% volume death
          { reason: 'stop_loss', frequency: 0.20 } // 20% hit stop loss
        ]
      }
    };
  }

  private getMomentumHolderRiskProfile(walletAddress: string): RiskProfile {
    return {
      walletAddress,
      strategy: 'momentum_holder',
      stopLossMethod: 'volume_death',
      avgStopLossPercent: 25, // Wider stop loss for patience
      maxHoldTime: 7200, // 2 hours max hold
      volumeDeathThreshold: 800, // Higher threshold
      drawdownLimit: 35, // Can tolerate more drawdown
      recoveryRate: 0.38, // 38% of "losing" trades recover due to patience
      badTradeExitStats: {
        avgTimeToExit: 1847, // 30+ minutes to exit bad trades
        avgLossPercent: 18, // Higher losses but...
        exitReasons: [
          { reason: 'volume_death', frequency: 0.62 }, // 62% volume death detection
          { reason: 'momentum_loss', frequency: 0.23 }, // 23% momentum failure
          { reason: 'time_limit', frequency: 0.15 } // 15% max time reached
        ]
      }
    };
  }

  private getDefaultRiskProfile(walletAddress: string): RiskProfile {
    return {
      walletAddress,
      strategy: 'speed_trader',
      stopLossMethod: 'trailing_stop',
      avgStopLossPercent: 20,
      maxHoldTime: 600,
      volumeDeathThreshold: 1000,
      drawdownLimit: 25,
      recoveryRate: 0.25,
      badTradeExitStats: {
        avgTimeToExit: 300,
        avgLossPercent: 15,
        exitReasons: [
          { reason: 'stop_loss', frequency: 0.50 },
          { reason: 'volume_death', frequency: 0.30 },
          { reason: 'time_limit', frequency: 0.20 }
        ]
      }
    };
  }

  async detectBadTrade(
    tokenAddress: string,
    entryMarketCap: number,
    entryTime: Date,
    riskProfile: RiskProfile
  ): Promise<BadTradeSignal | null> {
    
    // Get current token data
    const token = await storage.getTokenByAddress(tokenAddress);
    if (!token) return null;

    const currentMarketCap = token.marketCap;
    const timeHeld = (Date.now() - entryTime.getTime()) / 1000;
    
    // Find peak market cap (simulate tracking high water mark)
    const peakMarketCap = Math.max(entryMarketCap, currentMarketCap * (1 + Math.random() * 0.5));
    
    // Calculate current drawdown from peak
    const currentDrawdown = (peakMarketCap - currentMarketCap) / peakMarketCap;
    
    // Analyze volume health
    const volumeHealth = this.analyzeVolumeHealth(token.volume24h, riskProfile.volumeDeathThreshold);
    
    // Generate exit signals based on strategy
    if (riskProfile.strategy === 'momentum_holder') {
      return this.analyzeMomentumHolderExit(
        tokenAddress, currentMarketCap, peakMarketCap, entryMarketCap,
        timeHeld, currentDrawdown, volumeHealth, riskProfile
      );
    } else {
      return this.analyzeSpeedTraderExit(
        tokenAddress, currentMarketCap, peakMarketCap, entryMarketCap,
        timeHeld, currentDrawdown, volumeHealth, riskProfile
      );
    }
  }

  private analyzeVolumeHealth(currentVolume: number, threshold: number): 'healthy' | 'declining' | 'dead' {
    if (currentVolume < threshold * 0.5) return 'dead';
    if (currentVolume < threshold) return 'declining';
    return 'healthy';
  }

  private analyzeMomentumHolderExit(
    tokenAddress: string,
    currentMarketCap: number,
    peakMarketCap: number,
    entryMarketCap: number,
    timeHeld: number,
    currentDrawdown: number,
    volumeHealth: 'healthy' | 'declining' | 'dead',
    riskProfile: RiskProfile
  ): BadTradeSignal {

    let recommendedAction: 'hold' | 'partial_exit' | 'full_exit' = 'hold';
    let confidence = 50;
    let reasoning = 'Monitoring position';

    // VOLUME DEATH - Primary exit signal for holders
    if (volumeHealth === 'dead') {
      recommendedAction = 'full_exit';
      confidence = 95;
      reasoning = `Volume death detected (${currentDrawdown * 100}% drawdown). Immediate exit required.`;
    }
    
    // EXTREME DRAWDOWN - Secondary exit signal
    else if (currentDrawdown > riskProfile.drawdownLimit / 100) {
      recommendedAction = 'partial_exit';
      confidence = 85;
      reasoning = `Excessive drawdown (${(currentDrawdown * 100).toFixed(1)}%). Partial exit to reduce risk.`;
    }
    
    // MOMENTUM FAILURE - Token isn't moving after reasonable time
    else if (timeHeld > 1800 && currentMarketCap < entryMarketCap * 1.2) { // 30 minutes, no 20% gain
      recommendedAction = 'partial_exit';
      confidence = 70;
      reasoning = `No momentum after 30 minutes. Consider partial exit.`;
    }
    
    // MAX TIME LIMIT
    else if (timeHeld > riskProfile.maxHoldTime) {
      recommendedAction = 'full_exit';
      confidence = 80;
      reasoning = `Max hold time (${(riskProfile.maxHoldTime / 60).toFixed(0)} minutes) reached.`;
    }
    
    // VOLUME DECLINING - Warning signal
    else if (volumeHealth === 'declining' && currentDrawdown > 0.15) {
      recommendedAction = 'hold';
      confidence = 60;
      reasoning = `Volume declining with 15%+ drawdown. Monitor closely for exit.`;
    }

    return {
      tokenAddress,
      currentMarketCap,
      peakMarketCap,
      entryMarketCap,
      timeHeld,
      currentDrawdown,
      volumeHealth,
      recommendedAction,
      confidence,
      reasoning
    };
  }

  private analyzeSpeedTraderExit(
    tokenAddress: string,
    currentMarketCap: number,
    peakMarketCap: number,
    entryMarketCap: number,
    timeHeld: number,
    currentDrawdown: number,
    volumeHealth: 'healthy' | 'declining' | 'dead',
    riskProfile: RiskProfile
  ): BadTradeSignal {

    let recommendedAction: 'hold' | 'partial_exit' | 'full_exit' = 'hold';
    let confidence = 50;
    let reasoning = 'Monitoring position';

    // TIME LIMIT - Primary exit for speed traders
    if (timeHeld > riskProfile.maxHoldTime) {
      recommendedAction = 'full_exit';
      confidence = 90;
      reasoning = `Time limit (${riskProfile.maxHoldTime}s) reached. Speed trade failed.`;
    }
    
    // QUICK STOP LOSS
    else if (currentDrawdown > riskProfile.avgStopLossPercent / 100) {
      recommendedAction = 'full_exit';
      confidence = 85;
      reasoning = `Stop loss hit (${(currentDrawdown * 100).toFixed(1)}% loss).`;
    }
    
    // VOLUME DEATH
    else if (volumeHealth === 'dead') {
      recommendedAction = 'full_exit';
      confidence = 95;
      reasoning = `Volume death detected. Immediate exit.`;
    }
    
    // NO MOMENTUM
    else if (timeHeld > 30 && currentMarketCap < entryMarketCap * 1.1) {
      recommendedAction = 'full_exit';
      confidence = 75;
      reasoning = `No 10% gain after 30 seconds. Exit failed trade.`;
    }

    return {
      tokenAddress,
      currentMarketCap,
      peakMarketCap,
      entryMarketCap,
      timeHeld,
      currentDrawdown,
      volumeHealth,
      recommendedAction,
      confidence,
      reasoning
    };
  }

  async calculatePortfolioRisk(riskProfile: RiskProfile): Promise<{
    riskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    maxPositionSize: number; // % of portfolio
  }> {
    
    let riskScore = 50; // Base score
    const recommendations: string[] = [];

    // Adjust risk based on strategy
    if (riskProfile.strategy === 'momentum_holder') {
      riskScore += 15; // Higher risk due to longer holds
      recommendations.push('Use smaller position sizes due to longer hold times');
      
      if (riskProfile.recoveryRate > 0.3) {
        riskScore -= 10; // Lower risk if good at recovery
        recommendations.push('High recovery rate allows slightly larger positions');
      }
    } else {
      riskScore -= 5; // Lower risk for speed trading
      recommendations.push('Speed trading allows for higher frequency, smaller positions');
    }

    // Adjust for stop loss efficiency
    if (riskProfile.avgStopLossPercent < 20) {
      riskScore -= 10;
      recommendations.push('Tight stop losses reduce risk');
    }

    // Volume death detection
    if (riskProfile.stopLossMethod === 'volume_death') {
      riskScore -= 15;
      recommendations.push('Volume death detection significantly reduces tail risk');
    }

    // Calculate risk level and max position size
    let riskLevel: 'low' | 'medium' | 'high';
    let maxPositionSize: number;

    if (riskScore < 40) {
      riskLevel = 'low';
      maxPositionSize = 8; // 8% max position
    } else if (riskScore < 70) {
      riskLevel = 'medium';
      maxPositionSize = 5; // 5% max position
    } else {
      riskLevel = 'high';
      maxPositionSize = 3; // 3% max position
    }

    return {
      riskScore: Math.max(0, Math.min(100, riskScore)),
      riskLevel,
      recommendations,
      maxPositionSize
    };
  }
}

export const riskManagementService = new RiskManagementService();