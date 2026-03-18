import * as React from "react";
import { 
  BarChart3, 
  Users, 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Zap,
  LineChart as LineChartIcon,
  Clock,
  Banknote
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { useData } from "@/contexts/DataContext";
import { INDUSTRIES } from "@/types/imani";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function Impact() {
  const { data } = useData();

  // Aggregate Data Calculations
  const activeClients = data.clients.filter(c => c.status === "Active");
  const totalWins = data.wins.length;
  const totalReports = data.reports.filter(r => r.status === "Complete").length;

  // 1. Calculate Aggregate Revenue Tracked (from monthly metrics)
  // We look for any metric named 'Revenue' or similar across all clients
  const revenueMetrics = data.monthlyMetrics.reduce((sum, m) => {
    const revValue = Object.entries(m.values).find(([id]) => {
      const def = data.metricDefinitions.find(d => d.id === id);
      return def?.name.toLowerCase().includes("revenue");
    })?.[1] || 0;
    return sum + (typeof revValue === 'number' ? revValue : 0);
  }, 0);

  // 2. Calculate Total Agency Fees (Retainers)
  const totalFees = activeClients.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);

  // 3. Agency ROI Calculation: (Revenue Generated / Agency Fees)
  // This is an aggregate multiplier of impact
  const agencyROI = totalFees > 0 ? (revenueMetrics / totalFees).toFixed(1) : "0";

  // 4. Campaign Performance (Aggregate ROAS)
  const totalAdSpend = data.campaigns.reduce((sum, c) => sum + (c.adSpend || 0), 0);
  const totalCampaignIncome = data.campaigns.reduce((sum, c) => sum + (c.income || 0), 0);
  const aggregateROAS = totalAdSpend > 0 ? (totalCampaignIncome / totalAdSpend).toFixed(2) : "0";

  // 5. Trend Data for Charting (ROI over last 6-12 months)
  const trendData = React.useMemo(() => {
    const months = Array.from(new Set(data.monthlyMetrics.map(m => m.month))).sort();
    return months.map(month => {
      const metricsInMonth = data.monthlyMetrics.filter(m => m.month === month);
      const monthlyRevenue = metricsInMonth.reduce((sum, m) => {
        const revValue = Object.entries(m.values).find(([id]) => {
          const def = data.metricDefinitions.find(d => d.id === id);
          return def?.name.toLowerCase().includes("revenue");
        })?.[1] || 0;
        return sum + (typeof revValue === 'number' ? revValue : 0);
      }, 0);

      // Simple ROI calculation for trend: Revenue / Monthly Retainers (estimated)
      return {
        month: month,
        revenue: monthlyRevenue,
        roi: totalFees > 0 ? parseFloat((monthlyRevenue / totalFees).toFixed(1)) : 0
      };
    }).slice(-12); // Last 12 months
  }, [data.monthlyMetrics, totalFees, data.metricDefinitions]);

  // 6. Time-Cost Analysis Aggregates
  const timeCostClients = data.clients.filter(c => c.enableTimeCostAnalysis && c.status === "Active");
  const totalMonthlyHoursSaved = timeCostClients.reduce((sum, c) => sum + (c.avgHoursSavedPerMonth || 0), 0);
  const totalMonthlyValueSaved = timeCostClients.reduce((sum, c) => sum + ((c.avgHoursSavedPerMonth || 0) * (c.hourlyValue || 0)), 0);
  
  const avgHoursPerClient = timeCostClients.length > 0 ? totalMonthlyHoursSaved / timeCostClients.length : 0;
  const weeklyHoursSaved = totalMonthlyHoursSaved / 4;
  const weeklyValueSaved = totalMonthlyValueSaved / 4;
  const avgValuePerClient = timeCostClients.length > 0 ? totalMonthlyValueSaved / timeCostClients.length : 0;

  // 7. Overall Averages (All Clients with Time-Cost Analysis, regardless of status)
  const allTimeCostClients = data.clients.filter(c => c.enableTimeCostAnalysis);
  const overallTotalHoursSaved = allTimeCostClients.reduce((sum, c) => sum + (c.avgHoursSavedPerMonth || 0), 0);
  const overallTotalValueSaved = allTimeCostClients.reduce((sum, c) => sum + ((c.avgHoursSavedPerMonth || 0) * (c.hourlyValue || 0)), 0);
  
  const overallAvgHoursPerClient = allTimeCostClients.length > 0 ? overallTotalHoursSaved / allTimeCostClients.length : 0;
  const overallAvgValuePerClient = allTimeCostClients.length > 0 ? overallTotalValueSaved / allTimeCostClients.length : 0;

  const highlights = [
    { label: "Revenue Tracked", value: formatCurrency(revenueMetrics), icon: DollarSign, color: "text-emerald-600", description: "Aggregate client revenue generated" },
    { label: "Agency ROI", value: `${agencyROI}x`, icon: TrendingUp, color: "text-blue-600", description: "Revenue generated vs agency fees" },
    { label: "Campaign ROAS", value: `${aggregateROAS}x`, icon: Zap, color: "text-amber-600", description: "Return on aggregate ad spend" },
    { label: "Active Impact", value: activeClients.length, icon: Users, color: "text-purple-600", description: "Total active client partnerships" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--im-navy)]">Agency Impact</h1>
          <p className="text-muted-foreground">Aggregate value and return generated across the entire portfolio.</p>
        </div>
        <div className="p-3 bg-white border rounded-2xl shadow-sm">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((h) => (
          <Card key={h.label} className="rounded-3xl border-border/50 bg-white/70 shadow-sm group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col gap-2">
                <div className={`p-2 w-fit rounded-xl bg-slate-50 ${h.color}`}>
                  <h.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold tracking-tight">{h.value}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{h.label}</div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{h.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROI Trend Chart */}
        <Card className="lg:col-span-2 rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agency ROI Trend</CardTitle>
              <CardDescription>Monthly revenue multiplier across all accounts.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              <LineChartIcon className="h-3 w-3" />
              12 Month View
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888' }}
                    tickFormatter={(value) => `${value}x`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value}x`, 'ROI']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRoi)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operational Excellence */}
        <Card className="rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Operational Impact</CardTitle>
            <CardDescription>Deliverables and documentation stats.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Insight Reports</div>
                  <div className="text-xs text-muted-foreground">Completed strategy docs</div>
                </div>
              </div>
              <div className="text-xl font-bold">{totalReports}</div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Wins Logged</div>
                  <div className="text-xs text-muted-foreground">Measurable client success</div>
                </div>
              </div>
              <div className="text-xl font-bold">{totalWins}</div>
            </div>

            <div className="p-6 rounded-2xl bg-[color:var(--im-navy)] text-white text-center">
              <div className="text-2xl font-bold mb-1">{((totalReports / (activeClients.length || 1))).toFixed(1)}</div>
              <div className="text-xs font-medium text-white/70 uppercase tracking-widest">Reports per Client</div>
              <p className="text-[10px] text-white/50 mt-4 leading-relaxed">
                A high frequency of reporting indicates strong operational alignment and client transparency.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time-Cost Analysis Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-[color:var(--im-navy)]">Time-Cost Analysis</h2>
          </div>
          <div className="text-xs font-medium text-muted-foreground px-3 py-1 bg-white border border-border/50 rounded-full shadow-sm">
            Active Client Impact
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-3xl border-indigo-100 bg-indigo-50/30 shadow-sm overflow-hidden border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-900 uppercase tracking-wider">Hours Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-3xl font-bold text-indigo-700">{formatNumber(totalMonthlyHoursSaved)}</div>
                  <div className="text-xs text-indigo-600/70">Total Monthly Hours</div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-100/50">
                  <div>
                    <div className="text-lg font-semibold text-indigo-700">{formatNumber(weeklyHoursSaved)}</div>
                    <div className="text-[10px] text-indigo-600/70 uppercase">Weekly</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-indigo-700">{formatNumber(avgHoursPerClient)}</div>
                    <div className="text-[10px] text-indigo-600/70 uppercase">Avg / Client</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-emerald-100 bg-emerald-50/30 shadow-sm overflow-hidden border-2 md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-900 uppercase tracking-wider">Monetary Value Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div>
                  <div className="text-4xl font-bold text-emerald-700">{formatCurrency(totalMonthlyValueSaved)}</div>
                  <div className="text-xs text-emerald-600/70 font-medium">Aggregate Monthly Efficiency Savings</div>
                </div>
                <div className="flex gap-8 px-6 py-4 rounded-2xl bg-white/50 border border-emerald-100/50">
                  <div>
                    <div className="text-xl font-bold text-emerald-700">{formatCurrency(weeklyValueSaved)}</div>
                    <div className="text-[10px] text-emerald-600/70 uppercase font-bold tracking-tight">Weekly Value</div>
                  </div>
                  <div className="w-px h-10 bg-emerald-100" />
                  <div>
                    <div className="text-xl font-bold text-emerald-700">{formatCurrency(avgValuePerClient)}</div>
                    <div className="text-[10px] text-emerald-600/70 uppercase font-bold tracking-tight">Avg Value / Client</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Averages Card */}
        <Card className="rounded-3xl border-border/50 bg-white/40 shadow-sm border-dashed">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[color:var(--im-navy)]">Historical Performance Averages</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Including all active and inactive client partnerships</div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600">{formatNumber(overallAvgHoursPerClient)}h</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Avg Monthly Hours Saved</div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{formatCurrency(overallAvgValuePerClient)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Avg Monthly Value Saved</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Campaign Efficiency</CardTitle>
            <CardDescription>Aggregate budget management vs results.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Ad Spend</div>
                <div className="text-lg font-bold">{formatCurrency(totalAdSpend)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Generated Income</div>
                <div className="text-lg font-bold">{formatCurrency(totalCampaignIncome)}</div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
               <div className="flex justify-between text-sm font-medium">
                  <span>Aggregate Campaign ROAS</span>
                  <span className="text-emerald-600">{aggregateROAS}x</span>
               </div>
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(aggregateROAS) * 10, 100)}%` }} 
                  />
               </div>
               <p className="text-[10px] text-muted-foreground text-center">
                 Based on {data.campaigns.length} active and historical campaigns.
               </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Industry Distribution</CardTitle>
            <CardDescription>Agency footprint by client sector.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {INDUSTRIES.map(industry => {
                const count = data.clients.filter(c => c.industry === industry).length;
                if (count === 0) return null;
                const percentage = (count / data.clients.length) * 100;
                return (
                  <div key={industry} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{industry}</span>
                      <span className="text-muted-foreground">{count} clients ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
              {/* Fallback for "Other/General" not in preset list */}
              {(() => {
                const untracked = data.clients.filter(c => !c.industry || !INDUSTRIES.includes(c.industry as any));
                if (untracked.length === 0) return null;
                const percentage = (untracked.length / data.clients.length) * 100;
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span>General / Other</span>
                      <span className="text-muted-foreground">{untracked.length} clients ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}