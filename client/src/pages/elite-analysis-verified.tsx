import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Crown, Star, Eye, ExternalLink, Clock, DollarSign, Activity, Search, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EliteAnalysisVerified() {
  const [selectedTab, setSelectedTab] = useState<"verified" | "timing" | "search">("verified");
  const [searchWallet, setSearchWallet] = useState("");
  const [searchToken, setSearchToken] = useState("");
  const { toast } = useToast();

  // Get verified elite wallets with real activity
  const { data: verifiedWallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/wallet-verification/verified-elites"],
    retry: 1,
  });

  // Get timing analysis for specific wallet-token pair
  const { data: timingData, isLoading: timingLoading } = useQuery({
    queryKey: ["/api/wallet-verification/timing-analysis", searchWallet, searchToken],
    enabled: searchWallet.length > 0 && searchToken.length > 0,
    retry: 1,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Elite Wallet Intelligence - Verified Data</h1>
        <p className="text-muted-foreground">
          Real wallet addresses you can verify on Solscan and Solana Explorer
        </p>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <Activity className="w-4 h-4" />
        <AlertDescription>
          <strong>Verified System:</strong> All wallet addresses below have confirmed activity on Solana blockchain. 
          Click the explorer links to cross-verify any wallet's transaction history.
        </AlertDescription>
      </Alert>

      {/* Tab Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant={selectedTab === "verified" ? "default" : "outline"}
          onClick={() => setSelectedTab("verified")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <Crown className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Verified Wallets</div>
            <div className="text-sm text-muted-foreground">Real addresses with activity</div>
          </div>
        </Button>
        <Button
          variant={selectedTab === "timing" ? "default" : "outline"}
          onClick={() => setSelectedTab("timing")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Timing Analysis</div>
            <div className="text-sm text-muted-foreground">5, 15, 30, 60 minute windows</div>
          </div>
        </Button>
        <Button
          variant={selectedTab === "search" ? "default" : "outline"}
          onClick={() => setSelectedTab("search")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <Search className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Wallet Search</div>
            <div className="text-sm text-muted-foreground">Analyze any wallet</div>
          </div>
        </Button>
      </div>

      {/* Verified Wallets Tab */}
      {selectedTab === "verified" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Verified Active Wallets
              </CardTitle>
              <CardDescription>
                Real wallet addresses with confirmed blockchain activity - verify on any Solana explorer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {walletsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Activity className="w-6 h-6 animate-spin mr-2" />
                  Verifying wallet activity...
                </div>
              ) : verifiedWallets?.wallets?.length > 0 ? (
                <div className="space-y-4">
                  {verifiedWallets.wallets.map((wallet: any, index: number) => (
                    <div key={wallet.address} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                            {wallet.address.substring(0, 8)}...{wallet.address.substring(-8)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.address)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Badge variant="secondary">
                            {wallet.spendingVelocity?.isHighVelocityTrader ? "High-Speed" : "Patient"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {wallet.activity?.totalTransactions || 0} transactions
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Since {wallet.activity?.firstSeenDate ? formatDate(wallet.activity.firstSeenDate) : "Unknown"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Recent Activity</div>
                          <div className="font-semibold">
                            {wallet.activity?.recentActivity ? "Active" : "Inactive"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Speed (tx/min)</div>
                          <div className="font-semibold">
                            {wallet.spendingVelocity?.spendingVelocity?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Last 5 min</div>
                          <div className="font-semibold">
                            {wallet.spendingVelocity?.spendingWindows?.last5min || 0} tx
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Cross-Verify</div>
                          <div className="flex gap-2">
                            <a 
                              href={wallet.crossReference?.solscan}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <a 
                              href={wallet.crossReference?.solanaExplorer}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Wallet verification in progress. The system is checking multiple known active wallets 
                    to confirm their current activity status.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timing Analysis Tab */}
      {selectedTab === "timing" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Critical Timing Windows Analysis
              </CardTitle>
              <CardDescription>
                Analyze spending patterns in first 5, 15, 30, and 60 minutes of token launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Wallet Address</label>
                  <Input
                    value={searchWallet}
                    onChange={(e) => setSearchWallet(e.target.value)}
                    placeholder="Enter wallet address to analyze"
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Token Address</label>
                  <Input
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    placeholder="Enter token address"
                    className="font-mono"
                  />
                </div>
              </div>

              {timingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="w-6 h-6 animate-spin mr-2" />
                  Analyzing timing patterns...
                </div>
              ) : timingData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-sm font-medium text-red-800 dark:text-red-200">5 Minutes</div>
                      <div className="text-lg font-bold text-red-900 dark:text-red-100">
                        {formatMarketCap(timingData.criticalWindows?.first5Minutes?.marketCap || 0)}
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300">
                        {timingData.criticalWindows?.first5Minutes?.growthRate || "0%"} growth
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-sm font-medium text-orange-800 dark:text-orange-200">15 Minutes</div>
                      <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                        {formatMarketCap(timingData.criticalWindows?.first15Minutes?.marketCap || 0)}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">
                        {timingData.criticalWindows?.first15Minutes?.growthRate || "0%"} growth
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">30 Minutes</div>
                      <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                        {formatMarketCap(timingData.criticalWindows?.first30Minutes?.marketCap || 0)}
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">
                        {timingData.criticalWindows?.first30Minutes?.growthRate || "0%"} growth
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm font-medium text-green-800 dark:text-green-200">60 Minutes</div>
                      <div className="text-lg font-bold text-green-900 dark:text-green-100">
                        {formatMarketCap(timingData.criticalWindows?.first60Minutes?.marketCap || 0)}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        {timingData.criticalWindows?.first60Minutes?.growthRate || "0%"} growth
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Spending Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Entry Speed</div>
                        <div className="font-semibold">{timingData.spendingMetrics?.entrySpeed || 0} seconds</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Spend Rate</div>
                        <div className="font-semibold">{timingData.spendingMetrics?.spendRateSOL || 0} SOL/min</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Purchase Amount</div>
                        <div className="font-semibold">{timingData.spendingMetrics?.purchaseAmount || 0} SOL</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : searchWallet && searchToken ? (
                <Alert>
                  <AlertDescription>
                    No timing data found for this wallet-token combination. This may indicate the wallet 
                    didn't trade this token, or the data is not available in our analysis window.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>
                    Enter both wallet and token addresses to analyze critical timing windows and spending patterns.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Tab */}
      {selectedTab === "search" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Wallet Verification & Analysis
              </CardTitle>
              <CardDescription>
                Verify any wallet address and analyze its blockchain activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Wallet Address to Verify</label>
                  <Input
                    value={searchWallet}
                    onChange={(e) => setSearchWallet(e.target.value)}
                    placeholder="Enter any Solana wallet address"
                    className="font-mono"
                  />
                </div>
                
                <Button 
                  onClick={() => {
                    if (searchWallet) {
                      window.open(`https://solscan.io/account/${searchWallet}`, '_blank');
                    }
                  }}
                  disabled={!searchWallet}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Verify on Solscan
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (searchWallet) {
                        window.open(`https://explorer.solana.com/address/${searchWallet}`, '_blank');
                      }
                    }}
                    disabled={!searchWallet}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Solana Explorer
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (searchWallet) {
                        window.open(`https://xray.helius.xyz/account/${searchWallet}`, '_blank');
                      }
                    }}
                    disabled={!searchWallet}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Helius X-Ray
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}