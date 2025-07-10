import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Filter, Search, Copy, ExternalLink, Star, Crown, Eye, Plus, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletResult {
  address: string;
  tokensTraded: string[];
  rank: 'legend' | 'consistent' | 'lucky';
  totalEarlyBuys: number;
  estimatedValue?: number;
  recentActivity?: boolean;
}

interface WalletResultsExplorerProps {
  wallets: WalletResult[];
  title: string;
  onExport?: (selectedWallets: WalletResult[]) => void;
}

export default function WalletResultsExplorer({ wallets, title, onExport }: WalletResultsExplorerProps) {
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRank, setFilterRank] = useState<string>("all");
  const [filterTokens, setFilterTokens] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rank");
  const [watchList, setWatchList] = useState<Set<string>>(new Set());
  const [showExportPanel, setShowExportPanel] = useState(false);
  const { toast } = useToast();

  // Filter and sort wallets
  const filteredWallets = wallets
    .filter(wallet => {
      const matchesSearch = wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           wallet.tokensTraded.some(token => token.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRank = filterRank === "all" || wallet.rank === filterRank;
      const matchesTokens = filterTokens === "all" || wallet.tokensTraded.includes(filterTokens);
      return matchesSearch && matchesRank && matchesTokens;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rank":
          const rankOrder = { legend: 3, consistent: 2, lucky: 1 };
          return rankOrder[b.rank] - rankOrder[a.rank];
        case "tokens":
          return b.totalEarlyBuys - a.totalEarlyBuys;
        case "value":
          return (b.estimatedValue || 0) - (a.estimatedValue || 0);
        default:
          return 0;
      }
    });

  const handleSelectWallet = (address: string, checked: boolean) => {
    const newSelected = new Set(selectedWallets);
    if (checked) {
      newSelected.add(address);
    } else {
      newSelected.delete(address);
    }
    setSelectedWallets(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWallets(new Set(filteredWallets.map(w => w.address)));
    } else {
      setSelectedWallets(new Set());
    }
  };

  const addToWatchList = (address: string) => {
    const newWatchList = new Set(watchList);
    newWatchList.add(address);
    setWatchList(newWatchList);
    toast({
      title: "Added to Watch List",
      description: `Wallet ${address.substring(0, 8)}... added to monitoring`,
    });
  };

  const removeFromWatchList = (address: string) => {
    const newWatchList = new Set(watchList);
    newWatchList.delete(address);
    setWatchList(newWatchList);
    toast({
      title: "Removed from Watch List",
      description: `Wallet ${address.substring(0, 8)}... removed from monitoring`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const exportSelectedWallets = () => {
    const selectedWalletData = filteredWallets.filter(w => selectedWallets.has(w.address));
    if (onExport) {
      onExport(selectedWalletData);
    }
    
    // Also create downloadable CSV
    const csvData = selectedWalletData.map(wallet => ({
      Address: wallet.address,
      Rank: wallet.rank,
      TotalEarlyBuys: wallet.totalEarlyBuys,
      TokensTraded: wallet.tokensTraded.join(';'),
      EstimatedValue: wallet.estimatedValue || 0,
      RecentActivity: wallet.recentActivity || false,
      SolscanURL: `https://solscan.io/account/${wallet.address}`,
      SolanaExplorerURL: `https://explorer.solana.com/address/${wallet.address}`
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elite-wallets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `${selectedWalletData.length} wallets exported to CSV`,
    });
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

  const uniqueTokens = [...new Set(wallets.flatMap(w => w.tokensTraded))];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{filteredWallets.length} results</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportPanel(!showExportPanel)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wallets or tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRank} onValueChange={setFilterRank}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranks</SelectItem>
                <SelectItem value="legend">Legend</SelectItem>
                <SelectItem value="consistent">Consistent</SelectItem>
                <SelectItem value="lucky">Lucky</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTokens} onValueChange={setFilterTokens}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tokens</SelectItem>
                {uniqueTokens.map(token => (
                  <SelectItem key={token} value={token}>{token}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="tokens">Token Count</SelectItem>
                <SelectItem value="value">Estimated Value</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedWallets.size === filteredWallets.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All
              </label>
            </div>
          </div>

          {/* Export Panel */}
          {showExportPanel && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Export Options</h4>
                <Badge variant="outline">{selectedWallets.size} selected</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={exportSelectedWallets}
                  disabled={selectedWallets.size === 0}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const selectedData = filteredWallets.filter(w => selectedWallets.has(w.address));
                    const watchListData = selectedData.map(w => w.address).join('\n');
                    navigator.clipboard.writeText(watchListData);
                    toast({
                      title: "Copied to Clipboard",
                      description: `${selectedData.length} wallet addresses copied`,
                    });
                  }}
                  disabled={selectedWallets.size === 0}
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Addresses
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const selectedData = filteredWallets.filter(w => selectedWallets.has(w.address));
                    selectedData.forEach(w => addToWatchList(w.address));
                  }}
                  disabled={selectedWallets.size === 0}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Watch List
                </Button>
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-3">
            {filteredWallets.map((wallet) => (
              <div key={wallet.address} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedWallets.has(wallet.address)}
                      onCheckedChange={(checked) => handleSelectWallet(wallet.address, checked as boolean)}
                    />
                    {getRankBadge(wallet.rank)}
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
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{wallet.totalEarlyBuys} early buys</div>
                      {wallet.estimatedValue && (
                        <div className="text-xs text-muted-foreground">
                          ~${wallet.estimatedValue.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => watchList.has(wallet.address) ? removeFromWatchList(wallet.address) : addToWatchList(wallet.address)}
                    >
                      {watchList.has(wallet.address) ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Tokens Bought Early</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {wallet.tokensTraded.map((token) => (
                        <Badge key={token} variant="secondary" className="text-xs">
                          {token}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Activity Status</div>
                    <div className="mt-1">
                      <Badge variant={wallet.recentActivity ? "default" : "secondary"}>
                        {wallet.recentActivity ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Explore</div>
                    <div className="flex gap-2 mt-1">
                      <a 
                        href={`https://solscan.io/account/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Solscan
                      </a>
                      <a 
                        href={`https://explorer.solana.com/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Explorer
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // This would open a detailed analysis modal
                          toast({
                            title: "Analysis Opening",
                            description: "Deep wallet analysis coming soon",
                          });
                        }}
                      >
                        <BookOpen className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredWallets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No wallets match your current filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}