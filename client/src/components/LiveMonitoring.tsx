import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Square, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function LiveMonitoring() {
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const { data: status = {} } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
    retry: false
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ["/api/tokens"],
    refetchInterval: 10000,
    retry: false
  });

  const startMonitoringMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/monitoring/start");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({
        title: "Success",
        description: "Monitoring started successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start monitoring",
        variant: "destructive",
      });
    },
  });

  const stopMonitoringMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/monitoring/stop");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({
        title: "Success",
        description: "Monitoring stopped",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop monitoring",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "watching":
        return <Badge className="bg-green-500/20 text-green-400">WATCHING</Badge>;
      case "buy_trigger":
        return <Badge className="bg-yellow-500/20 text-yellow-400">BUY TRIGGER</Badge>;
      case "bought":
        return <Badge className="bg-blue-500/20 text-blue-400">BOUGHT</Badge>;
      case "sold":
        return <Badge className="bg-gray-500/20 text-gray-400">SOLD</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">NEW</Badge>;
    }
  };

  const formatTokenAge = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  const getTokenIcon = (symbol: string) => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500", 
      "from-green-500 to-emerald-500",
      "from-yellow-500 to-orange-500",
      "from-red-500 to-pink-500",
    ];
    const colorIndex = symbol.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast({
        title: "Copied!",
        description: "Token address copied to clipboard",
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Real-time Token Monitoring</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              (status as any)?.monitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`} />
            <span className="text-sm text-gray-300">
              {(status as any)?.monitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
            </span>
          </div>
          
          {(status as any)?.monitoring ? (
            <Button 
              variant="destructive"
              onClick={() => stopMonitoringMutation.mutate()}
              disabled={stopMonitoringMutation.isPending}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button 
              onClick={() => startMonitoringMutation.mutate()}
              disabled={startMonitoringMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Token Watch List */}
      <Card className="bg-gray-750 border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-700">
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-400">Token</TableHead>
                  <TableHead className="text-gray-400">Age</TableHead>
                  <TableHead className="text-gray-400">Market Cap</TableHead>
                  <TableHead className="text-gray-400">Price</TableHead>
                  <TableHead className="text-gray-400">Volume 24h</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tokens as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      {(status as any)?.monitoring ? 'No tokens found matching criteria' : 'Start monitoring to see tokens'}
                    </TableCell>
                  </TableRow>
                ) : (
                  (tokens as any[]).map((token: any) => (
                    <TableRow key={token.address} className="border-gray-700 hover:bg-gray-700/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-r ${getTokenIcon(token.symbol)} rounded-full flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">
                              {token.symbol?.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{token.name}</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-gray-400 font-mono">
                                {token.address?.substring(0, 4)}...{token.address?.substring(token.address.length - 4)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                onClick={() => copyToClipboard(token.address)}
                              >
                                {copiedAddress === token.address ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-300">
                        {token.createdAt ? formatTokenAge(token.createdAt) : 'Unknown'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-300">
                        ${token.marketCap?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-300">
                        ${token.price?.toFixed(6) || '0.000000'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-300">
                        ${token.volume24h?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(token.status)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
