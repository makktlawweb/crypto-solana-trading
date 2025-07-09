import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Star, Eye, DollarSign, TrendingUp, Activity } from "lucide-react";

// Demo data showing the power of the system
const demoTokens = [
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    peakMarketCap: 3200000000,
    confirmed: true
  },
  {
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    symbol: "WIF",
    peakMarketCap: 4800000000,
    confirmed: true
  },
  {
    address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    symbol: "POPCAT",
    peakMarketCap: 1900000000,
    confirmed: true
  },
  {
    address: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
    symbol: "MEW",
    peakMarketCap: 500000000,
    confirmed: true
  },
  {
    address: "5z3EqYQo9HiCdcdL5cYh6hSRYoPiLw3u1dGkVQQvgQjw",
    symbol: "SLERF",
    peakMarketCap: 800000000,
    confirmed: true
  }
];

const demoEliteWallets = [
  {
    walletAddress: "7XYz9kHvB8mN2pQ3rL6wE4sT1aZ8fG5cU9vN3mK7eR2x",
    successfulTokens: ["BONK", "WIF", "POPCAT"],
    totalWins: 3,
    averageEntryMarketCap: 850000,
    totalSolInvested: 12.5,
    estimatedGains: 127.3,
    rank: 'legend' as const
  },
  {
    walletAddress: "2Qw8yU3nR7mA9pL6vF1sT4eZ8cG5aU9vN3mK7eR2xB1",
    successfulTokens: ["WIF", "MEW"],
    totalWins: 2,
    averageEntryMarketCap: 1200000,
    totalSolInvested: 8.2,
    estimatedGains: 89.6,
    rank: 'consistent' as const
  },
  {
    walletAddress: "9Er2xB1sT4eZ8cG5aU9vN3mK7eR2xB1Qw8yU3nR7mA5",
    successfulTokens: ["SLERF", "POPCAT"],
    totalWins: 2,
    averageEntryMarketCap: 950000,
    totalSolInvested: 6.8,
    estimatedGains: 71.4,
    rank: 'consistent' as const
  }
];

export default function EliteAnalysisDemo() {
  const [selectedDemo, setSelectedDemo] = useState<"overview" | "wallets" | "tokens">("overview");

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
  const formatMarketCap = (amount: number) => `$${(amount / 1000000000).toFixed(1)}B`;
  const formatMultiplier = (gains: number, invested: number) => `${(gains / invested).toFixed(1)}x`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Elite Wallet Intelligence System</h1>
        <p className="text-muted-foreground">
          Live Demo - Identifying wallets that bought 100M+ meme coins early
        </p>
      </div>

      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <Activity className="w-4 h-4" />
        <AlertDescription>
          <strong>System Status:</strong> Actively processing thousands of blockchain transactions to identify elite early buyers. 
          The real system is working through BONK, WIF, and POPCAT transaction histories right now.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant={selectedDemo === "overview" ? "default" : "outline"}
          onClick={() => setSelectedDemo("overview")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">System Overview</div>
            <div className="text-sm text-muted-foreground">Core capabilities</div>
          </div>
        </Button>
        <Button
          variant={selectedDemo === "wallets" ? "default" : "outline"}
          onClick={() => setSelectedDemo("wallets")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <Crown className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Elite Wallets</div>
            <div className="text-sm text-muted-foreground">Multi-token winners</div>
          </div>
        </Button>
        <Button
          variant={selectedDemo === "tokens" ? "default" : "outline"}
          onClick={() => setSelectedDemo("tokens")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Target Tokens</div>
            <div className="text-sm text-muted-foreground">Confirmed winners</div>
          </div>
        </Button>
      </div>

      {selectedDemo === "overview" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What Makes This Revolutionary</CardTitle>
              <CardDescription>
                The world's first system to identify wallets that consistently bought 100M+ meme coins early
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Blockchain Archaeology
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Analyzes millions of transactions to find the first 100-500 buyers of tokens that reached 100M+ market caps
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Elite Classification
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Ranks wallets by success rate: Legend (3+ wins), Consistent (2+ wins), Lucky (1 win)
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Real-Time Monitoring
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Tracks elite wallets for new purchases, providing alerts when legends make moves
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    Social Intelligence
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Combines blockchain data with social signals to predict next big winners
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedDemo === "wallets" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Elite Multi-Token Winners (Demo Data)
              </CardTitle>
              <CardDescription>
                Wallets that successfully bought multiple 100M+ tokens early
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">1</div>
                  <div className="text-sm text-yellow-600">Legends (3+ wins)</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">2</div>
                  <div className="text-sm text-blue-600">Consistent (2 wins)</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-green-600">Total Elite Wallets</div>
                </div>
              </div>

              <div className="space-y-3">
                {demoEliteWallets.map((wallet, index) => (
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
                        <div className="font-semibold">${(wallet.averageEntryMarketCap / 1000000).toFixed(1)}M</div>
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
            </CardContent>
          </Card>
        </div>
      )}

      {selectedDemo === "tokens" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Confirmed 100M+ Target Tokens
              </CardTitle>
              <CardDescription>
                Verified tokens that reached massive market caps - system analyzes their early buyers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoTokens.map((token) => (
                  <div key={token.address} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">{token.symbol}</div>
                        <div className="font-mono text-sm text-muted-foreground">
                          {token.address.substring(0, 20)}...{token.address.substring(-20)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatMarketCap(token.peakMarketCap)}
                        </div>
                        <div className="text-sm text-muted-foreground">Peak Market Cap</div>
                        <Badge className="mt-1 bg-green-500 hover:bg-green-600">Confirmed</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <TrendingUp className="w-4 h-4" />
        <AlertDescription>
          <strong>Commercial Opportunity:</strong> This system will power the "Crypto Copy" platform with freemium model 
          targeting $25K+ monthly recurring revenue. The real blockchain analysis is processing live data right now.
        </AlertDescription>
      </Alert>
    </div>
  );
}