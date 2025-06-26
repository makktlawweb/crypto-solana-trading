import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TradingParameters } from "@shared/schema";

export default function ParametersSection() {
  const { toast } = useToast();
  const [parameters, setParameters] = useState<Partial<TradingParameters>>({});

  const { data: currentParameters, isLoading } = useQuery({
    queryKey: ["/api/parameters"],
    onSuccess: (data) => {
      if (data) {
        setParameters(data);
      }
    },
  });

  const saveParametersMutation = useMutation({
    mutationFn: async (params: Partial<TradingParameters>) => {
      const response = await apiRequest("POST", "/api/parameters", params);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parameters"] });
      toast({
        title: "Success",
        description: "Trading parameters saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save parameters",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveParametersMutation.mutate(parameters);
  };

  const updateParameter = (key: string, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div className="mb-8 h-48 bg-gray-800 rounded-xl border border-gray-700 animate-pulse" />;
  }

  return (
    <section className="mb-8">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <Settings className="text-primary" />
              <span>Strategy Parameters</span>
            </CardTitle>
            <Button 
              onClick={handleSave}
              disabled={saveParametersMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-300">Watch Threshold (MC)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input
                  type="number"
                  className="bg-gray-700 border-gray-600 text-white font-mono pl-8 focus:ring-primary focus:border-transparent"
                  placeholder="10000"
                  value={parameters.watchThreshold || ''}
                  onChange={(e) => updateParameter('watchThreshold', parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-gray-400">Minimum market cap to start watching</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Buy Trigger (MC)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input
                  type="number"
                  className="bg-gray-700 border-gray-600 text-white font-mono pl-8 focus:ring-primary focus:border-transparent"
                  placeholder="6000"
                  value={parameters.buyTrigger || ''}
                  onChange={(e) => updateParameter('buyTrigger', parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-gray-400">Market cap that triggers buy consideration</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Buy Price (MC)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input
                  type="number"
                  className="bg-gray-700 border-gray-600 text-white font-mono pl-8 focus:ring-primary focus:border-transparent"
                  placeholder="8000"
                  value={parameters.buyPrice || ''}
                  onChange={(e) => updateParameter('buyPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-gray-400">Actual limit order price</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Take Profit Multiplier</Label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">x</span>
                <Input
                  type="number"
                  step="0.1"
                  className="bg-gray-700 border-gray-600 text-white font-mono pr-8 focus:ring-primary focus:border-transparent"
                  placeholder="2.0"
                  value={parameters.takeProfitMultiplier || ''}
                  onChange={(e) => updateParameter('takeProfitMultiplier', parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-gray-400">Multiplier for take profit (2x = 100% gain)</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Stop Loss %</Label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
                <Input
                  type="number"
                  step="1"
                  className="bg-gray-700 border-gray-600 text-white font-mono pr-8 focus:ring-primary focus:border-transparent"
                  placeholder="20"
                  value={parameters.stopLossPercent || ''}
                  onChange={(e) => updateParameter('stopLossPercent', parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="text-xs text-gray-400">Stop loss percentage below buy trigger</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Max Age (minutes)</Label>
              <Input
                type="number"
                className="bg-gray-700 border-gray-600 text-white font-mono focus:ring-primary focus:border-transparent"
                placeholder="2"
                value={parameters.maxAge || ''}
                onChange={(e) => updateParameter('maxAge', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-400">Maximum token age to consider</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Position Size (SOL)</Label>
              <Input
                type="number"
                step="0.1"
                className="bg-gray-700 border-gray-600 text-white font-mono focus:ring-primary focus:border-transparent"
                placeholder="1.0"
                value={parameters.positionSize || ''}
                onChange={(e) => updateParameter('positionSize', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-400">Amount to invest per trade</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">DEX Sources</Label>
              <Select value="pumpfun" onValueChange={(value) => updateParameter('dexSources', [value])}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-primary focus:border-transparent">
                  <SelectValue placeholder="Select DEX" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pumpfun">PumpFun</SelectItem>
                  <SelectItem value="raydium">Raydium</SelectItem>
                  <SelectItem value="jupiter">Jupiter</SelectItem>
                  <SelectItem value="orca">Orca</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">Primary DEX source</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
