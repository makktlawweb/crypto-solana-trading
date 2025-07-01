import { storage } from "../storage";
import { dexApiService } from "./dexApi";
import type { Token } from "@shared/schema";

export interface MomentumSignal {
  tokenAddress: string;
  signalType: 'early_momentum' | 'volume_surge' | 'sustained_growth' | 'breakout_ready';
  confidence: number; // 0-100
  marketCapTrend: 'rising' | 'stable' | 'volatile';
  volumeHealth: 'healthy' | 'declining' | 'dead';
  entryRecommendation: number; // Suggested entry market cap
  reasoning: string;
}

export class MomentumDetectionService {
  private priceHistory: Map<string, Array<{ timestamp: Date; marketCap: number; volume: number }>> = new Map();

  async analyzeTokenMomentum(token: Token): Promise<MomentumSignal | null> {
    // Build price history for this token
    await this.updatePriceHistory(token);
    
    const history = this.priceHistory.get(token.address);
    if (!history || history.length < 3) {
      return null; // Need at least 3 data points
    }

    // Analyze different momentum patterns
    const signals = [
      this.detectEarlyMomentum(token, history),
      this.detectVolumeSurge(token, history),
      this.detectSustainedGrowth(token, history),
      this.detectBreakoutReady(token, history)
    ];

    // Return highest confidence signal
    const bestSignal = signals
      .filter(s => s !== null)
      .sort((a, b) => b!.confidence - a!.confidence)[0];

    return bestSignal || null;
  }

  private async updatePriceHistory(token: Token): Promise<void> {
    const currentData = {
      timestamp: new Date(),
      marketCap: token.marketCap,
      volume: token.volume24h
    };

    if (!this.priceHistory.has(token.address)) {
      this.priceHistory.set(token.address, []);
    }

    const history = this.priceHistory.get(token.address)!;
    history.push(currentData);

    // Keep only last 20 data points (avoid memory bloat)
    if (history.length > 20) {
      history.shift();
    }
  }

  private detectEarlyMomentum(token: Token, history: Array<{ timestamp: Date; marketCap: number; volume: number }>): MomentumSignal | null {
    if (history.length < 3) return null;

    const recent = history.slice(-3);
    const growthRate = (recent[2].marketCap - recent[0].marketCap) / recent[0].marketCap;
    const volumeStable = recent.every(h => h.volume > 1000); // Volume viability check

    // Look for tokens showing 20%+ growth with stable volume in 8K-25K range
    if (token.marketCap >= 8000 && token.marketCap <= 25000 && growthRate > 0.2 && volumeStable) {
      return {
        tokenAddress: token.address,
        signalType: 'early_momentum',
        confidence: Math.min(95, 60 + (growthRate * 100)), // Scale confidence with growth
        marketCapTrend: 'rising',
        volumeHealth: 'healthy',
        entryRecommendation: token.marketCap * 1.1, // Enter slightly above current
        reasoning: `Token showing ${(growthRate * 100).toFixed(1)}% growth with healthy volume. Early momentum phase detected.`
      };
    }

    return null;
  }

  private detectVolumeSurge(token: Token, history: Array<{ timestamp: Date; marketCap: number; volume: number }>): MomentumSignal | null {
    if (history.length < 4) return null;

    const recent = history.slice(-2);
    const baseline = history.slice(-4, -2);
    
    const recentAvgVolume = recent.reduce((sum, h) => sum + h.volume, 0) / recent.length;
    const baselineAvgVolume = baseline.reduce((sum, h) => sum + h.volume, 0) / baseline.length;
    
    const volumeIncrease = recentAvgVolume / baselineAvgVolume;

    // Volume surge with market cap in safe zone
    if (token.marketCap >= 6000 && token.marketCap <= 30000 && volumeIncrease > 2.5) {
      return {
        tokenAddress: token.address,
        signalType: 'volume_surge',
        confidence: Math.min(90, 50 + (volumeIncrease * 10)),
        marketCapTrend: recent[1].marketCap > recent[0].marketCap ? 'rising' : 'volatile',
        volumeHealth: 'healthy',
        entryRecommendation: Math.min(token.marketCap * 1.15, 35000), // Cap entry recommendation
        reasoning: `Volume surged ${volumeIncrease.toFixed(1)}x above baseline. Indicates incoming momentum.`
      };
    }

    return null;
  }

