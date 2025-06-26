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

  constructor() {
    this.pumpFunApi = process.env.PUMPFUN_API_URL || "https://api.pumpfun.com";
    this.jupiterApi = process.env.JUPITER_API_URL || "https://quote-api.jup.ag";
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

  async getHistoricalTokenData(timeframeHours: number = 168): Promise<TokenData[]> {
    try {
      // This would fetch historical token data for backtesting
      // For now, return empty array since we don't have access to historical data
      const response = await axios.get(`${this.pumpFunApi}/tokens/historical`, {
        params: { hours: timeframeHours },
        timeout: 30000,
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
              dexSource: tokenData.dexSource || "pumpfun",
            });
          }
        }
      }

      return tokens;
    } catch (error) {
      console.error("Error fetching historical token data:", error);
      return [];
    }
  }
}

export const dexApiService = new DexApiService();
