import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Target, 
  DollarSign,
  PieChart,
  BarChart3,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';

interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  positions: any[];
  cashBalance: number;
  portfolioAllocation: {
    cash: number;
    positions: number;
  };
  riskMetrics: {
    totalRisk: number;
    maxDrawdown: number;
    sharpeRatio: number;
    volatility: number;
    valueAtRisk: number;
  };
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  riskScore: number;
  warnings: string[];
  recommendations: string[];
  portfolioHealth: {
    diversification: number;
    correlation: number;
    concentration: number;
    liquidity: number;
  };
}

interface PerformanceAnalytics {
  timeframes: {
    '24h': { return: number; trades: number; winRate: number };
    '7d': { return: number; trades: number; winRate: number };
    '30d': { return: number; trades: number; winRate: number };
    'all': { return: number; trades: number; winRate: number };
  };
  bestTrade: {
    tokenName: string;
    pnl: number;
    pnlPercent: number;
    holdTime: number;
  };
  worstTrade: {
    tokenName: string;
    pnl: number;
    pnlPercent: number;
    holdTime: number;
  };
  tradingPatterns: {
    avgHoldTime: number;
    avgPositionSize: number;
    mostTradedHour: number;
  };
  streaks: {
    currentWinStreak: number;
    currentLossStreak: number;
    longestWinStreak: number;
    longestLossStreak: number;
  };
}