  private detectSustainedGrowth(token: Token, history: Array<{ timestamp: Date; marketCap: number; volume: number }>): MomentumSignal | null {
    if (history.length < 5) return null;

    const recent5 = history.slice(-5);
    let consecutiveGrowth = 0;
    
    for (let i = 1; i < recent5.length; i++) {
      if (recent5[i].marketCap > recent5[i-1].marketCap) {
        consecutiveGrowth++;
      } else {
        break;
      }
    }

    // 4+ consecutive growth periods with consistent volume
    if (consecutiveGrowth >= 4 && token.marketCap >= 10000 && token.marketCap <= 50000) {
      const avgVolume = recent5.reduce((sum, h) => sum + h.volume, 0) / recent5.length;
      const volumeConsistency = recent5.every(h => h.volume > avgVolume * 0.5);

      if (volumeConsistency) {
        return {
          tokenAddress: token.address,
          signalType: 'sustained_growth',
          confidence: 85,
          marketCapTrend: 'rising',
          volumeHealth: 'healthy',
          entryRecommendation: token.marketCap * 1.05, // Conservative entry on sustained growth
          reasoning: `${consecutiveGrowth} consecutive growth periods with consistent volume. Sustained momentum confirmed.`
        };
      }
    }

    return null;
  }

  private detectBreakoutReady(token: Token, history: Array<{ timestamp: Date; marketCap: number; volume: number }>): MomentumSignal | null {
    if (history.length < 6) return null;

    // Look for tokens consolidating around key resistance levels
    const recent6 = history.slice(-6);
    const marketCaps = recent6.map(h => h.marketCap);
    const avgMarketCap = marketCaps.reduce((sum, cap) => sum + cap, 0) / marketCaps.length;
    const volatility = Math.max(...marketCaps) / Math.min(...marketCaps);

    // Low volatility (consolidation) followed by volume increase
    const recentVolume = recent6.slice(-2).reduce((sum, h) => sum + h.volume, 0) / 2;
    const baselineVolume = recent6.slice(0, 4).reduce((sum, h) => sum + h.volume, 0) / 4;
    const volumeIncrease = recentVolume / baselineVolume;

    // Consolidating around 15K-100K with volume building
    if (avgMarketCap >= 15000 && avgMarketCap <= 100000 && volatility < 1.3 && volumeIncrease > 1.5) {
      return {
        tokenAddress: token.address,
        signalType: 'breakout_ready',
        confidence: 75,
        marketCapTrend: 'stable',
        volumeHealth: 'healthy',
        entryRecommendation: avgMarketCap * 1.1, // Enter on breakout
        reasoning: `Token consolidating around ${avgMarketCap.toFixed(0)} with building volume. Breakout setup detected.`
      };
    }

    return null;
  }

  async getAllMomentumSignals(): Promise<MomentumSignal[]> {
    const tokens = await storage.getAllTokens();
    const signals: MomentumSignal[] = [];

    for (const token of tokens) {
      const signal = await this.analyzeTokenMomentum(token);
      if (signal) {
        signals.push(signal);
      }
    }

    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  // Clear old data to prevent memory leaks
  cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const entries = Array.from(this.priceHistory.entries());
    for (const [address, history] of entries) {
      const filteredHistory = history.filter(h => h.timestamp > cutoffTime);
      if (filteredHistory.length === 0) {
        this.priceHistory.delete(address);
      } else {
        this.priceHistory.set(address, filteredHistory);
      }
    }
  }
}

export const momentumDetectionService = new MomentumDetectionService();