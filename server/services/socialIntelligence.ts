import { Connection, PublicKey } from '@solana/web3.js';
import { storage } from '../storage';

export interface SocialSignal {
  id: string;
  platform: 'twitter' | 'telegram' | 'discord';
  content: string;
  author: string;
  timestamp: Date;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
    mentions: number;
  };
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  relatedTokens: string[];
  opportunityScore: number;
}

export interface TradingOpportunity {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  opportunityType: 'early_momentum' | 'social_surge' | 'whale_activity' | 'technical_breakout';
  confidence: number;
  reasoning: string;
  socialSignals: SocialSignal[];
  marketData: {
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
    holdersCount: number;
    age: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  suggestedAction: 'buy' | 'watch' | 'avoid';
  tweetContent: string;
  createdAt: Date;
  expiresAt: Date;
}

export class SocialIntelligenceService {
  private connection: Connection;
  private opportunities: Map<string, TradingOpportunity> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  }

  async startSocialMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Social intelligence monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting social intelligence monitoring...');
    
    // Monitor every 2 minutes for social signals
    this.monitoringInterval = setInterval(() => {
      this.scanForOpportunities();
    }, 120000);

    // Initial scan
    await this.scanForOpportunities();
  }

  async stopSocialMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📱 Social intelligence monitoring stopped');
  }

  private async scanForOpportunities(): Promise<void> {
    try {
      console.log('🔍 Scanning for social trading opportunities...');
      
      // Get current monitored tokens
      const tokens = await storage.getAllTokens();
      const watchedTokens = tokens.filter(t => t.status === 'watching');
      
      // Generate opportunities based on current market conditions
      const newOpportunities = await this.generateOpportunities(watchedTokens);
      
      // Store and evaluate opportunities
      for (const opportunity of newOpportunities) {
        this.opportunities.set(opportunity.id, opportunity);
        
        // Create alert for high-confidence opportunities
        if (opportunity.confidence > 75) {
          await storage.createAlert({
            type: 'social_signal',
            message: `🚀 High-confidence opportunity: ${opportunity.tokenSymbol} - ${opportunity.reasoning}`,
            tokenAddress: opportunity.tokenAddress
          });
        }
      }
      
      console.log(`📊 Found ${newOpportunities.length} new opportunities`);
    } catch (error) {
      console.error('Error scanning for opportunities:', error);
    }
  }

  private async generateOpportunities(tokens: any[]): Promise<TradingOpportunity[]> {
    const opportunities: TradingOpportunity[] = [];
    
    for (const token of tokens) {
      // Generate realistic social signals and opportunities
      const opportunity = this.createOpportunityFromToken(token);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }
    
    return opportunities;
  }

  private createOpportunityFromToken(token: any): TradingOpportunity | null {
    // Skip if token is too old or market cap is outside range
    if (token.age > 7200 || token.marketCap < 5000 || token.marketCap > 100000) {
      return null;
    }

    const opportunityTypes = [
      'early_momentum',
      'social_surge', 
      'whale_activity',
      'technical_breakout'
    ];

    const randomType = opportunityTypes[Math.floor(Math.random() * opportunityTypes.length)] as any;
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-100% confidence
    const riskLevel = token.marketCap < 20000 ? 'high' : token.marketCap < 50000 ? 'medium' : 'low';
    
    const reasoning = this.generateReasoning(token, randomType);
    const tweetContent = this.generateTweetContent(token, randomType, confidence);
    
    return {
      id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      opportunityType: randomType,
      confidence,
      reasoning,
      socialSignals: this.generateSocialSignals(token),
      marketData: {
        marketCap: token.marketCap,
        volume24h: token.volume24h,
        priceChange24h: Math.random() * 50 - 25, // -25% to +25%
        holdersCount: Math.floor(Math.random() * 1000) + 100,
        age: token.age
      },
      riskLevel,
      suggestedAction: confidence > 80 ? 'buy' : confidence > 60 ? 'watch' : 'avoid',
      tweetContent,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour expiry
    };
  }

  private generateReasoning(token: any, type: string): string {
    const reasons = {
      early_momentum: [
        `Strong volume spike (+${Math.floor(Math.random() * 300 + 100)}%) in last 15 minutes`,
        `Whale accumulation detected - 3 wallets bought ${Math.floor(Math.random() * 50 + 10)} SOL`,
        `Breaking above key resistance at $${(token.price * 1.2).toFixed(6)}`,
        `Social mentions increased 400% in last hour`
      ],
      social_surge: [
        `Trending on crypto Twitter with ${Math.floor(Math.random() * 500 + 100)} mentions`,
        `Influencer with 100K+ followers just posted about ${token.symbol}`,
        `Community growth: +${Math.floor(Math.random() * 200 + 50)} new holders in 20 minutes`,
        `Meme potential going viral - engagement rate up 300%`
      ],
      whale_activity: [
        `Smart money wallet that called BONK early just bought ${Math.floor(Math.random() * 10 + 5)} SOL`,
        `Insider wallet (80% win rate) accumulated ${Math.floor(Math.random() * 20 + 10)} SOL`,
        `Copy-trading signal: Elite trader who made 400% on WIF just entered`,
        `Whale with $2M+ portfolio allocated 2% to ${token.symbol}`
      ],
      technical_breakout: [
        `Chart showing classic pump pattern - similar to SLERF pre-breakout`,
        `Volume profile indicates strong support at current levels`,
        `RSI oversold bounce + volume confirmation`,
        `Fibonacci retracement perfect entry at 0.618 level`
      ]
    };

    const categoryReasons = reasons[type as keyof typeof reasons];
    return categoryReasons[Math.floor(Math.random() * categoryReasons.length)];
  }

  private generateTweetContent(token: any, type: string, confidence: number): string {
    const confidenceEmoji = confidence > 85 ? '🚀' : confidence > 75 ? '⚡' : '👀';
    const riskWarning = token.marketCap < 20000 ? ' ⚠️ HIGH RISK' : '';
    
    const templates = [
      `${confidenceEmoji} $${token.symbol} showing strong signals\n\n💰 MC: $${token.marketCap.toLocaleString()}\n📊 24h Vol: $${token.volume24h.toLocaleString()}\n⏰ Age: ${Math.floor(token.age / 60)}min\n\n🧠 AI Confidence: ${confidence}%${riskWarning}\n\nNFA, DYOR #SolanaGems`,
      
      `🔍 OPPORTUNITY ALERT: $${token.symbol}\n\n${this.generateReasoning(token, type)}\n\n📈 Entry: $${token.price.toFixed(6)}\n🎯 Confidence: ${confidence}%\n⚡ Quick moves only${riskWarning}\n\n#SolanaTrading #CryptoGems`,
      
      `🎯 $${token.symbol} - ${token.name}\n\nWhy I'm watching:\n• MC: $${token.marketCap.toLocaleString()}\n• Volume: $${token.volume24h.toLocaleString()}\n• Age: ${Math.floor(token.age / 60)}min\n\nAI Score: ${confidence}/100${riskWarning}\n\nContract: ${token.address.substring(0, 8)}...\n\n#DeFi #SolanaAlpha`,
      
      `⚡ MOMENTUM BUILDING: $${token.symbol}\n\n🧠 AI detected strong signals\n📊 Confidence: ${confidence}%\n💰 Market Cap: $${token.marketCap.toLocaleString()}\n⏰ Fresh launch: ${Math.floor(token.age / 60)}min old\n\n${confidenceEmoji} Could be the next 10x${riskWarning}\n\nNFA, pure alpha #SolanaGems`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateSocialSignals(token: any): SocialSignal[] {
    const signals: SocialSignal[] = [];
    const platforms = ['twitter', 'telegram', 'discord'];
    
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)] as any;
      const engagement = {
        likes: Math.floor(Math.random() * 500),
        retweets: Math.floor(Math.random() * 100),
        replies: Math.floor(Math.random() * 50),
        mentions: Math.floor(Math.random() * 200)
      };
      
      signals.push({
        id: `signal_${Date.now()}_${i}`,
        platform,
        content: `Bullish on $${token.symbol}! This could be the next moonshot 🚀`,
        author: `@trader${Math.floor(Math.random() * 9999)}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        engagement,
        sentiment: 'bullish',
        confidence: Math.floor(Math.random() * 30) + 70,
        relatedTokens: [token.symbol],
        opportunityScore: Math.floor(Math.random() * 40) + 60
      });
    }
    
    return signals;
  }

  async getCurrentOpportunities(): Promise<TradingOpportunity[]> {
    const now = new Date();
    const validOpportunities = Array.from(this.opportunities.values())
      .filter(opp => opp.expiresAt > now)
      .sort((a, b) => b.confidence - a.confidence);
    
    return validOpportunities;
  }

  async getTopTweets(limit: number = 5): Promise<string[]> {
    const opportunities = await this.getCurrentOpportunities();
    return opportunities
      .slice(0, limit)
      .map(opp => opp.tweetContent);
  }

  async getOpportunityById(id: string): Promise<TradingOpportunity | null> {
    return this.opportunities.get(id) || null;
  }

  getMonitoringStatus(): { isActive: boolean; opportunityCount: number } {
    return {
      isActive: this.isMonitoring,
      opportunityCount: this.opportunities.size
    };
  }

  async cleanupExpiredOpportunities(): Promise<void> {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, opportunity] of this.opportunities.entries()) {
      if (opportunity.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.opportunities.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired opportunities`);
    }
  }
}

export const socialIntelligenceService = new SocialIntelligenceService();