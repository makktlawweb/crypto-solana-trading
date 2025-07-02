import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Trading Parameters Schema
export const tradingParameters = pgTable("trading_parameters", {
  id: serial("id").primaryKey(),
  watchThreshold: real("watch_threshold").notNull().default(10000), // Market cap threshold to watch
  buyTrigger: real("buy_trigger").notNull().default(6000), // Market cap that triggers buy consideration
  buyPrice: real("buy_price").notNull().default(8000), // Actual limit order price
  takeProfitMultiplier: real("take_profit_multiplier").notNull().default(2.0), // Multiplier for take profit
  stopLossPercent: real("stop_loss_percent").notNull().default(20), // Stop loss percentage
  maxAge: integer("max_age").notNull().default(2), // Maximum token age in minutes
  positionSize: real("position_size").notNull().default(1.0), // SOL amount per trade
  dexSources: jsonb("dex_sources").$type<string[]>().notNull().default(["pumpfun"]), // Array of DEX sources
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Token Schema
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  marketCap: real("market_cap").notNull(),
  price: real("price").notNull(),
  volume24h: real("volume_24h").notNull(),
  age: integer("age").notNull(), // Age in seconds
  status: text("status").notNull().default("new"), // new, watching, buy_trigger, bought, sold
  dexSource: text("dex_source").notNull(),
  // Wallet concentration analysis (Padre/Axion style)
  topHoldersPercent: real("top_holders_percent"), // % held by top 10 wallets
  bundlerPercent: real("bundler_percent"), // % held by known bundlers
  uniqueHolders: integer("unique_holders"), // Total number of holders
  holderConcentrationRisk: text("holder_concentration_risk"), // low, medium, high, critical
  suspiciousWallets: jsonb("suspicious_wallets"), // Array of flagged wallet addresses
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Trades Schema
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").references(() => tokens.id),
  tokenAddress: text("token_address").notNull(),
  tokenName: text("token_name").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  quantity: real("quantity").notNull(),
  entryValue: real("entry_value"), // USD value at entry
  exitValue: real("exit_value"), // USD value at exit
  entryTime: timestamp("entry_time").notNull(),
  exitTime: timestamp("exit_time"),
  duration: integer("duration"), // Duration in seconds
  pnl: real("pnl"),
  pnlPercent: real("pnl_percent"),
  exitReason: text("exit_reason"), // take_profit, stop_loss, manual
  isBacktest: boolean("is_backtest").notNull().default(false),
  backtestId: text("backtest_id"),
});

// Alerts Schema
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // success, warning, error, info
  message: text("message").notNull(),
  tokenAddress: text("token_address"),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
});

// Backtest Results Schema
export const backtestResults = pgTable("backtest_results", {
  id: serial("id").primaryKey(),
  backtestId: text("backtest_id").notNull().unique(),
  parameters: jsonb("parameters").notNull(),
  timeframe: text("timeframe").notNull(),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  winRate: real("win_rate").notNull(),
  totalPnL: real("total_pnl").notNull(),
  maxDrawdown: real("max_drawdown").notNull(),
  avgTrade: real("avg_trade").notNull(),
  sharpeRatio: real("sharpe_ratio").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertTradingParametersSchema = createInsertSchema(tradingParameters).omit({
  id: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

export const insertBacktestResultSchema = createInsertSchema(backtestResults).omit({
  id: true,
  createdAt: true,
});

// Types
export type TradingParameters = typeof tradingParameters.$inferSelect;
export type InsertTradingParameters = z.infer<typeof insertTradingParametersSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type BacktestResult = typeof backtestResults.$inferSelect;
export type InsertBacktestResult = z.infer<typeof insertBacktestResultSchema>;

// Strategy Configuration Type
export type StrategyConfig = {
  watchThreshold: number;
  buyTrigger: number;
  buyPrice: number;
  takeProfitMultiplier: number;
  stopLossPercent: number;
  maxAge: number;
  positionSize: number;
  dexSources: string[];
};
