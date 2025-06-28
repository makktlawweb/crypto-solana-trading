import { Connection, PublicKey } from '@solana/web3.js';

export interface WalletAnalysis {
  topHoldersPercent: number;
  bundlerPercent: number;
  uniqueHolders: number;
  holderConcentrationRisk: 'low' | 'medium' | 'high' | 'critical';
  suspiciousWallets: string[];
  distribution: {
    top1Percent: number;
    top5Percent: number;
    top10Percent: number;
  };
}

export interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
  isSuspicious: boolean;
  suspicionReasons: string[];
}

export class WalletAnalysisService {
  private connection: Connection;
  private knownBundlers: Set<string>;
  
  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    this.knownBundlers = new Set([
      // Known bundler patterns - would be populated from research
      '11111111111111111111111111111112', // System program
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token program
    ]);
  }

  async analyzeTokenHolders(tokenAddress: string): Promise<WalletAnalysis> {
    try {
      const holders = await this.getTokenHolders(tokenAddress);
      const totalSupply = holders.reduce((sum, holder) => sum + holder.balance, 0);
      
      // Calculate holder percentages
      const holdersWithPercentage = holders
        .map(holder => ({
          ...holder,
          percentage: (holder.balance / totalSupply) * 100
        }))
        .sort((a, b) => b.percentage - a.percentage);

      // Analyze concentration
      const topHoldersPercent = holdersWithPercentage
        .slice(0, 10)
        .reduce((sum, holder) => sum + holder.percentage, 0);

      const bundlerPercent = holdersWithPercentage
        .filter(holder => this.isBundler(holder.address))
        .reduce((sum, holder) => sum + holder.percentage, 0);

      // Detect suspicious patterns
      const suspiciousWallets = this.detectSuspiciousWallets(holdersWithPercentage);
      
      // Risk assessment
      const holderConcentrationRisk = this.assessConcentrationRisk(
        topHoldersPercent, 
        bundlerPercent, 
        holdersWithPercentage.length
      );

      return {
        topHoldersPercent,
        bundlerPercent,
        uniqueHolders: holdersWithPercentage.length,
        holderConcentrationRisk,
        suspiciousWallets: suspiciousWallets.map(w => w.address),
        distribution: {
          top1Percent: holdersWithPercentage[0]?.percentage || 0,
          top5Percent: holdersWithPercentage.slice(0, 5).reduce((sum, h) => sum + h.percentage, 0),
          top10Percent: topHoldersPercent
        }
      };
    } catch (error) {
      console.error('Wallet analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  private async getTokenHolders(tokenAddress: string): Promise<TokenHolder[]> {
    // In a real implementation, this would use Solana SPL token account queries
    // For now, simulate realistic holder distributions based on Solana patterns
    return this.simulateRealisticHolderDistribution(tokenAddress);
  }

  private simulateRealisticHolderDistribution(tokenAddress: string): TokenHolder[] {
    // Simulate realistic Solana meme coin holder patterns
    const holders: TokenHolder[] = [];
    const totalHolders = Math.floor(Math.random() * 800) + 200; // 200-1000 holders
    let remainingSupply = 1000000; // 1M tokens
    
    // Top holder (often creator/team) - 15-40%
    const topHolderPercent = 15 + Math.random() * 25;
    const topHolderBalance = (remainingSupply * topHolderPercent) / 100;
    holders.push({
      address: this.generateRandomAddress(),
      balance: topHolderBalance,
      percentage: topHolderPercent,
      isSuspicious: topHolderPercent > 30,
      suspicionReasons: topHolderPercent > 30 ? ['high_concentration'] : []
    });
    remainingSupply -= topHolderBalance;

    // Generate remaining holders with power law distribution
    for (let i = 1; i < Math.min(totalHolders, 50); i++) {
      const power = Math.pow(i + 1, -1.2); // Power law decay
      const balance = Math.min(remainingSupply * power * 0.1, remainingSupply * 0.1);
      const address = this.generateRandomAddress();
      
      holders.push({
        address,
        balance,
        percentage: (balance / 1000000) * 100,
        isSuspicious: this.isBundler(address) || balance > remainingSupply * 0.05,
        suspicionReasons: this.getSuspicionReasons(address, balance, remainingSupply)
      });
      remainingSupply -= balance;
    }

    return holders;
  }

  private isBundler(address: string): boolean {
    // Check against known bundler patterns
    if (this.knownBundlers.has(address)) return true;
    
    // Simple heuristics for bundler detection
    // Real implementation would use more sophisticated analysis
    return Math.random() < 0.05; // 5% chance of being flagged as bundler
  }

  private detectSuspiciousWallets(holders: (TokenHolder & { percentage: number })[]): TokenHolder[] {
    return holders.filter(holder => {
      // High concentration
      if (holder.percentage > 10) return true;
      
      // Known bundler
      if (this.isBundler(holder.address)) return true;
      
      // Pattern matching for suspicious addresses
      if (this.hasMatchingSuffixPattern(holder.address, holders)) return true;
      
      return false;
    });
  }

  private hasMatchingSuffixPattern(address: string, holders: (TokenHolder & { percentage: number })[]): boolean {
    // Check for addresses with similar patterns (bundler coordination)
    const suffix = address.slice(-8);
    const matchingPatterns = holders.filter(h => 
      h.address !== address && h.address.slice(-8) === suffix
    );
    return matchingPatterns.length > 2;
  }

  private assessConcentrationRisk(
    topHoldersPercent: number, 
    bundlerPercent: number, 
    totalHolders: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Risk assessment based on Padre/Axion style metrics
    if (topHoldersPercent > 80 || bundlerPercent > 30) return 'critical';
    if (topHoldersPercent > 60 || bundlerPercent > 15 || totalHolders < 100) return 'high';
    if (topHoldersPercent > 40 || bundlerPercent > 5 || totalHolders < 300) return 'medium';
    return 'low';
  }

  private getSuspicionReasons(address: string, balance: number, totalSupply: number): string[] {
    const reasons: string[] = [];
    
    if (balance > totalSupply * 0.1) reasons.push('high_concentration');
    if (this.isBundler(address)) reasons.push('known_bundler');
    if (balance > totalSupply * 0.05) reasons.push('whale_wallet');
    
    return reasons;
  }

  private generateRandomAddress(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getDefaultAnalysis(): WalletAnalysis {
    return {
      topHoldersPercent: 0,
      bundlerPercent: 0,
      uniqueHolders: 0,
      holderConcentrationRisk: 'critical',
      suspiciousWallets: [],
      distribution: {
        top1Percent: 0,
        top5Percent: 0,
        top10Percent: 0
      }
    };
  }

  // Enhanced strategy filtering based on wallet analysis
  isTokenSafeForTrading(analysis: WalletAnalysis): boolean {
    // Conservative filtering based on Padre/Axion insights
    if (analysis.holderConcentrationRisk === 'critical') return false;
    if (analysis.bundlerPercent > 20) return false; // High bundler risk
    if (analysis.topHoldersPercent > 70) return false; // Too concentrated
    if (analysis.uniqueHolders < 150) return false; // Too few holders
    if (analysis.distribution.top1Percent > 25) return false; // Single whale risk
    
    return true;
  }
}

export const walletAnalysisService = new WalletAnalysisService();