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

  const httpServer = createServer(app);
  return httpServer;
}