export default function PortfolioPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<PortfolioMetrics>({
    queryKey: ['/api/portfolio/metrics'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const { data: riskAssessment, isLoading: riskLoading } = useQuery<RiskAssessment>({
    queryKey: ['/api/portfolio/risk-assessment'],
    refetchInterval: 60000, // Update every minute
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<PerformanceAnalytics>({
    queryKey: ['/api/portfolio/analytics'],
    refetchInterval: 60000,
  });

  const { data: allocation, isLoading: allocationLoading } = useQuery({
    queryKey: ['/api/portfolio/allocation'],
    refetchInterval: 30000,
  });

  const { data: riskAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/portfolio/risk-alerts'],
    refetchInterval: 30000,
  });

  if (metricsLoading || riskLoading || analyticsLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Portfolio Management</h2>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'extreme': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'extreme': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Portfolio Management</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button size="sm">
            Rebalance
          </Button>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.totalValue.toFixed(2) || '0.00'}</div>
            <p className={`text-xs ${metrics?.totalPnLPercent && metrics.totalPnLPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics?.totalPnLPercent > 0 ? '+' : ''}{metrics?.totalPnLPercent.toFixed(2) || '0.00'}% overall
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
            {metrics?.dayChangePercent && metrics.dayChangePercent > 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics?.dayChange && metrics.dayChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics?.dayChange && metrics.dayChange > 0 ? '+' : ''}${metrics?.dayChange.toFixed(2) || '0.00'}
            </div>
            <p className={`text-xs ${metrics?.dayChangePercent && metrics.dayChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics?.dayChangePercent && metrics.dayChangePercent > 0 ? '+' : ''}{metrics?.dayChangePercent.toFixed(2) || '0.00'}% today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getRiskBadgeColor(riskAssessment?.overallRisk || 'low')}>
                {riskAssessment?.overallRisk?.toUpperCase() || 'LOW'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {riskAssessment?.riskScore || 0}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.positions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${metrics?.cashBalance.toFixed(2) || '0.00'} cash available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {riskAlerts && riskAlerts.activeWarnings > 0 && (
        <Alert variant={riskAlerts.severity === 'high' || riskAlerts.severity === 'extreme' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Portfolio Risk Alert</AlertTitle>
          <AlertDescription>
            {riskAlerts.urgentActions.length > 0 ? (
              <div>
                <p className="font-medium">Urgent actions required:</p>
                <ul className="mt-1 list-disc list-inside">
                  {riskAlerts.urgentActions.map((action: string, i: number) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>{riskAlerts.warnings[0]}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Portfolio Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-4 w-4" />
                  Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cash</span>
                    <span>{metrics?.portfolioAllocation.cash.toFixed(1) || '0.0'}%</span>
                  </div>
                  <Progress value={metrics?.portfolioAllocation.cash || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Positions</span>
                    <span>{metrics?.portfolioAllocation.positions.toFixed(1) || '0.0'}%</span>
                  </div>
                  <Progress value={metrics?.portfolioAllocation.positions || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Sharpe Ratio</span>
                  <span className="font-medium">{metrics?.riskMetrics.sharpeRatio.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Max Drawdown</span>
                  <span className="font-medium text-red-600">-{metrics?.riskMetrics.maxDrawdown.toFixed(2) || '0.00'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Volatility</span>
                  <span className="font-medium">{metrics?.riskMetrics.volatility.toFixed(2) || '0.00'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Value at Risk</span>
                  <span className="font-medium text-red-600">${metrics?.riskMetrics.valueAtRisk.toFixed(2) || '0.00'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Trading Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-4 w-4" />
                  Trading Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Win Streak</span>
                  <span className="font-medium text-green-600">{analytics?.streaks.currentWinStreak || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Best Streak</span>
                  <span className="font-medium">{analytics?.streaks.longestWinStreak || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Hold Time</span>
                  <span className="font-medium">{analytics?.tradingPatterns.avgHoldTime.toFixed(1) || '0.0'}min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Position</span>
                  <span className="font-medium">${analytics?.tradingPatterns.avgPositionSize.toFixed(2) || '0.00'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeframe Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Timeframe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {analytics && Object.entries(analytics.timeframes).map(([period, data]) => (
                  <div key={period} className="text-center space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">{period.toUpperCase()}</div>
                    <div className={`text-lg font-bold ${data.return > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.return > 0 ? '+' : ''}${data.return.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data.trades} trades • {data.winRate.toFixed(1)}% win rate
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Positions</CardTitle>
              <CardDescription>
                Real-time portfolio positions and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.positions && metrics.positions.length > 0 ? (
                <div className="space-y-4">
                  {metrics.positions.map((position: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{position.tokenName}</div>
                        <div className="text-sm text-muted-foreground">
                          {position.quantity.toFixed(4)} @ ${position.entryPrice.toFixed(6)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Held for {Math.floor(position.holdDuration / 60)}h {position.holdDuration % 60}m
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">${position.currentValue.toFixed(2)}</div>
                        <div className={`text-sm ${position.unrealizedPnL > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.unrealizedPnL > 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)} 
                          ({position.unrealizedPnLPercent > 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%)
                        </div>
                        <Badge className={getRiskBadgeColor(position.riskLevel)}>
                          {position.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="mx-auto h-8 w-8 mb-2" />
                  <p>No active positions</p>
                  <p className="text-sm">Positions will appear here when copy trading starts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Best and Worst Trades */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Best Trade</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.bestTrade && analytics.bestTrade.tokenName !== 'None' ? (
                  <div className="space-y-2">
                    <div className="font-medium">{analytics.bestTrade.tokenName}</div>
                    <div className="text-2xl font-bold text-green-600">
                      +${analytics.bestTrade.pnl.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {analytics.bestTrade.pnlPercent.toFixed(2)}% gain • {Math.floor(analytics.bestTrade.holdTime / 60)}h {analytics.bestTrade.holdTime % 60}m hold
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No trades yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Worst Trade</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.worstTrade && analytics.worstTrade.tokenName !== 'None' ? (
                  <div className="space-y-2">
                    <div className="font-medium">{analytics.worstTrade.tokenName}</div>
                    <div className="text-2xl font-bold text-red-600">
                      ${analytics.worstTrade.pnl.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {analytics.worstTrade.pnlPercent.toFixed(2)}% loss • {Math.floor(analytics.worstTrade.holdTime / 60)}h {analytics.worstTrade.holdTime % 60}m hold
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No trades yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          {/* Portfolio Health Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Portfolio Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {riskAlerts?.portfolioHealth?.score || 0}/100
                  </div>
                  <Badge className={getRiskBadgeColor(riskAssessment?.overallRisk || 'low')}>
                    {riskAssessment?.overallRisk?.toUpperCase() || 'LOW'} RISK
                  </Badge>
                </div>
                
                {riskAssessment?.portfolioHealth && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Diversification</span>
                        <span>{riskAssessment.portfolioHealth.diversification.toFixed(0)}%</span>
                      </div>
                      <Progress value={riskAssessment.portfolioHealth.diversification} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Liquidity</span>
                        <span>{riskAssessment.portfolioHealth.liquidity.toFixed(0)}%</span>
                      </div>
                      <Progress value={riskAssessment.portfolioHealth.liquidity} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Concentration Risk</span>
                        <span>{riskAssessment.portfolioHealth.concentration.toFixed(0)}%</span>
                      </div>
                      <Progress value={riskAssessment.portfolioHealth.concentration} className="h-2 [&>div]:bg-red-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Correlation</span>
                        <span>{riskAssessment.portfolioHealth.correlation.toFixed(0)}%</span>
                      </div>
                      <Progress value={riskAssessment.portfolioHealth.correlation} className="h-2 [&>div]:bg-yellow-500" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warnings and Recommendations */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Risk Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskAssessment?.warnings && riskAssessment.warnings.length > 0 ? (
                  <ul className="space-y-2">
                    {riskAssessment.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-green-500" />
                    <p>No risk warnings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskAssessment?.recommendations && riskAssessment.recommendations.length > 0 ? (
                  <ul className="space-y-2">
                    {riskAssessment.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Portfolio looks good!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}