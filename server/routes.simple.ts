import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple health check endpoint that doesn't require database or external services
  app.get("/api/status", async (req, res) => {
    try {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        port: process.env.PORT || "5000"
      });
    } catch (error) {
      res.status(500).json({ error: "Health check failed" });
    }
  });

  // Basic info endpoint
  app.get("/api/info", async (req, res) => {
    res.json({
      name: "Solana Trading Platform",
      version: "1.0.0",
      status: "deployed"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}