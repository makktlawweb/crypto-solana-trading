import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Wallet, Coins, Clock, ExternalLink, Copy, Download, Filter, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UnifiedExplorerProps {
  onWalletSelect?: (address: string) => void;
  onTokenSelect?: (address: string) => void;
}

export default function UnifiedExplorer({ onWalletSelect, onTokenSelect }: UnifiedExplorerProps) {
  const [searchMode, setSearchMode] = useState<"wallet" | "token">("wallet");
  const [searchInput, setSearchInput] = useState("");
  const [timeWindow, setTimeWindow] = useState<"5" | "15" | "30" | "60">("30");
  const [currentSearch, setCurrentSearch] = useState<string>("");
  const { toast } = useToast();

  // Dynamic query based on search mode
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: [`/api/explorer/${searchMode}/${currentSearch}`, timeWindow],
    enabled: currentSearch.length > 0,
    retry: 1,
  });

  const handleSearch = () => {
    if (searchInput.trim()) {
      setCurrentSearch(searchInput.trim());
    }
  };

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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  // Mock data for demonstration
  const mockWalletData = {
    address: searchInput,
    totalTransactions: 1247,
    recentTokens: [
      { symbol: "BONK", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", amount: "2.5 SOL", timestamp: "2024-01-10T12:30:00Z", pnl: "+45%" },
      { symbol: "WIF", address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", amount: "1.2 SOL", timestamp: "2024-01-10T10:15:00Z", pnl: "+23%" },
      { symbol: "PEPE", address: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2", amount: "0.8 SOL", timestamp: "2024-01-10T08:45:00Z", pnl: "-12%" },
    ],
    timingWindows: {
      "5": { trades: 3, avgEntry: "2.3 min", success: "67%" },
      "15": { trades: 8, avgEntry: "8.7 min", success: "75%" },
      "30": { trades: 15, avgEntry: "18.2 min", success: "73%" },
      "60": { trades: 23, avgEntry: "34.1 min", success: "69%" }
    }
  };

  const mockTokenData = {
    address: searchInput,
    symbol: "EXAMPLE",
    earlyBuyers: [
      { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", entryTime: "1.2 min", amount: "5.2 SOL", pnl: "+234%" },
      { address: "GDyn7VdDWJWXYkzHQMdPZJzZUCFCf3ZQTFCYxhTZHTh9", entryTime: "3.8 min", amount: "2.1 SOL", pnl: "+189%" },
      { address: "HqLNZYPrjN2uNxnjPvMFNVqM7jBJPKtJfYMTFCB3CKEz", entryTime: "7.5 min", amount: "1.8 SOL", pnl: "+156%" },
    ],
    timingWindows: {
      "5": { buyers: 12, totalVolume: "45.2 SOL", avgEntry: "2.8 min" },
      "15": { buyers: 28, totalVolume: "127.6 SOL", avgEntry: "9.1 min" },
      "30": { buyers: 47, totalVolume: "203.4 SOL", avgEntry: "19.3 min" },
      "60": { buyers: 73, totalVolume: "356.8 SOL", avgEntry: "38.7 min" }
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Unified Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={searchMode} onValueChange={(value) => setSearchMode(value as "wallet" | "token")}>
              <SelectTrigger>
                <SelectValue placeholder="Search type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wallet">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Wallet Address
                  </div>
                </SelectItem>
                <SelectItem value="token">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Token Address
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-2">
              <Input
                placeholder={searchMode === "wallet" ? "Enter wallet address..." : "Enter token address..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={!searchInput.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Explore
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {currentSearch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {searchMode === "wallet" ? <Wallet className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                {searchMode === "wallet" ? "Wallet Activity" : "Token Analysis"}
              </div>
              <div className="flex items-center gap-2">
                <Select value={timeWindow} onValueChange={(value) => setTimeWindow(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        5 min
                      </div>
                    </SelectItem>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Search className="w-6 h-6 animate-spin mr-2" />
                Analyzing {searchMode}...
              </div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="timing">Timing Windows</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Address</div>
                        <div className="font-mono text-sm mt-1">{formatAddress(currentSearch)}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(currentSearch)}
                          className="mt-2"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {searchMode === "wallet" ? "Total Transactions" : "Total Buyers"}
                        </div>
                        <div className="text-2xl font-bold">
                          {searchMode === "wallet" ? mockWalletData.totalTransactions : mockTokenData.earlyBuyers.length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {timeWindow} min window
                        </div>
                        <div className="text-2xl font-bold">
                          {searchMode === "wallet" 
                            ? mockWalletData.timingWindows[timeWindow].trades 
                            : mockTokenData.timingWindows[timeWindow].buyers
                          }
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Avg Entry Time</div>
                        <div className="text-2xl font-bold">
                          {searchMode === "wallet" 
                            ? mockWalletData.timingWindows[timeWindow].avgEntry
                            : mockTokenData.timingWindows[timeWindow].avgEntry
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  {searchMode === "wallet" ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Recent Token Activity</h4>
                      {mockWalletData.recentTokens.map((token, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-semibold">{token.symbol}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {formatAddress(token.address)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onTokenSelect?.(token.address)}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{token.amount}</div>
                            <div className={`text-sm font-bold ${token.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                              {token.pnl}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Early Buyers ({timeWindow} min window)</h4>
                      {mockTokenData.earlyBuyers.map((buyer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-mono text-sm">{formatAddress(buyer.address)}</div>
                              <div className="text-sm text-muted-foreground">
                                Entry: {buyer.entryTime}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onWalletSelect?.(buyer.address)}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{buyer.amount}</div>
                            <div className="text-sm font-bold text-green-500">{buyer.pnl}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timing" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(searchMode === "wallet" ? mockWalletData.timingWindows : mockTokenData.timingWindows).map(([window, data]) => (
                      <Card key={window} className={window === timeWindow ? "border-blue-500" : ""}>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">{window} Minutes</div>
                          <div className="text-2xl font-bold">
                            {searchMode === "wallet" ? (data as any).trades : (data as any).buyers}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {searchMode === "wallet" ? "trades" : "buyers"}
                          </div>
                          <div className="text-sm font-medium text-blue-600 mt-2">
                            Avg: {(data as any).avgEntry}
                          </div>
                          {searchMode === "wallet" && (
                            <div className="text-sm font-medium text-green-600">
                              Success: {(data as any).success}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {currentSearch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <a 
                href={`https://solscan.io/account/${currentSearch}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on Solscan
              </a>
              <a 
                href={`https://explorer.solana.com/address/${currentSearch}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Solana Explorer
              </a>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}