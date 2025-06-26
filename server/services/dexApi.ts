import axios from "axios";
import type { InsertToken } from "@shared/schema";

export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  marketCap: number;
  price: number;
  volume24h: number;
  createdAt: Date;
  dexSource: string;
}

export class DexApiService {
  private pumpFunApi: string;
  private jupiterApi: string;
  private dexScreenerApi: string;

  constructor() {
    this.pumpFunApi = process.env.PUMPFUN_API_URL || "https://api.pumpfun.com";
    this.jupiterApi = process.env.JUPITER_API_URL || "https://quote-api.jup.ag";
    this.dexScreenerApi = "https://api.dexscreener.com/latest/dex";
  }

  async getNewTokensFromPumpFun(maxAgeMinutes: number = 2): Promise<TokenData[]> {
    try {
      // This would be the actual PumpFun API call
      // For now, we'll return an empty array since we don't have access to real API
      const response = await axios.get(`${this.pumpFunApi}/tokens/new`, {
        params: { maxAge: maxAgeMinutes },
        timeout: 10000,
      }).catch(() => ({ data: [] }));

      const tokens: TokenData[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        for (const tokenData of response.data) {
          if (this.isValidTokenData(tokenData)) {
            tokens.push({
              address: tokenData.address,
              name: tokenData.name,
              symbol: tokenData.symbol,
              marketCap: tokenData.marketCap || 0,
              price: tokenData.price || 0,
              volume24h: tokenData.volume24h || 0,
              createdAt: new Date(tokenData.createdAt),
              dexSource: "pumpfun",
            });
          }
        }
      }

      return tokens;
    } catch (error) {
      console.error("Error fetching tokens from PumpFun:", error);
      return [];
    }
  }

  async getTokenPrice(tokenAddress: string): Promise<number | null> {
    try {
      const response = await axios.get(`${this.jupiterApi}/v1/price`, {
        params: { id: tokenAddress },
        timeout: 5000,
      });

      return response.data?.price || null;
    } catch (error) {
      console.error("Error fetching token price:", error);
      return null;
    }
  }

  async getTokenMetadata(tokenAddress: string): Promise<Partial<TokenData> | null> {
    try {
      // This would fetch metadata from various sources
      // For now, return null to indicate no metadata found
      return null;
    } catch (error) {
      console.error("Error fetching token metadata:", error);
      return null;
    }
  }

  private isValidTokenData(data: any): boolean {
    return (
      data &&
      typeof data.address === "string" &&
      typeof data.name === "string" &&
      typeof data.symbol === "string" &&
      data.address.length > 0 &&
      data.name.length > 0 &&
      data.symbol.length > 0
    );
  }

  async getNewTokensFromDexScreener(maxAgeMinutes: number = 2): Promise<TokenData[]> {
    try {
      // Use the correct DexScreener endpoint that works
      const response = await axios.get(`${this.dexScreenerApi}/search`, {
        params: {
          q: 'solana'
        },
        timeout: 10000,
      });

      const tokens: TokenData[] = [];
      const cutoffTime = Date.now() - (maxAgeMinutes * 60 * 1000);
      
      if (response.data?.pairs && Array.isArray(response.data.pairs)) {
        for (const pair of response.data.pairs.slice(0, 50)) {
          if (pair.pairCreatedAt) {
            const createdAt = new Date(pair.pairCreatedAt);
            
            // Only include tokens created within the specified timeframe
            if (createdAt.getTime() > cutoffTime) {
              const token = this.extractTokenFromDexScreenerPair(pair);
              if (token) {
                tokens.push(token);
              }
            }
          }
        }
      }

      console.log(`DexScreener: Found ${tokens.length} tokens created in last ${maxAgeMinutes} minutes`);
      return tokens;
    } catch (error) {
      console.error("Error fetching tokens from DexScreener:", error);
      return [];
    }
  }

  async getHistoricalTokenData(timeframeHours: number = 168): Promise<TokenData[]> {
    try {
      // Get recent pairs from DexScreener for historical analysis
      const response = await axios.get(`${this.dexScreenerApi}/search/pairs`, {
        params: {
          q: 'SOL',
          chainId: 'solana'
        },
        timeout: 10000,
      });

      const tokens: TokenData[] = [];
      const cutoffTime = Date.now() - (timeframeHours * 60 * 60 * 1000);
      
      if (response.data?.pairs && Array.isArray(response.data.pairs)) {
        for (const pair of response.data.pairs.slice(0, 100)) { // Get more for historical analysis
          if (pair.pairCreatedAt) {
            const createdAt = new Date(pair.pairCreatedAt);
            
            // Include tokens created within the specified timeframe
            if (createdAt.getTime() > cutoffTime) {
              const token = this.extractTokenFromDexScreenerPair(pair);
              if (token) {
                tokens.push(token);
              }
            }
          }
        }
      }

      return tokens;
    } catch (error) {
      console.error("Error fetching historical token data from DexScreener:", error);
      return [];
    }
  }

  private extractTokenFromDexScreenerPair(pair: any): TokenData | null {
    try {
      if (!pair.baseToken || !pair.quoteToken) return null;
      
      // Prefer the base token if it's not SOL, otherwise use quote token
      const token = pair.baseToken.symbol !== 'SOL' ? pair.baseToken : pair.quoteToken;
      
      if (!token.address || !token.name || !token.symbol) return null;

      return {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        marketCap: pair.fdv || pair.marketCap || 0,
        price: parseFloat(pair.priceUsd) || 0,
        volume24h: pair.volume?.h24 || 0,
        createdAt: new Date(pair.pairCreatedAt),
        dexSource: pair.dexId || "unknown",
      };
    } catch (error) {
      console.error("Error extracting token from DexScreener pair:", error);
      return null;
    }
  }
}

export const dexApiService = new DexApiService();
