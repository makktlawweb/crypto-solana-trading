import type {
  TradingParameters,
  InsertTradingParameters,
  Token,
  InsertToken,
  Trade,
  InsertTrade,
  Alert,
  InsertAlert,
  BacktestResult,
  InsertBacktestResult,
} from "@shared/schema";
import {
  tradingParameters,
  tokens,
  trades,
  alerts,
  backtestResults,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Trading Parameters
  getCurrentTradingParameters(): Promise<TradingParameters | undefined>;
  updateTradingParameters(params: InsertTradingParameters): Promise<TradingParameters>;

  // Tokens
  getAllTokens(): Promise<Token[]>;
  getTokenByAddress(address: string): Promise<Token | undefined>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(address: string, updates: Partial<Token>): Promise<Token | undefined>;
  getWatchedTokens(): Promise<Token[]>;
  getTokensByStatus(status: string): Promise<Token[]>;

  // Trades
  getAllTrades(): Promise<Trade[]>;
  getTradesByBacktestId(backtestId: string): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined>;
  getTradesByTimeframe(startTime: Date, endTime: Date): Promise<Trade[]>;

  // Alerts
  getAllAlerts(): Promise<Alert[]>;
  getUnreadAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<void>;

  // Backtest Results
  getAllBacktestResults(): Promise<BacktestResult[]>;
  getBacktestResult(backtestId: string): Promise<BacktestResult | undefined>;
  createBacktestResult(result: InsertBacktestResult): Promise<BacktestResult>;
}

export class DatabaseStorage implements IStorage {
  async getCurrentTradingParameters(): Promise<TradingParameters | undefined> {
    const [params] = await db.select().from(tradingParameters).where(eq(tradingParameters.isActive, true));
    return params || undefined;
  }

  async updateTradingParameters(params: InsertTradingParameters): Promise<TradingParameters> {
    // Deactivate current parameters
    await db.update(tradingParameters)
      .set({ isActive: false })
      .where(eq(tradingParameters.isActive, true));

    // Create new parameters
    const [newParams] = await db
      .insert(tradingParameters)
      .values({
        ...params,
        createdAt: new Date(),
      })
      .returning();
    
    return newParams;
  }

  async getAllTokens(): Promise<Token[]> {
    return await db.select().from(tokens);
  }

  async getTokenByAddress(address: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.address, address));
    return token || undefined;
  }

  async createToken(token: InsertToken): Promise<Token> {
    const [newToken] = await db
      .insert(tokens)
      .values(token)
      .returning();
    return newToken;
  }

  async updateToken(address: string, updates: Partial<Token>): Promise<Token | undefined> {
    const [updatedToken] = await db
      .update(tokens)
      .set(updates)
      .where(eq(tokens.address, address))
      .returning();
    return updatedToken || undefined;
  }

  async getWatchedTokens(): Promise<Token[]> {
    return await db.select().from(tokens).where(eq(tokens.status, 'watching'));
  }

  async getTokensByStatus(status: string): Promise<Token[]> {
    return await db.select().from(tokens).where(eq(tokens.status, status));
  }

  async getAllTrades(): Promise<Trade[]> {
    return await db.select().from(trades);
  }

  async getTradesByBacktestId(backtestId: string): Promise<Trade[]> {
    return await db.select().from(trades).where(eq(trades.backtestId, backtestId));
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db
      .insert(trades)
      .values(trade)
      .returning();
    return newTrade;
  }

  async updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined> {
    const [updatedTrade] = await db
      .update(trades)
      .set(updates)
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade || undefined;
  }

  async getTradesByTimeframe(startTime: Date, endTime: Date): Promise<Trade[]> {
    return await db.select().from(trades);
  }

  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts);
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.isRead, false));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values({
        ...alert,
        timestamp: new Date(),
      })
      .returning();
    return newAlert;
  }

  async markAlertAsRead(id: number): Promise<void> {
    await db
      .update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id));
  }

  async getAllBacktestResults(): Promise<BacktestResult[]> {
    return await db.select().from(backtestResults);
  }

  async getBacktestResult(backtestId: string): Promise<BacktestResult | undefined> {
    const [result] = await db.select().from(backtestResults).where(eq(backtestResults.backtestId, backtestId));
    return result || undefined;
  }

  async createBacktestResult(result: InsertBacktestResult): Promise<BacktestResult> {
    const [newResult] = await db
      .insert(backtestResults)
      .values({
        ...result,
        createdAt: new Date(),
      })
      .returning();
    return newResult;
  }
}

export const storage = new DatabaseStorage();