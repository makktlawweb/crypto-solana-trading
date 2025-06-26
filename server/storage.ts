import {
  tokens,
  trades,
  alerts,
  tradingParameters,
  backtestResults,
  type Token,
  type Trade,
  type Alert,
  type TradingParameters,
  type BacktestResult,
  type InsertToken,
  type InsertTrade,
  type InsertAlert,
  type InsertTradingParameters,
  type InsertBacktestResult,
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private tradingParams: Map<number, TradingParameters>;
  private tokens: Map<string, Token>; // Using address as key
  private trades: Map<number, Trade>;
  private alerts: Map<number, Alert>;
  private backtestResults: Map<string, BacktestResult>; // Using backtestId as key
  
  private currentParamsId: number;
  private currentTokenId: number;
  private currentTradeId: number;
  private currentAlertId: number;

  constructor() {
    this.tradingParams = new Map();
    this.tokens = new Map();
    this.trades = new Map();
    this.alerts = new Map();
    this.backtestResults = new Map();
    
    this.currentParamsId = 1;
    this.currentTokenId = 1;
    this.currentTradeId = 1;
    this.currentAlertId = 1;

    // Initialize with default trading parameters
    this.initializeDefaultParameters();
  }

  private initializeDefaultParameters() {
    const defaultParams: TradingParameters = {
      id: this.currentParamsId++,
      watchThreshold: 10000,
      buyTrigger: 6000,
      buyPrice: 8000,
      takeProfitMultiplier: 2.0,
      stopLossPercent: 20,
      maxAge: 2,
      positionSize: 1.0,
      dexSources: ["pumpfun"],
      isActive: true,
      createdAt: new Date(),
    };
    this.tradingParams.set(defaultParams.id, defaultParams);
  }

  // Trading Parameters
  async getCurrentTradingParameters(): Promise<TradingParameters | undefined> {
    const activeParams = Array.from(this.tradingParams.values()).find(p => p.isActive);
    return activeParams;
  }

  async updateTradingParameters(params: InsertTradingParameters): Promise<TradingParameters> {
    // Deactivate current parameters
    Array.from(this.tradingParams.values()).forEach(param => {
      if (param.isActive) {
        param.isActive = false;
      }
    });

    const newParams: TradingParameters = {
      id: this.currentParamsId++,
      watchThreshold: params.watchThreshold ?? 10000,
      buyTrigger: params.buyTrigger ?? 6000,
      buyPrice: params.buyPrice ?? 8000,
      takeProfitMultiplier: params.takeProfitMultiplier ?? 2.0,
      stopLossPercent: params.stopLossPercent ?? 20,
      maxAge: params.maxAge ?? 2,
      positionSize: params.positionSize ?? 1.0,
      dexSources: params.dexSources as string[] || ["pumpfun"],
      isActive: params.isActive ?? true,
      createdAt: new Date(),
    };
    
    this.tradingParams.set(newParams.id, newParams);
    return newParams;
  }

  // Tokens
  async getAllTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }

  async getTokenByAddress(address: string): Promise<Token | undefined> {
    return this.tokens.get(address);
  }

  async createToken(token: InsertToken): Promise<Token> {
    const newToken: Token = {
      ...token,
      id: this.currentTokenId++,
      status: token.status || "new",
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    
    this.tokens.set(newToken.address, newToken);
    return newToken;
  }

  async updateToken(address: string, updates: Partial<Token>): Promise<Token | undefined> {
    const token = this.tokens.get(address);
    if (!token) return undefined;

    const updatedToken = {
      ...token,
      ...updates,
      lastUpdated: new Date(),
    };
    
    this.tokens.set(address, updatedToken);
    return updatedToken;
  }

  async getWatchedTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(t => t.status === "watching" || t.status === "buy_trigger" || t.status === "bought");
  }

  async getTokensByStatus(status: string): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(t => t.status === status);
  }

  // Trades
  async getAllTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values());
  }

  async getTradesByBacktestId(backtestId: string): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(t => t.backtestId === backtestId);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const newTrade: Trade = {
      ...trade,
      id: this.currentTradeId++,
      tokenId: trade.tokenId || null,
      exitPrice: trade.exitPrice || null,
      exitTime: trade.exitTime || null,
      duration: trade.duration || null,
      pnl: trade.pnl || null,
      pnlPercent: trade.pnlPercent || null,
      exitReason: trade.exitReason || null,
      isBacktest: trade.isBacktest || false,
      backtestId: trade.backtestId || null,
    };
    
    this.trades.set(newTrade.id, newTrade);
    return newTrade;
  }

  async updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) return undefined;

    const updatedTrade = { ...trade, ...updates };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  async getTradesByTimeframe(startTime: Date, endTime: Date): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(t => 
      t.entryTime >= startTime && t.entryTime <= endTime
    );
  }

  // Alerts
  async getAllAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).sort((a, b) => 
      (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
    );
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => !a.isRead);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: this.currentAlertId++,
      tokenAddress: alert.tokenAddress || null,
      isRead: alert.isRead || false,
      timestamp: new Date(),
    };
    
    this.alerts.set(newAlert.id, newAlert);
    return newAlert;
  }

  async markAlertAsRead(id: number): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.isRead = true;
    }
  }

  // Backtest Results
  async getAllBacktestResults(): Promise<BacktestResult[]> {
    return Array.from(this.backtestResults.values());
  }

  async getBacktestResult(backtestId: string): Promise<BacktestResult | undefined> {
    return this.backtestResults.get(backtestId);
  }

  async createBacktestResult(result: InsertBacktestResult): Promise<BacktestResult> {
    const newResult: BacktestResult = {
      ...result,
      id: Date.now(), // Simple ID generation
      createdAt: new Date(),
    };
    
    this.backtestResults.set(newResult.backtestId, newResult);
    return newResult;
  }
}

export const storage = new MemStorage();
