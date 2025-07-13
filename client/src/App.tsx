import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import EliteAnalysis from "@/pages/elite-analysis";
import EliteAnalysisDemo from "@/pages/elite-analysis-demo";
import EliteAnalysisVerified from "@/pages/elite-analysis-verified";
import EarlyBuyerAnalysis from "@/pages/early-buyer-analysis";
import CopyTradingAdmin from "@/pages/copy-trading-admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/elite-analysis" component={EliteAnalysisVerified} />
      <Route path="/elite-analysis-demo" component={EliteAnalysisDemo} />
      <Route path="/elite-analysis-live" component={EliteAnalysis} />
      <Route path="/early-buyer-analysis" component={EarlyBuyerAnalysis} />
      <Route path="/copy-trading-admin" component={CopyTradingAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
