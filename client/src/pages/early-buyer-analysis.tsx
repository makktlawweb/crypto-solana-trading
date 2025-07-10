import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Star, Eye, ExternalLink, Clock, DollarSign, Activity, Copy, Target, Database, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WalletResultsExplorer from "@/components/WalletResultsExplorer";
import WalletInsightsPanel from "@/components/WalletInsightsPanel";
import UnifiedExplorer from "@/components/UnifiedExplorer";

export default function EarlyBuyerAnalysis() {
  const [selectedTab, setSelectedTab] = useState<"demo" | "analysis" | "legends" | "explorer">("demo");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const { toast } = useToast();

  // Get the 3 unverifiable demo addresses
  const { data: demoAddresses } = useQuery({
    queryKey: ["/api/wallet-verification/demo-addresses"],
    retry: 1,
  });

  // Get comprehensive early buyer analysis
  const { data: earlyBuyerData, isLoading: analysisLoading } = useQuery({
    queryKey: ["/api/wallet-verification/early-buyer-analysis"],
    retry: 1,
  });

  // Get multi-token legends
  const { data: legends, isLoading: legendsLoading } = useQuery({
    queryKey: ["/api/wallet-verification/multi-token-legends"],
    retry: 1,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Early Buyer Intelligence - BONK, WIF, SLERF</h1>
        <p className="text-muted-foreground">
          Real blockchain analysis of wallets that bought major tokens in the first 30 minutes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          variant={selectedTab === "demo" ? "default" : "outline"}
          onClick={() => setSelectedTab("demo")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <Eye className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Demo Addresses</div>
            <div className="text-sm text-muted-foreground">The 3 unverifiable wallets</div>
          </div>
        </Button>
        <Button
          variant={selectedTab === "analysis" ? "default" : "outline"}
          onClick={() => setSelectedTab("analysis")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <Activity className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Early Buyer Analysis</div>
            <div className="text-sm text-muted-foreground">First 30 minutes buyers</div>
          </div>
        </Button>
        <Button
          variant={selectedTab === "legends" ? "default" : "outline"}
          onClick={() => setSelectedTab("legends")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <Crown className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Multi-Token Legends</div>
            <div className="text-sm text-muted-foreground">Bought all 3 early</div>
          </div>
        </Button>
        <Button
          variant={selectedTab === "explorer" ? "default" : "outline"}
          onClick={() => setSelectedTab("explorer")}
          className="h-auto p-4"
        >
          <div className="text-center">
            <Database className="w-6 h-6 mx-auto mb-2" />
            <div className="font-semibold">Results Explorer</div>
            <div className="text-sm text-muted-foreground">Grab and manipulate data</div>
          </div>
        </Button>
      </div>

      {/* Demo Addresses Tab */}
      {selectedTab === "demo" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-red-500" />
                Unverifiable Demo Addresses
              </CardTitle>
              <CardDescription>
                These are the 3 wallet addresses from the demo that show no activity on blockchain explorers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-4">
                <Target className="w-4 h-4" />
                <AlertDescription>
                  <strong>Issue Identified:</strong> These addresses were fabricated for demo purposes and have no real blockchain activity.
                  You can verify this yourself by checking them on Solscan or Solana Explorer.
                </AlertDescription>
              </Alert>

              {demoAddresses?.addresses?.map((address: string, index: number) => (
                <div key={address} className="p-4 border rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">Demo #{index + 1}</Badge>
                      <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                        {address}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(address)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Cross-Verify (will show no activity)</div>
                      <div className="flex gap-2">
                        <a 
                          href={`https://solscan.io/account/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Solscan
                        </a>
                        <a 
                          href={`https://explorer.solana.com/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Solana Explorer
                        </a>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="text-red-600 font-semibold">No blockchain activity found</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Early Buyer Analysis Tab */}
      {selectedTab === "analysis" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Early Buyer Analysis Results
              </CardTitle>
              <CardDescription>
                Wallets that bought BONK, WIF, and SLERF in the first 30 minutes after launch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Activity className="w-6 h-6 animate-spin mr-2" />
                  Analyzing blockchain transactions...
                </div>
              ) : earlyBuyerData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-sm font-medium text-orange-800 dark:text-orange-200">BONK Early Buyers</div>
                      <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {earlyBuyerData.BONK?.length || 0}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">
                        First 30 minutes
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">WIF Early Buyers</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {earlyBuyerData.WIF?.length || 0}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        First 30 minutes
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm font-medium text-purple-800 dark:text-purple-200">SLERF Early Buyers</div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {earlyBuyerData.SLERF?.length || 0}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">
                        First 30 minutes
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Multi-Token Early Buyers</h4>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {earlyBuyerData.multiTokenBuyers?.length || 0}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Wallets that bought 2+ tokens in first 30 minutes
                    </div>
                  </div>

                  <Alert>
                    <Activity className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Real Blockchain Data:</strong> These numbers represent actual wallet addresses that participated 
                      in the first 30 minutes of trading for each token. All addresses can be verified on Solana blockchain explorers.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Analysis in progress. The system is scanning blockchain transactions for early buyers of BONK, WIF, and SLERF.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legends Tab */}
      {selectedTab === "legends" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Multi-Token Legends
              </CardTitle>
              <CardDescription>
                Wallets that bought BONK, WIF, and SLERF all within the first 30 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {legendsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Crown className="w-6 h-6 animate-spin mr-2" />
                  Finding legendary wallets...
                </div>
              ) : legends ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Total Legends</div>
                      <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {legends.breakdown?.legends || 0}
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300">
                        Bought 3+ tokens early
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Consistent Traders</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {legends.breakdown?.consistent || 0}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        Bought 2+ tokens early
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm font-medium text-green-800 dark:text-green-200">BONK+WIF+SLERF</div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {legends.bonkWifSlerfLegends || 0}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        Bought all 3 early
                      </div>
                    </div>
                  </div>

                  {legends.legends && legends.legends.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Top Multi-Token Early Buyers:</h4>
                      {legends.legends.map((legend: any, index: number) => (
                        <div key={legend.walletAddress} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">
                                <Crown className="w-3 h-3 mr-1" />
                                {legend.rank}
                              </Badge>
                              <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                                {legend.walletAddress.substring(0, 8)}...{legend.walletAddress.substring(-8)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(legend.walletAddress)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedWallet(legend.walletAddress)}
                              >
                                <Filter className="w-4 h-4 mr-1" />
                                Deep Analysis
                              </Button>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{legend.totalEarlyBuys} early buys</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Tokens Bought Early</div>
                              <div className="flex gap-1 mt-1">
                                {legend.tokensTraded.map((token: string) => (
                                  <Badge key={token} variant="secondary" className="text-xs">
                                    {token}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Cross-Verify</div>
                              <div className="flex gap-2 mt-1">
                                <a 
                                  href={`https://solscan.io/account/${legend.walletAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Solscan
                                </a>
                                <a 
                                  href={`https://explorer.solana.com/address/${legend.walletAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Explorer
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
                        No wallets found that bought BONK, WIF, and SLERF all within the first 30 minutes. 
                        This suggests these were independent opportunities rather than coordinated by the same early buyers.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Searching for legendary wallets that bought multiple major tokens in the first 30 minutes...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Explorer Tab */}
      {selectedTab === "explorer" && (
        <div className="space-y-4">
          <UnifiedExplorer
            onWalletSelect={(address) => setSelectedWallet(address)}
            onTokenSelect={(address) => {
              // Switch to token analysis mode
              toast({
                title: "Token Analysis",
                description: `Analyzing token ${address.substring(0, 8)}...`,
              });
            }}
          />
        </div>
      )}

      {/* Wallet Insights Modal */}
      {selectedWallet && (
        <WalletInsightsPanel
          walletAddress={selectedWallet}
          onClose={() => setSelectedWallet(null)}
        />
      )}
    </div>
  );
}