import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, Users, DollarSign, Crown, Star, Eye } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface EliteWallet {
  walletAddress: string;
  successfulTokens: string[];
  totalWins: number;
  averageEntryMarketCap: number;
  totalSolInvested: number;
  estimatedGains: number;
  rank: 'legend' | 'consistent' | 'lucky';
}

interface TokenAnalysis {
  tokenAddress: string;
  symbol: string;
  totalEarlyBuyers: number;
  eliteBuyers: Array<{
    walletAddress: string;
    buyRank: number;
    entryMarketCap: number;
    solInvested: number;
    buyTimestamp: string;
  }>;
  peakMarketCap: number;
}

export default function EliteAnalysisPage() {
  const [selectedToken, setSelectedToken] = useState("");
  const [maxMarketCap, setMaxMarketCap] = useState("1000000");

  // Get confirmed tokens for analysis
  const { data: confirmedTokens, isLoading: tokensLoading, error: tokensError } = useQuery({
    queryKey: ["/api/blockchain-analysis/confirmed-tokens"],
    retry: 2,
  });

  // Get multi-token winners
  const { data: multiWinners, isLoading: winnersLoading, error: winnersError } = useQuery({
    queryKey: ["/api/blockchain-analysis/multi-winners"],
    retry: 2,
  });

  // Analyze specific token
  const analyzeTokenMutation = useMutation({
    mutationFn: async ({ tokenAddress, maxCap }: { tokenAddress: string; maxCap: string }) => {
      const response = await fetch(`/api/blockchain-analysis/early-buyers/${tokenAddress}?maxMarketCap=${maxCap}`);
      if (!response.ok) throw new Error('Failed to analyze token');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blockchain-analysis"] });
    }
  });

  const handleAnalyzeToken = () => {
    if (!selectedToken) return;
    analyzeTokenMutation.mutate({ tokenAddress: selectedToken, maxCap: maxMarketCap });
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'legend':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black"><Crown className="w-3 h-3 mr-1" />Legend</Badge>;
      case 'consistent':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Star className="w-3 h-3 mr-1" />Consistent</Badge>;
      default:
        return <Badge variant="secondary"><Eye className="w-3 h-3 mr-1" />Lucky</Badge>;
    }
  };

  const formatSol = (amount: number) => `${amount.toFixed(2)} SOL`;
  const formatMarketCap = (amount: number) => `$${(amount / 1000000).toFixed(1)}M`;
  const formatMultiplier = (gains: number, invested: number) => `${(gains / invested).toFixed(1)}x`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Elite Wallet Analysis</h1>
        <p className="text-muted-foreground">
          Identify wallets that bought 100M+ meme coins early
        </p>
      </div>

      <Tabs defaultValue="multi-winners" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="multi-winners">Multi-Token Winners</TabsTrigger>
          <TabsTrigger value="token-analysis">Token Analysis</TabsTrigger>
          <TabsTrigger value="confirmed-tokens">Target Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="multi-winners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Elite Multi-Token Winners
              </CardTitle>
              <CardDescription>
                Wallets that successfully bought multiple 100M+ tokens early
              </CardDescription>
            </CardHeader>
            <CardContent>
              {winnersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Analyzing blockchain data...
                </div>
              ) : winnersError ? (
                <Alert>
                  <AlertDescription>
                    Blockchain analysis is processing massive amounts of data. The system is working through thousands of transactions 
                    to identify elite wallets. Please try the Token Analysis or confirmed tokens while the deep analysis completes.
                  </AlertDescription>
                </Alert>
              ) : multiWinners?.eliteWallets?.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {multiWinners.breakdown.legends}
                      </div>
                      <div className="text-sm text-yellow-600">Legends (3+ wins)</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {multiWinners.breakdown.consistent}
                      </div>
                      <div className="text-sm text-blue-600">Consistent (2 wins)</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {multiWinners.totalWinners}
                      </div>
                      <div className="text-sm text-green-600">Total Elite Wallets</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {multiWinners.eliteWallets.map((wallet: EliteWallet, index: number) => (
                      <div key={wallet.walletAddress} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {wallet.walletAddress.substring(0, 8)}...{wallet.walletAddress.substring(-8)}
                            </span>
                            {getRankBadge(wallet.rank)}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatMultiplier(wallet.estimatedGains, wallet.totalSolInvested)}
                            </div>
                            <div className="text-xs text-muted-foreground">estimated gains</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Wins</div>
                            <div className="font-semibold">{wallet.totalWins}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Avg Entry</div>
                            <div className="font-semibold">{formatMarketCap(wallet.averageEntryMarketCap)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Invested</div>
                            <div className="font-semibold">{formatSol(wallet.totalSolInvested)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Tokens</div>
                            <div className="font-semibold">{wallet.successfulTokens.join(', ')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No multi-token winners found. Run analysis on confirmed tokens first.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="token-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Token Early Buyer Analysis
              </CardTitle>
              <CardDescription>
                Analyze early buyers of specific tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Token Address</label>
                  <Input
                    placeholder="Enter Solana token address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Market Cap Filter</label>
                  <Input
                    placeholder="1000000"
                    value={maxMarketCap}
                    onChange={(e) => setMaxMarketCap(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium invisible">Action</label>
                  <Button 
                    onClick={handleAnalyzeToken}
                    disabled={!selectedToken || analyzeTokenMutation.isPending}
                    className="w-full"
                  >
                    {analyzeTokenMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Token'
                    )}
                  </Button>
                </div>
              </div>

              {analyzeTokenMutation.data && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Analysis Results for {analyzeTokenMutation.data.analysis.symbol}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-green-600">Early Buyers</div>
                        <div className="font-bold">{analyzeTokenMutation.data.analysis.totalEarlyBuyers}</div>
                      </div>
                      <div>
                        <div className="text-green-600">Peak Market Cap</div>
                        <div className="font-bold">{formatMarketCap(analyzeTokenMutation.data.analysis.peakMarketCap)}</div>
                      </div>
                      <div>
                        <div className="text-green-600">Top Buyer Rank</div>
                        <div className="font-bold">#{analyzeTokenMutation.data.analysis.eliteBuyers[0]?.buyRank}</div>
                      </div>
                      <div>
                        <div className="text-green-600">Top Investment</div>
                        <div className="font-bold">{formatSol(analyzeTokenMutation.data.analysis.eliteBuyers[0]?.solInvested || 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Top 10 Elite Buyers</h4>
                    {analyzeTokenMutation.data.analysis.eliteBuyers.slice(0, 10).map((buyer: any, index: number) => (
                      <div key={buyer.walletAddress} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{buyer.buyRank}</Badge>
                            <span className="font-mono text-sm">
                              {buyer.walletAddress.substring(0, 8)}...{buyer.walletAddress.substring(-8)}
                            </span>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold">{formatSol(buyer.solInvested)}</div>
                            <div className="text-muted-foreground">{formatMarketCap(buyer.entryMarketCap)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed-tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Confirmed 100M+ Tokens
              </CardTitle>
              <CardDescription>
                Target tokens that reached significant market caps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tokensLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading confirmed tokens...
                </div>
              ) : tokensError ? (
                <Alert>
                  <AlertDescription>
                    Error loading confirmed tokens. The system is actively processing blockchain data.
                  </AlertDescription>
                </Alert>
              ) : confirmedTokens?.tokens?.length > 0 ? (
                <div className="space-y-3">
                  {confirmedTokens.tokens.map((token: any) => (
                    <div key={token.address} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">{token.symbol}</div>
                          <div className="font-mono text-sm text-muted-foreground">
                            {token.address}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${(token.peakMarketCap / 1000000000).toFixed(1)}B
                          </div>
                          <div className="text-sm text-muted-foreground">Peak Market Cap</div>
                          {token.confirmed && (
                            <Badge className="mt-1 bg-green-500 hover:bg-green-600">Confirmed</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No confirmed tokens loaded. Check the blockchain analysis service.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}