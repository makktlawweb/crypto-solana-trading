import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, TrendingUp, Clock, DollarSign, Target, Activity, ExternalLink, Copy, Zap, Brain, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletInsightsPanelProps {
  walletAddress: string;
  onClose: () => void;
}

export default function WalletInsightsPanel({ walletAddress, onClose }: WalletInsightsPanelProps) {
  const [analysisType, setAnalysisType] = useState<"overview" | "recent" | "patterns" | "opportunities">("overview");
  const { toast } = useToast();

  // Get comprehensive wallet analysis
  const { data: walletData, isLoading } = useQuery({
    queryKey: [`/api/wallet-verification/comprehensive-analysis/${walletAddress}`],
    retry: 1,
  });

  // Get recent transaction analysis
  const { data: recentActivity } = useQuery({
    queryKey: [`/api/wallet-verification/recent-activity/${walletAddress}`],
    retry: 1,
  });

  // Get pattern analysis
  const { data: patterns } = useQuery({
    queryKey: [`/api/wallet-verification/trading-patterns/${walletAddress}`],
    retry: 1,
  });

  // Get opportunity suggestions
  const { data: opportunities } = useQuery({
    queryKey: [`/api/wallet-verification/opportunities/${walletAddress}`],
    retry: 1,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(-8)}`;
  };

  const mockData = {
    overview: {
      totalTransactions: 1247,
      totalValue: 187.5,
      avgPositionSize: 2.3,
      successRate: 68.5,
      avgHoldTime: "4h 23m",
      riskScore: 7.2,
      confidenceScore: 8.4
    },
    recentTokens: [
      { symbol: "DOGWIFHAT", bought: "2h ago", amount: "1.2 SOL", status: "holding", pnl: "+23%" },
      { symbol: "PEPE2", bought: "6h ago", amount: "0.8 SOL", status: "sold", pnl: "+45%" },
      { symbol: "BONK", bought: "1d ago", amount: "3.1 SOL", status: "holding", pnl: "-8%" },
      { symbol: "MYRO", bought: "2d ago", amount: "1.5 SOL", status: "sold", pnl: "+67%" },
    ],
    patterns: [
      {
        type: "Early Entry",
        description: "Consistently buys within first 15 minutes of token launches",
        confidence: 92,
        frequency: "78% of trades"
      },
      {
        type: "Volume Spike Detection",
        description: "Enters positions when trading volume increases 10x+ in 5 minutes",
        confidence: 85,
        frequency: "45% of trades"
      },
      {
        type: "Quick Profit Taking",
        description: "Takes profits at 25-50% gains, rarely holds for larger gains",
        confidence: 89,
        frequency: "65% of winning trades"
      },
      {
        type: "Risk Management",
        description: "Sets stop losses at 15-20%, consistent risk management",
        confidence: 94,
        frequency: "90% of trades"
      }
    ],
    opportunities: [
      {
        token: "SOLANA SUMMER",
        reason: "Similar pattern to BONK early entry - high volume, social momentum",
        confidence: 78,
        marketCap: "$450K",
        age: "12 minutes",
        risk: "Medium"
      },
      {
        token: "PEPE3",
        reason: "Fits their meme coin pattern - new launch, growing community",
        confidence: 65,
        marketCap: "$280K",
        age: "45 minutes",
        risk: "High"
      }
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Wallet Deep Analysis</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                {formatAddress(walletAddress)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(walletAddress)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <Tabs value={analysisType} onValueChange={(value) => setAnalysisType(value as any)} className="h-full">
          <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="patterns">Trading Patterns</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-160px)]">
            <div className="p-6">
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Transactions</div>
                          <div className="text-2xl font-bold">{mockData.overview.totalTransactions}</div>
                        </div>
                        <Activity className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Value</div>
                          <div className="text-2xl font-bold">{mockData.overview.totalValue} SOL</div>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                          <div className="text-2xl font-bold">{mockData.overview.successRate}%</div>
                        </div>
                        <Target className="w-8 h-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Avg Hold Time</div>
                          <div className="text-2xl font-bold">{mockData.overview.avgHoldTime}</div>
                        </div>
                        <Clock className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Risk Score</span>
                          <span className="font-semibold">{mockData.overview.riskScore}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${mockData.overview.riskScore * 10}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Moderate risk trader with consistent patterns
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Confidence Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Confidence</span>
                          <span className="font-semibold">{mockData.overview.confidenceScore}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${mockData.overview.confidenceScore * 10}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          High confidence based on consistent performance
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Trading Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockData.recentTokens.map((token, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-semibold">{token.symbol}</div>
                              <div className="text-sm text-muted-foreground">{token.bought}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-semibold">{token.amount}</div>
                              <Badge variant={token.status === "holding" ? "default" : "secondary"}>
                                {token.status}
                              </Badge>
                            </div>
                            <div className={`font-bold ${token.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                              {token.pnl}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patterns" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Identified Trading Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockData.patterns.map((pattern, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Brain className="w-5 h-5 text-purple-500" />
                              <h4 className="font-semibold">{pattern.type}</h4>
                            </div>
                            <Badge variant="outline">{pattern.confidence}% confidence</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                          <div className="text-sm font-medium text-blue-600">{pattern.frequency}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="opportunities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockData.opportunities.map((opp, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Zap className="w-5 h-5 text-yellow-500" />
                              <h4 className="font-semibold">{opp.token}</h4>
                            </div>
                            <Badge variant={opp.risk === "High" ? "destructive" : opp.risk === "Medium" ? "secondary" : "default"}>
                              {opp.risk} Risk
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{opp.reason}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Market Cap</div>
                              <div className="font-semibold">{opp.marketCap}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Age</div>
                              <div className="font-semibold">{opp.age}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Confidence</div>
                              <div className="font-semibold">{opp.confidence}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}