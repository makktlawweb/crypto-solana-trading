import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, BarChart3, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PerformanceChart from "./PerformanceChart";

export default function BacktestingTab() {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState("1d");
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const runBacktestMutation = useMutation({
    mutationFn: async (params: { timeframe: string }) => {
      const response = await apiRequest("POST", "/api/backtest", params);
      return response.json();
    },
    onSuccess: (data) => {
      setBacktestResults(data);
      toast({
        title: "Success",
        description: "Backtest completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run backtest",
        variant: "destructive",
      });
    },
  });

  const handleRunBacktest = () => {
    runBacktestMutation.mutate({ timeframe });
  };

  const copyTokenAddress = async (tokenAddress: string, tokenName: string) => {
    try {
      await navigator.clipboard.writeText(tokenAddress);
      setCopiedAddress(tokenAddress);
      toast({
        title: "Copied!",
        description: `${tokenName} address copied to clipboard`,
      });
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      });
    }
  };

  const getExitReasonBadge = (reason: string) => {
    switch (reason) {
      case "take_profit":
        return <Badge className="bg-green-500/20 text-green-400">Take Profit</Badge>;
      case "stop_loss":
        return <Badge className="bg-red-500/20 text-red-400">Stop Loss</Badge>;
      case "volume_death":
        return <Badge className="bg-orange-500/20 text-orange-400">Volume Death</Badge>;
      case "timeout":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Timeout</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{reason}</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Strategy Backtesting</h3>
        <div className="flex items-center space-x-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 Hours</SelectItem>
              <SelectItem value="3d">Last 3 Days</SelectItem>
              <SelectItem value="1w">Last Week</SelectItem>
              <SelectItem value="1m">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRunBacktest}
            disabled={runBacktestMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="w-4 h-4 mr-2" />
            {runBacktestMutation.isPending ? 'Running...' : 'Run Backtest'}
          </Button>
        </div>
      </div>

      {/* Backtesting Results */}
      {backtestResults ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Performance Chart */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-750 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Performance Chart</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PerformanceChart data={backtestResults.equityCurve} />
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <Card className="bg-gray-750 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Trades:</span>
                    <span className="font-mono font-semibold text-white">{backtestResults.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="font-mono font-semibold text-green-400">
                      {backtestResults.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total P&L:</span>
                    <span className={`font-mono font-semibold ${
                      backtestResults.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {backtestResults.totalPnL >= 0 ? '+' : ''}${backtestResults.totalPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Drawdown:</span>
                    <span className="font-mono font-semibold text-red-400">
                      -{backtestResults.maxDrawdown.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Trade:</span>
                    <span className={`font-mono font-semibold ${
                      backtestResults.avgTrade >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {backtestResults.avgTrade >= 0 ? '+' : ''}${backtestResults.avgTrade.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sharpe Ratio:</span>
                    <span className="font-mono font-semibold text-white">
                      {backtestResults.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trade History */}
          <Card className="bg-gray-750 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Trade History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-700">
                    <TableRow className="border-gray-600">
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Token</TableHead>
                      <TableHead className="text-gray-400">Entry MC</TableHead>
                      <TableHead className="text-gray-400">Exit MC</TableHead>
                      <TableHead className="text-gray-400">1hr Post-TGE MC</TableHead>
                      <TableHead className="text-gray-400">Duration</TableHead>
                      <TableHead className="text-gray-400">P&L</TableHead>
                      <TableHead className="text-gray-400">Exit Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backtestResults.trades.map((trade: any, index: number) => (
                      <TableRow key={index} className="border-gray-700 hover:bg-gray-700/50">
                        <TableCell className="font-mono text-sm text-gray-300">
                          {new Date(trade.entryTime).toLocaleDateString()} {new Date(trade.entryTime).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span>{trade.tokenName}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-gray-600"
                              onClick={() => copyTokenAddress(trade.tokenAddress, trade.tokenName)}
                            >
                              <Copy className={`h-3 w-3 ${
                                copiedAddress === trade.tokenAddress 
                                  ? 'text-green-400' 
                                  : 'text-gray-400 hover:text-white'
                              }`} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-300">
                          ${trade.entryMarketCap ? (trade.entryMarketCap / 1000).toFixed(1) + 'K' : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-300">
                          ${trade.exitMarketCap ? (trade.exitMarketCap / 1000).toFixed(1) + 'K' : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-300">
                          {trade.oneHourPostTGEMarketCap ? 
                            '$' + (trade.oneHourPostTGEMarketCap / 1000).toFixed(1) + 'K' : 
                            <span className="text-gray-500">Pending</span>
                          }
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-300">
                          {formatDuration(trade.duration)}
                        </TableCell>
                        <TableCell className={`font-mono text-sm ${
                          trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getExitReasonBadge(trade.exitReason)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No backtest results yet</p>
            <p className="text-sm">Run a backtest to see performance analysis</p>
          </div>
        </div>
      )}
    </div>
  );
}
