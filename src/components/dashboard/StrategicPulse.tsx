import * as React from "react";
import { TrendingUp, Sparkles, Target, Zap, ArrowUpRight, DollarSign } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgencyProduct, AgencyExpense } from "@/types/imani";

export default function StrategicPulse() {
  const { data } = useData();
  const hq = data.agencyHq;

  if (!hq || !hq.overview.name) {
    return null; // Don't show if HQ not setup
  }

  // Calculations (mirrored from AgencyHq for consistency)
  const calculateMonthlyRevenue = (p: AgencyProduct) => {
    const active = p.activeClients || 0;
    if (p.pricingModel === 'monthly') return p.price * active;
    if (p.pricingModel === 'quarterly') return (p.price / 3) * active;
    if (p.pricingModel === 'semi-annually') return (p.price / 6) * active;
    if (p.pricingModel === 'annually') return (p.price / 12) * active;
    return 0;
  };

  const calculateMonthlyExpense = (e: AgencyExpense) => {
    if (e.billingCycle === 'monthly') return e.cost;
    if (e.billingCycle === 'quarterly') return e.cost / 3;
    if (e.billingCycle === 'semi-annually') return e.cost / 6;
    if (e.billingCycle === 'annually') return e.cost / 12;
    return 0;
  };

  const mrr = (hq.products || []).filter(p => p.pricingModel !== 'one-time').reduce((sum, p) => sum + calculateMonthlyRevenue(p), 0);
  const monthlyExpensesTotal = (hq.expenses || []).reduce((sum, e) => sum + calculateMonthlyExpense(e), 0);
  const annualExpensesTotal = monthlyExpensesTotal * 12;

  const projectedRevenue = (hq.products || []).reduce((sum, p) => {
    const projected = p.projectedSales || 0;
    let annualValue = 0;
    if (p.pricingModel === 'one-time') annualValue = p.price * projected;
    else if (p.pricingModel === 'monthly') annualValue = p.price * 12 * projected;
    else if (p.pricingModel === 'quarterly') annualValue = p.price * 4 * projected;
    else if (p.pricingModel === 'semi-annually') annualValue = p.price * 2 * projected;
    else if (p.pricingModel === 'annually') annualValue = p.price * projected;
    return sum + annualValue;
  }, 0);

  const projectedProfit = projectedRevenue - annualExpensesTotal;
  const profitGoal = hq.annualProfitGoal || 0;
  const progressToGoal = profitGoal > 0 ? (projectedProfit / profitGoal) * 100 : 0;

  // Momentum Score Logic
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentWins = data.wins.filter(w => new Date(w.date) > thirtyDaysAgo).length;
  const activeCampaigns = data.campaigns.filter(c => !c.endDate || new Date(c.endDate) > new Date()).length;
  const activeClients = data.clients.filter(c => c.status === "Active").length;

  const momentumScore = Math.min(100, (recentWins * 20) + (activeCampaigns * 10) + (activeClients * 2));
  
  let momentumLabel = "Steady";
  let momentumColor = "text-blue-500";
  if (momentumScore > 80) { momentumLabel = "Accelerating"; momentumColor = "text-orange-500"; }
  else if (momentumScore > 50) { momentumLabel = "High"; momentumColor = "text-emerald-500"; }
  else if (momentumScore < 20) { momentumLabel = "Low"; momentumColor = "text-slate-400"; }

  return (
    <Card className="rounded-[32px] border-primary/20 bg-primary/5 shadow-sm overflow-hidden border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Strategic Health</CardTitle>
          </div>
          <Badge variant="outline" className="rounded-full bg-white/50 border-primary/10 px-3 py-1 gap-1.5">
            <TrendingUp className={cn("h-3.5 w-3.5", momentumColor)} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{momentumLabel} Momentum</span>
          </Badge>
        </div>
        <CardDescription>Performance tracking against your annual profit roadmap.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Progress to Goal */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Annual Profit Goal</span>
              <div className="text-2xl font-bold text-[color:var(--im-navy)]">
                {formatCurrency(projectedProfit)}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ {formatCurrency(profitGoal)}</span>
              </div>
            </div>
          </div>
          <div className="relative pt-1">
            <Progress value={progressToGoal} className="h-3 rounded-full bg-primary/10" />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] font-bold text-primary">{Math.round(progressToGoal)}% Achieved</span>
              <span className="text-[10px] text-muted-foreground">Projected at current pipeline</span>
            </div>
          </div>
        </div>

        {/* Operational Efficiency */}
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Profitability</span>
            <div className="flex items-baseline gap-2">
              <div className={cn("text-2xl font-bold", (mrr - monthlyExpensesTotal) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {formatCurrency(mrr - monthlyExpensesTotal)}
              </div>
              <div className="text-xs text-muted-foreground">Net Monthly</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/60 p-2 border border-primary/5">
              <div className="text-[10px] uppercase text-muted-foreground font-medium">Income (MRR)</div>
              <div className="text-sm font-bold text-emerald-600">{formatCurrency(mrr)}</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-2 border border-primary/5">
              <div className="text-[10px] uppercase text-muted-foreground font-medium">Expenses</div>
              <div className="text-sm font-bold text-rose-600">{formatCurrency(monthlyExpensesTotal)}</div>
            </div>
          </div>
        </div>

        {/* Momentum Score Card */}
        <div className="space-y-4 hidden lg:block">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Momentum Score</span>
            <div className="text-2xl font-bold flex items-center gap-2">
              {momentumScore}
              <span className="text-sm font-normal text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[...Array(recentWins)].slice(0, 5).map((_, i) => (
                <div key={i} className="h-6 w-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                </div>
              ))}
              {recentWins > 5 && (
                <div className="h-6 w-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-emerald-600">
                  +{recentWins - 5}
                </div>
              )}
            </div>
            <div className="text-[10px] leading-tight text-muted-foreground">
              <span className="font-bold text-primary">{recentWins} Wins</span> & <span className="font-bold text-primary">{activeCampaigns} Campaigns</span>
              <br />driving growth this month.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
