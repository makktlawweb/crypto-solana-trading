import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tradingEngine } from "./services/tradingEngine";
import { backtestingService } from "./services/backtesting";
import { solanaService } from "./services/solana";
import { dexApiService } from "./services/dexApi";
import { momentumDetectionService } from "./services/momentumDetection";
import { conversionAnalysisService } from "./services/conversionAnalysis";
import { exitStrategyService } from "./services/exitStrategy";
import { walletAnalysisService } from "./services/walletAnalysis";
import { copyTradingService } from "./services/copyTrading";
import { paperTradingService } from "./services/paperTrading";
import { riskManagementService } from "./services/riskManagement";
import { extendedWalletAnalysisService } from "./services/extendedWalletAnalysis";
import { birdeyeService } from "./services/birdeyeService";
import { insertTradingParametersSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current trading parameters
  app.get("/api/parameters", async (req, res) => {
    try {
      const parameters = await storage.getCurrentTradingParameters();
      res.json(parameters);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trading parameters" });
    }
  });

  // Update trading parameters
  app.post("/api/parameters", async (req, res) => {
    try {
      const validatedParams = insertTradingParametersSchema.parse(req.body);
      const updatedParams = await storage.updateTradingParameters(validatedParams);
      res.json(updatedParams);
    } catch (error) {
      res.status(400).json({ error: "Invalid parameters" });
    }
  });

  // Get connection status
  app.get("/api/status", async (req, res) => {
    try {
      const solanaStatus = await solanaService.getConnectionStatus();
      const isMonitoring = tradingEngine.isMonitoringActive();
      const activePositions = tradingEngine.getActivePositions().size;
      
      res.json({
        solana: solanaStatus,
        monitoring: isMonitoring,
        activePositions,
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get status" });
    }
  });

  // Start/Stop monitoring
  app.post("/api/monitoring/start", async (req, res) => {
    try {
      await tradingEngine.startMonitoring();
      res.json({ message: "Monitoring started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start monitoring" });
    }
  });

  app.post("/api/monitoring/stop", async (req, res) => {
    try {
      await tradingEngine.stopMonitoring();
      res.json({ message: "Monitoring stopped" });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop monitoring" });
    }
  });

  // Get watched tokens
  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await storage.getWatchedTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  // Get all tokens
  app.get("/api/tokens/all", async (req, res) => {
    try {
      const tokens = await storage.getAllTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: "Failed to get all tokens" });
    }
  });

  // Get trades
  app.get("/api/trades", async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trades" });
    }
  });

  // Get trades by timeframe
  app.get("/api/trades/timeframe", async (req, res) => {
    try {
      const { startTime, endTime } = req.query;
      if (!startTime || !endTime) {
        return res.status(400).json({ error: "startTime and endTime are required" });
      }
      
      const trades = await storage.getTradesByTimeframe(
        new Date(startTime as string),
        new Date(endTime as string)
      );
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trades by timeframe" });
    }
  });

  // Run backtest
  app.post("/api/backtest", async (req, res) => {
    try {
      const { timeframe = "1w" } = req.body;
      const parameters = await storage.getCurrentTradingParameters();
      
      if (!parameters) {
        return res.status(400).json({ error: "No trading parameters configured" });
      }

      // Convert timeframe to hours
      const timeframeHours = timeframe === "1d" ? 24 : 
                           timeframe === "3d" ? 72 :
                           timeframe === "1w" ? 168 :
                           timeframe === "1m" ? 720 : 168;

      const results = await backtestingService.runBacktest(parameters, timeframeHours);
      res.json(results);
    } catch (error) {
      console.error("Backtest error:", error);
      res.status(500).json({ error: "Failed to run backtest" });
    }
  });

  // Get backtest history
  app.get("/api/backtest/history", async (req, res) => {
    try {
      const history = await backtestingService.getBacktestHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to get backtest history" });
    }
  });

  // Get backtest trades
  app.get("/api/backtest/:backtestId/trades", async (req, res) => {
    try {
      const { backtestId } = req.params;
      const trades = await backtestingService.getBacktestTrades(backtestId);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to get backtest trades" });
    }
  });

  // Get alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  // Get unread alerts
  app.get("/api/alerts/unread", async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread alerts" });
    }
  });

  // Mark alert as read
  app.patch("/api/alerts/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markAlertAsRead(parseInt(id));
      res.json({ message: "Alert marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // Emergency stop
  app.post("/api/emergency-stop", async (req, res) => {
    try {
      await tradingEngine.stopMonitoring();
      
      await storage.createAlert({
        type: "warning",
        message: "Emergency stop activated - All trading operations halted",
      });
      
      res.json({ message: "Emergency stop activated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute emergency stop" });
    }
  });

  // Get portfolio stats
  app.get("/api/portfolio/stats", async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      const activeTrades = trades.filter(t => !t.exitTime);
      const completedTrades = trades.filter(t => t.exitTime);
      
      const totalPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayTrades = completedTrades.filter(t => 
        t.exitTime && t.exitTime >= todayStart
      );
      const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      res.json({
        watchedTokens: (await storage.getWatchedTokens()).length,
        activeOrders: activeTrades.length,
        todayPnL,
        totalPnL,
        totalTrades: completedTrades.length,
        winRate: completedTrades.length > 0 ? 
          (completedTrades.filter(t => (t.pnl || 0) > 0).length / completedTrades.length) * 100 : 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get portfolio stats" });
    }
  });

  // Get momentum signals for smart entry timing
  app.get("/api/momentum/signals", async (req, res) => {
    try {
      const signals = await momentumDetectionService.getAllMomentumSignals();
      res.json(signals);
    } catch (error) {
      console.error("Error getting momentum signals:", error);
      res.status(500).json({ error: "Failed to get momentum signals" });
    }
  });

  // Analyze conversion rates for specific entry points
  app.get("/api/analysis/conversion/:entryPoint", async (req, res) => {
    try {
      const entryPoint = parseFloat(req.params.entryPoint);
      if (isNaN(entryPoint) || entryPoint <= 0) {
        return res.status(400).json({ error: "Invalid entry point" });
      }
      
      const analysis = await conversionAnalysisService.analyzeConversionRates(entryPoint);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing conversion rates:", error);
      res.status(500).json({ error: "Failed to analyze conversion rates" });
    }
  });

  // Find optimal entry point
  app.get("/api/analysis/optimal-entry", async (req, res) => {
    try {
      const optimal = await conversionAnalysisService.findOptimalEntryPoint();
      res.json(optimal);
    } catch (error) {
      console.error("Error finding optimal entry:", error);
      res.status(500).json({ error: "Failed to find optimal entry point" });
    }
  });

  // Analyze wallet following stats
  app.post("/api/analysis/wallet-following", async (req, res) => {
    try {
      const { walletAddresses } = req.body;
      if (!Array.isArray(walletAddresses) || walletAddresses.length === 0) {
        return res.status(400).json({ error: "Invalid wallet addresses array" });
      }
      
      const stats = await conversionAnalysisService.analyzeWalletFollowing(walletAddresses);
      res.json(stats);
    } catch (error) {
      console.error("Error analyzing wallet following:", error);
      res.status(500).json({ error: "Failed to analyze wallet following" });
    }
  });

  // Get optimal exit timing analysis
  app.get("/api/exit/timing/:entryPoint", async (req, res) => {
    try {
      const entryPoint = parseFloat(req.params.entryPoint);
      if (isNaN(entryPoint) || entryPoint <= 0) {
        return res.status(400).json({ error: "Invalid entry point" });
      }
      
      const timing = await exitStrategyService.analyzeOptimalExitTiming(entryPoint);
      res.json(timing);
    } catch (error) {
      console.error("Error analyzing exit timing:", error);
      res.status(500).json({ error: "Failed to analyze exit timing" });
    }
  });

  // Get Padre/Axiom integration settings
  app.get("/api/exit/padre-axiom-settings", async (req, res) => {
    try {
      const settings = await exitStrategyService.analyzePadreAxiomIntegration();
      res.json(settings);
    } catch (error) {
      console.error("Error getting Padre/Axiom settings:", error);
      res.status(500).json({ error: "Failed to get trading bot settings" });
    }
  });

  // Simulate exit patterns
  app.get("/api/exit/patterns/:entryPoint", async (req, res) => {
    try {
      const entryPoint = parseFloat(req.params.entryPoint);
      const sampleSize = parseInt(req.query.samples as string) || 50;
      
      if (isNaN(entryPoint) || entryPoint <= 0) {
        return res.status(400).json({ error: "Invalid entry point" });
      }
      
      const patterns = await exitStrategyService.simulateExitPatterns(entryPoint, sampleSize);
      res.json(patterns);
    } catch (error) {
      console.error("Error simulating exit patterns:", error);
      res.status(500).json({ error: "Failed to simulate exit patterns" });
    }
  });

  // Analyze specific wallet strategy
  app.get("/api/wallet/strategy/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress;
      if (!walletAddress || walletAddress.length < 32) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      
      const strategy = await walletAnalysisService.analyzeWalletStrategy(walletAddress);
      res.json(strategy);
    } catch (error) {
      console.error("Error analyzing wallet strategy:", error);
      res.status(500).json({ error: "Failed to analyze wallet strategy" });
    }
  });

  // Get historical tokens for backtesting
  app.get("/api/backtest/tokens/:hoursBack", async (req, res) => {
    try {
      const hoursBack = parseInt(req.params.hoursBack) || 24;
      if (hoursBack <= 0 || hoursBack > 168) { // Max 1 week
        return res.status(400).json({ error: "Hours back must be between 1 and 168" });
      }
      
      const tokens = await walletAnalysisService.getNewSolanaTokensForBacktest(hoursBack);
      res.json(tokens);
    } catch (error) {
      console.error("Error getting historical tokens:", error);
      res.status(500).json({ error: "Failed to get historical tokens" });
    }
  });

  // Backtest wallet strategy against historical data
  app.post("/api/backtest/wallet-strategy", async (req, res) => {
    try {
      const { walletAddress, hoursBack } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      
      const hours = hoursBack || 24;
      
      // Get wallet strategy
      const strategy = await walletAnalysisService.analyzeWalletStrategy(walletAddress);
      
      // Get historical tokens
      const tokens = await walletAnalysisService.getNewSolanaTokensForBacktest(hours);
      
      // Run backtest
      const results = await walletAnalysisService.backTestWalletStrategy(strategy, tokens);
      
      res.json({
        walletStrategy: strategy,
        backtestResults: results,
        historicalTokenCount: tokens.length,
        timeframe: `${hours} hours`
      });
    } catch (error) {
      console.error("Error backtesting wallet strategy:", error);
      res.status(500).json({ error: "Failed to backtest wallet strategy" });
    }
  });

  // Start copy trading monitor
  app.post("/api/copy-trading/start", async (req, res) => {
    try {
      copyTradingService.startMonitoring();
      res.json({ 
        status: "started",
        message: "Copy trading monitor started",
        monitoredWallets: copyTradingService.getMonitoredWallets().length
      });
    } catch (error) {
      console.error("Error starting copy trading:", error);
      res.status(500).json({ error: "Failed to start copy trading" });
    }
  });

  // Stop copy trading monitor
  app.post("/api/copy-trading/stop", async (req, res) => {
    try {
      copyTradingService.stopMonitoring();
      res.json({ status: "stopped", message: "Copy trading monitor stopped" });
    } catch (error) {
      console.error("Error stopping copy trading:", error);
      res.status(500).json({ error: "Failed to stop copy trading" });
    }
  });

  // Get copy trading status and recent signals
  app.get("/api/copy-trading/status", async (req, res) => {
    try {
      const status = {
        isMonitoring: copyTradingService.isCurrentlyMonitoring(),
        monitoredWallets: copyTradingService.getMonitoredWallets(),
        recentSignals: copyTradingService.getRecentSignals(),
        signalCount: copyTradingService.getRecentSignals().length
      };
      res.json(status);
    } catch (error) {
      console.error("Error getting copy trading status:", error);
      res.status(500).json({ error: "Failed to get copy trading status" });
    }
  });

  // Paper Trading Endpoints
  
  // Start paper trading for a specific wallet
  app.post("/api/paper-trading/start", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      
      await paperTradingService.startPaperTrading(walletAddress);
      
      res.json({ 
        status: "started",
        message: `Paper trading started for wallet: ${walletAddress}`,
        startingBalance: paperTradingService.getCurrentBalance()
      });
    } catch (error) {
      console.error("Error starting paper trading:", error);
      res.status(500).json({ error: "Failed to start paper trading" });
    }
  });

  // Stop paper trading
  app.post("/api/paper-trading/stop", async (req, res) => {
    try {
      await paperTradingService.stopPaperTrading();
      
      const finalStats = paperTradingService.calculateStats();
      
      res.json({ 
        status: "stopped",
        message: "Paper trading session ended",
        finalStats: finalStats
      });
    } catch (error) {
      console.error("Error stopping paper trading:", error);
      res.status(500).json({ error: "Failed to stop paper trading" });
    }
  });

  // Get paper trading status and current positions
  app.get("/api/paper-trading/status", async (req, res) => {
    try {
      const status = {
        isActive: paperTradingService.getIsActive(),
        currentBalance: paperTradingService.getCurrentBalance(),
        portfolioValue: paperTradingService.getPortfolioValue(),
        openPositions: paperTradingService.getOpenPositions(),
        stats: paperTradingService.calculateStats()
      };
      
      res.json(status);
    } catch (error) {
      console.error("Error getting paper trading status:", error);
      res.status(500).json({ error: "Failed to get paper trading status" });
    }
  });

  // Get all paper trading positions (open and closed)
  app.get("/api/paper-trading/positions", async (req, res) => {
    try {
      const { status } = req.query;
      
      let positions;
      if (status === 'open') {
        positions = paperTradingService.getOpenPositions();
      } else if (status === 'closed') {
        positions = paperTradingService.getClosedPositions();
      } else {
        positions = paperTradingService.getAllPositions();
      }
      
      res.json(positions);
    } catch (error) {
      console.error("Error getting paper trading positions:", error);
      res.status(500).json({ error: "Failed to get paper trading positions" });
    }
  });

  // Get paper trading performance stats
  app.get("/api/paper-trading/stats", async (req, res) => {
    try {
      const stats = paperTradingService.calculateStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting paper trading stats:", error);
      res.status(500).json({ error: "Failed to get paper trading stats" });
    }
  });

  // Analyze wallet risk profile
  app.get("/api/risk-analysis/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const riskProfile = await riskManagementService.analyzeWalletRiskProfile(walletAddress);
      const portfolioRisk = await riskManagementService.calculatePortfolioRisk(riskProfile);
      
      res.json({
        walletAddress,
        riskProfile,
        portfolioRisk
      });
    } catch (error) {
      console.error("Error analyzing wallet risk:", error);
      res.status(500).json({ error: "Failed to analyze wallet risk" });
    }
  });

  // Extended wallet analysis (7-day default)
  app.get("/api/wallet/extended/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const { days } = req.query;
      const daysBack = days ? parseInt(days as string) : 7;
      
      const analysis = await extendedWalletAnalysisService.analyzeWalletExtended(walletAddress, daysBack);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error in extended wallet analysis:", error);
      res.status(500).json({ error: "Failed to perform extended wallet analysis" });
    }
  });

  // Compare two traders over extended timeframe
  app.post("/api/wallet/compare", async (req, res) => {
    try {
      const { trader1, trader2, days } = req.body;
      
      if (!trader1 || !trader2) {
        return res.status(400).json({ error: "Both trader addresses required" });
      }
      
      const daysBack = days || 7;
      const comparison = await extendedWalletAnalysisService.compareTraders(trader1, trader2, daysBack);
      
      res.json(comparison);
    } catch (error) {
      console.error("Error comparing traders:", error);
      res.status(500).json({ error: "Failed to compare traders" });
    }
  });

  // Birdeye Top Traders Discovery
  
  // Get top traders from Birdeye
  app.get("/api/birdeye/top-traders", async (req, res) => {
    try {
      const { timeframe, limit } = req.query;
      const tf = (timeframe as '24h' | '7d' | '30d') || '24h';
      const lim = parseInt(limit as string) || 20;
      
      const topTraders = await birdeyeService.getTopTraders(tf, lim);
      
      res.json(topTraders);
    } catch (error) {
      console.error("Error fetching top traders:", error);
      res.status(500).json({ error: "Failed to fetch top traders" });
    }
  });

  // Get top traders by strategy type
  app.get("/api/birdeye/top-traders/:strategy", async (req, res) => {
    try {
      const { strategy } = req.params;
      const { timeframe, limit } = req.query;
      
      const tf = (timeframe as '24h' | '7d' | '30d') || '7d';
      const lim = parseInt(limit as string) || 10;
      
      const strategyTraders = await birdeyeService.getTopTradersByStrategy(
        strategy as any, tf, lim
      );
      
      res.json({
        strategy,
        timeframe: tf,
        traders: strategyTraders
      });
    } catch (error) {
      console.error("Error fetching strategy traders:", error);
      res.status(500).json({ error: "Failed to fetch strategy traders" });
    }
  });

  // Get detailed analysis of specific top trader
  app.get("/api/birdeye/trader/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      const traderDetails = await birdeyeService.getTopTraderDetails(address);
      
      if (!traderDetails.trader) {
        return res.status(404).json({ error: "Trader not found in top performers" });
      }
      
      res.json(traderDetails);
    } catch (error) {
      console.error("Error fetching trader details:", error);
      res.status(500).json({ error: "Failed to fetch trader details" });
    }
  });

  // Discover and add new traders to copy trading system
  app.post("/api/birdeye/discover-and-copy", async (req, res) => {
    try {
      const { strategy, minWinRate, minPnL, timeframe } = req.body;
      
      // Get top traders matching criteria
      const topTraders = await birdeyeService.getTopTraders(timeframe || '7d', 50);
      
      const qualifiedTraders = topTraders.data.traders.filter(trader => {
        return (!strategy || trader.strategy === strategy) &&
               (!minWinRate || trader.winRate >= minWinRate) &&
               (!minPnL || trader.totalPnL >= minPnL);
      });
      
      // Add to copy trading monitor
      const newWallets = qualifiedTraders.slice(0, 5).map(t => t.address);
      
      res.json({
        discovered: qualifiedTraders.length,
        added: newWallets.length,
        traders: qualifiedTraders.slice(0, 10), // Return top 10 for review
        message: `Found ${qualifiedTraders.length} qualified traders, monitoring top ${newWallets.length}`
      });
    } catch (error) {
      console.error("Error in trader discovery:", error);
      res.status(500).json({ error: "Failed to discover and add traders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
