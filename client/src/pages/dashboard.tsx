import { useQuery } from "@tanstack/react-query";
import { Bot, Settings, Radio, Activity, TrendingUp, Shield, Bell, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParametersSection from "@/components/ParametersSection";
import LiveMonitoring from "@/components/LiveMonitoring";
import BacktestingTab from "@/components/BacktestingTab";
import RiskManagement from "@/components/RiskManagement";
import RecentAlerts from "@/components/RecentAlerts";
import { useState } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"live-monitoring" | "backtesting">("live-monitoring");

  const { data: status } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 5000, // Update every 5 seconds
  });

  const { data: portfolioStats } = useQuery({
    queryKey: ["/api/portfolio/stats"],
    refetchInterval: 10000, // Update every 10 seconds
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bot className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-white">Crypto Copy Platform</h1>
            </div>
            <span className="text-sm text-gray-400">Elite Wallet Intelligence System</span>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                status?.solana?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-300">
                {status?.solana?.connected ? 'Solana RPC Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Account Balance */}
            <div className="text-right">
              <p className="text-xs text-gray-400">Available Balance</p>
              <p className="text-sm font-mono font-semibold">12.45 SOL</p>
            </div>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0">
          <nav className="p-4 space-y-2">
            <a href="#dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary text-white">
              <TrendingUp className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a href="#parameters" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
              <span>Parameters</span>
            </a>
            <a href="#backtesting" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
              <Activity className="w-5 h-5" />
              <span>Backtesting</span>
            </a>
            <a href="#live-monitoring" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
              <Radio className="w-5 h-5" />
              <span>Live Monitoring</span>
            </a>
            <Link href="/portfolio" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
              <PieChart className="w-5 h-5" />
              <span>Portfolio</span>
            </Link>
            <Link href="/elite-analysis" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">
              <Shield className="w-5 h-5 text-yellow-400" />
              <span>Elite Analysis</span>
              <span className="ml-auto text-xs bg-yellow-500 text-black px-2 py-1 rounded">NEW</span>
            </Link>
          </nav>

          {/* Quick Status */}
          <div className="p-4 border-t border-gray-700 mt-8">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Tokens Watched:</span>
                <span className="font-mono">{portfolioStats?.watchedTokens || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Orders:</span>
                <span className="font-mono">{portfolioStats?.activeOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Today's P&L:</span>
                <span className={`font-mono ${
                  (portfolioStats?.todayPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(portfolioStats?.todayPnL || 0) >= 0 ? '+' : ''}
                  ${(portfolioStats?.todayPnL || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Strategy Parameters Section */}
          <ParametersSection />

          {/* Live Monitoring & Backtesting Tabs */}
          <section className="mb-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              {/* Tab Navigation */}
              <div className="border-b border-gray-700">
                <nav className="flex">
                  <button 
                    className={`px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === "live-monitoring" 
                        ? "text-white border-b-2 border-primary bg-gray-750"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setActiveTab("live-monitoring")}
                  >
                    <Radio className="w-4 h-4 mr-2 inline" />
                    Live Monitoring
                  </button>
                  <button 
                    className={`px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === "backtesting" 
                        ? "text-white border-b-2 border-primary bg-gray-750"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setActiveTab("backtesting")}
                  >
                    <Activity className="w-4 h-4 mr-2 inline" />
                    Backtesting
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === "live-monitoring" ? (
                <LiveMonitoring />
              ) : (
                <BacktestingTab />
              )}
            </div>
          </section>

          {/* Risk Management & Alerts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskManagement />
            <RecentAlerts />
          </section>
        </main>
      </div>
    </div>
  );
}
