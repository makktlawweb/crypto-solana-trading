import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function RiskManagement() {
  const { toast } = useToast();

  const { data: portfolioStats } = useQuery({
    queryKey: ["/api/portfolio/stats"],
    refetchInterval: 10000,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades"],
    refetchInterval: 30000,
  });

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/emergency-stop");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({
        title: "Emergency Stop Activated",
        description: "All trading operations have been halted",
        variant: "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to execute emergency stop",
        variant: "destructive",
      });
    },
  });

  // Calculate daily loss from trades
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTrades = trades.filter((trade: any) => 
    trade.exitTime && new Date(trade.exitTime) >= today
  );
  
  const dailyLoss = todayTrades
    .filter((trade: any) => (trade.pnl || 0) < 0)
    .reduce((sum: number, trade: any) => sum + Math.abs(trade.pnl || 0), 0);
  
  const dailyLossLimit = 200; // $200 daily loss limit
  const dailyLossPercent = Math.min((dailyLoss / dailyLossLimit) * 100, 100);

  const currentPositions = portfolioStats?.activeOrders || 0;
  const maxPositions = 5;
  const positionPercent = Math.min((currentPositions / maxPositions) * 100, 100);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Shield className="text-yellow-500" />
          <span>Risk Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Daily Loss Limit */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Daily Loss Limit</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-400">
                  ${dailyLoss.toFixed(2)}
                </span>
                <span className="text-gray-500">/</span>
                <span className="font-mono text-sm text-white">
                  ${dailyLossLimit.toFixed(2)}
                </span>
              </div>
            </div>
            <Progress 
              value={dailyLossPercent} 
              className="h-2"
              // Use different colors based on risk level
              style={{
                '--progress-background': dailyLossPercent > 80 ? '#ef4444' : 
                                       dailyLossPercent > 60 ? '#f59e0b' : '#22c55e'
              } as any}
            />
            {dailyLossPercent > 80 && (
              <div className="flex items-center space-x-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Approaching daily loss limit</span>
              </div>
            )}
          </div>

          {/* Max Concurrent Positions */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Max Concurrent Positions</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-400">
                  {currentPositions}
                </span>
                <span className="text-gray-500">/</span>
                <span className="font-mono text-sm text-white">
                  {maxPositions}
                </span>
              </div>
            </div>
            <Progress 
              value={positionPercent} 
              className="h-2"
            />
          </div>

          {/* Current Risk Level */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300">Current Risk Level</span>
              <span className={`text-sm font-medium ${
                dailyLossPercent > 80 ? 'text-red-400' :
                dailyLossPercent > 60 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {dailyLossPercent > 80 ? 'HIGH' :
                 dailyLossPercent > 60 ? 'MEDIUM' :
                 'LOW'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Win Rate (Today):</span>
                <span className="font-mono">
                  {todayTrades.length > 0 ? 
                    `${((todayTrades.filter((t: any) => (t.pnl || 0) > 0).length / todayTrades.length) * 100).toFixed(1)}%` :
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trades Today:</span>
                <span className="font-mono">{todayTrades.length}</span>
              </div>
            </div>
          </div>

          {/* Emergency Stop */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Emergency Controls</span>
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => emergencyStopMutation.mutate()}
                disabled={emergencyStopMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                STOP ALL
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Immediately halts all trading operations and cancels pending orders
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
