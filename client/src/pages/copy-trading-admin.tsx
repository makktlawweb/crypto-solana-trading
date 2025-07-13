import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Wallet, DollarSign, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface CopyTradingConfig {
  walletToCopy: string;
  tradingMode: 'paper' | 'live';
  budget: {
    amount: number;
    currency: 'SOL' | 'USDC';
  };
  schedule: {
    startDate: string;
    endDate: string;
    dailyStart: string;
    dailyEnd: string;
    timezone: string;
    repeatDaily: boolean;
  };
  riskManagement: {
    maxTradeSize: number;
    prorationRule: 'percentage' | 'fixed';
    smallTradeMultiplier: number;
    profitTakingMultiplier: number;
    maxProfitTaking: number;
  };
  walletSecurity: {
    useReserveWallet: boolean;
    reserveWalletAddress: string;
    tradingWalletAddress: string;
    allocationRequests: boolean;
  };
}

export default function CopyTradingAdmin() {
  const { toast } = useToast();
  const [config, setConfig] = useState<CopyTradingConfig>({
    walletToCopy: 'BHREKFkPQgAtDs8Vb1UfLkUpjG6ScidTjHaCWFuG2AtX',
    tradingMode: 'paper',
    budget: {
      amount: 10,
      currency: 'SOL'
    },
    schedule: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      dailyStart: '06:00',
      dailyEnd: '18:00',
      timezone: 'EST',
      repeatDaily: true
    },
    riskManagement: {
      maxTradeSize: 30,
      prorationRule: 'percentage',
      smallTradeMultiplier: 0.05,
      profitTakingMultiplier: 2,
      maxProfitTaking: 100
    },
    walletSecurity: {
      useReserveWallet: true,
      reserveWalletAddress: '',
      tradingWalletAddress: '',
      allocationRequests: true
    }
  });

  const [walletAnalysis, setWalletAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeWallet = async () => {
    if (!config.walletToCopy) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/${config.walletToCopy}/activity/ALL/days/-7`);
      const data = await response.json();
      setWalletAnalysis(data);
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Could not analyze wallet performance",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateProrationExample = () => {
    const maxTrade = config.riskManagement.maxTradeSize;
    const budget = config.budget.amount;
    const percentage = config.riskManagement.smallTradeMultiplier;
    
    if (maxTrade <= 10) {
      return `Small trade (${maxTrade} SOL): You use ${(maxTrade * percentage).toFixed(3)} SOL (${(percentage * 100)}% of trade)`;
    } else {
      const prorationRate = budget / maxTrade * 0.1; // 10% max as mentioned
      return `Large trade (${maxTrade} SOL): You use ${(budget * 0.1).toFixed(3)} SOL (${(prorationRate * 100).toFixed(1)}% of your budget)`;
    }
  };

  const startCopyTrading = async () => {
    if (config.tradingMode === 'live' && !config.walletSecurity.tradingWalletAddress) {
      toast({
        title: "Security Required",
        description: "Please set up wallet security before live trading",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/copy-trading/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        await fetch('/api/copy-trading/start', { method: 'POST' });
        toast({
          title: "Copy Trading Started",
          description: `${config.tradingMode === 'live' ? 'Live' : 'Paper'} trading activated`,
        });
      }
    } catch (error) {
      toast({
        title: "Configuration Error",
        description: "Could not start copy trading",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (config.walletToCopy) {
      analyzeWallet();
    }
  }, [config.walletToCopy]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Copy Trading Admin</h1>
      </div>

      {/* Wallet Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Target Wallet Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="walletToCopy">Wallet Address to Copy</Label>
              <Input
                id="walletToCopy"
                value={config.walletToCopy}
                onChange={(e) => setConfig({...config, walletToCopy: e.target.value})}
                placeholder="Enter wallet address"
              />
            </div>
            <Button onClick={analyzeWallet} disabled={isAnalyzing} className="mt-6">
              {isAnalyzing ? 'Analyzing...' : 'Analyze Wallet'}
            </Button>
          </div>

          {walletAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {walletAnalysis.summary?.netPnL?.toFixed(2) || 'N/A'} SOL
                  </div>
                  <p className="text-sm text-gray-600">7-Day Profit</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {walletAnalysis.summary?.totalTransactions || 0}
                  </div>
                  <p className="text-sm text-gray-600">Total Trades</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {walletAnalysis.summary?.winRate?.toFixed(1) || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {walletAnalysis.summary?.totalVolume?.toFixed(1) || 0} SOL
                  </div>
                  <p className="text-sm text-gray-600">Volume Traded</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Trading Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tradingMode">Trading Mode</Label>
              <Select value={config.tradingMode} onValueChange={(value: 'paper' | 'live') => 
                setConfig({...config, tradingMode: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper">Paper Trading (Test)</SelectItem>
                  <SelectItem value="live">Live Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget">Budget</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.budget.amount}
                  onChange={(e) => setConfig({
                    ...config,
                    budget: {...config.budget, amount: Number(e.target.value)}
                  })}
                  placeholder="Amount"
                />
                <Select value={config.budget.currency} onValueChange={(value: 'SOL' | 'USDC') => 
                  setConfig({...config, budget: {...config.budget, currency: value}})}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Proration Example:</strong> {calculateProrationExample()}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Trading Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.schedule.startDate}
                onChange={(e) => setConfig({
                  ...config,
                  schedule: {...config.schedule, startDate: e.target.value}
                })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={config.schedule.endDate}
                onChange={(e) => setConfig({
                  ...config,
                  schedule: {...config.schedule, endDate: e.target.value}
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dailyStart">Daily Start Time</Label>
              <Input
                id="dailyStart"
                type="time"
                value={config.schedule.dailyStart}
                onChange={(e) => setConfig({
                  ...config,
                  schedule: {...config.schedule, dailyStart: e.target.value}
                })}
              />
            </div>
            <div>
              <Label htmlFor="dailyEnd">Daily End Time</Label>
              <Input
                id="dailyEnd"
                type="time"
                value={config.schedule.dailyEnd}
                onChange={(e) => setConfig({
                  ...config,
                  schedule: {...config.schedule, dailyEnd: e.target.value}
                })}
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={config.schedule.timezone} onValueChange={(value) => 
                setConfig({...config, schedule: {...config.schedule, timezone: value}})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EST">EST</SelectItem>
                  <SelectItem value="PST">PST</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="repeatDaily"
              checked={config.schedule.repeatDaily}
              onCheckedChange={(checked) => setConfig({
                ...config,
                schedule: {...config.schedule, repeatDaily: checked}
              })}
            />
            <Label htmlFor="repeatDaily">Repeat daily schedule</Label>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxTradeSize">Max Trade Size (SOL)</Label>
              <Input
                id="maxTradeSize"
                type="number"
                value={config.riskManagement.maxTradeSize}
                onChange={(e) => setConfig({
                  ...config,
                  riskManagement: {...config.riskManagement, maxTradeSize: Number(e.target.value)}
                })}
              />
            </div>
            <div>
              <Label htmlFor="smallTradeMultiplier">Small Trade Multiplier (%)</Label>
              <Input
                id="smallTradeMultiplier"
                type="number"
                step="0.01"
                value={config.riskManagement.smallTradeMultiplier}
                onChange={(e) => setConfig({
                  ...config,
                  riskManagement: {...config.riskManagement, smallTradeMultiplier: Number(e.target.value)}
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profitTakingMultiplier">Profit Taking Multiplier</Label>
              <Input
                id="profitTakingMultiplier"
                type="number"
                value={config.riskManagement.profitTakingMultiplier}
                onChange={(e) => setConfig({
                  ...config,
                  riskManagement: {...config.riskManagement, profitTakingMultiplier: Number(e.target.value)}
                })}
              />
            </div>
            <div>
              <Label htmlFor="maxProfitTaking">Max Profit Taking (%)</Label>
              <Input
                id="maxProfitTaking"
                type="number"
                value={config.riskManagement.maxProfitTaking}
                onChange={(e) => setConfig({
                  ...config,
                  riskManagement: {...config.riskManagement, maxProfitTaking: Number(e.target.value)}
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Wallet Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="useReserveWallet"
              checked={config.walletSecurity.useReserveWallet}
              onCheckedChange={(checked) => setConfig({
                ...config,
                walletSecurity: {...config.walletSecurity, useReserveWallet: checked}
              })}
            />
            <Label htmlFor="useReserveWallet">Use Reserve Wallet System</Label>
          </div>

          {config.walletSecurity.useReserveWallet && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="reserveWallet">Reserve Wallet Address</Label>
                <Input
                  id="reserveWallet"
                  value={config.walletSecurity.reserveWalletAddress}
                  onChange={(e) => setConfig({
                    ...config,
                    walletSecurity: {...config.walletSecurity, reserveWalletAddress: e.target.value}
                  })}
                  placeholder="Your main wallet (you control)"
                />
              </div>
              <div>
                <Label htmlFor="tradingWallet">Trading Wallet Address</Label>
                <Input
                  id="tradingWallet"
                  value={config.walletSecurity.tradingWalletAddress}
                  onChange={(e) => setConfig({
                    ...config,
                    walletSecurity: {...config.walletSecurity, tradingWalletAddress: e.target.value}
                  })}
                  placeholder="Bot trading wallet (limited funds)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allocationRequests"
                  checked={config.walletSecurity.allocationRequests}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    walletSecurity: {...config.walletSecurity, allocationRequests: checked}
                  })}
                />
                <Label htmlFor="allocationRequests">Require allocation requests</Label>
              </div>
            </div>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Model:</strong> Your private keys are encrypted and only used for transactions. 
              The reserve wallet system ensures limited exposure with allocation-based trading.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={startCopyTrading} size="lg" className="flex-1">
          Start {config.tradingMode === 'live' ? 'Live' : 'Paper'} Trading
        </Button>
        <Button variant="outline" size="lg">
          Save Configuration
        </Button>
      </div>
    </div>
  );
}