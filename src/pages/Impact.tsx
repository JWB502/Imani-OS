import * as React from "react";
import { BarChart3, Sparkles, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatNumber } from "@/lib/format";

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

export default function Impact() {
  const { data } = useData();

  const activeClients = data.clients.filter((c) => c.status === "Active").length;
  const completedReports = data.reports.filter((r) => r.status === "Complete").length;
  const wins = data.wins.length;
  const caseStudyWins = data.wins.filter((w) => w.caseStudyPotential).length;

  const metricDefs = data.metricDefinitions;

  const currencyDefIds = new Set(metricDefs.filter((m) => m.kind === "currency").map((m) => m.id));
  const leadsDefIds = new Set(
    metricDefs
      .filter((m) => {
        const n = normalizeName(m.name);
        return n.includes("lead") || n.includes("call") || n.includes("appointment") || n.includes("form");
      })
      .map((m) => m.id),
  );

  const revenueDefIds = new Set(
    metricDefs
      .filter((m) => {
        const n = normalizeName(m.name);
        return m.kind === "currency" && n.includes("revenue");
      })
      .map((m) => m.id),
  );

  const donationDefIds = new Set(
    metricDefs
      .filter((m) => {
        const n = normalizeName(m.name);
        return m.kind === "currency" && n.includes("donat");
      })
      .map((m) => m.id),
  );

  const valueDefIds = new Set(
    metricDefs
      .filter((m) => {
        const n = normalizeName(m.name);
        return m.kind === "currency" && (n.includes("value") || n.includes("estimated"));
      })
      .map((m) => m.id),
  );

  const totals = data.monthlyMetrics.reduce(
    (acc, mm) => {
      for (const [k, v] of Object.entries(mm.values)) {
        const num = Number(v);
        if (!Number.isFinite(num)) continue;
        if (currencyDefIds.has(k)) acc.currency += num;
        if (leadsDefIds.has(k)) acc.leads += num;
        if (revenueDefIds.has(k)) acc.revenue += num;
        if (donationDefIds.has(k)) acc.donations += num;
        if (valueDefIds.has(k)) acc.estimatedValue += num;
      }
      return acc;
    },
    { currency: 0, revenue: 0, donations: 0, estimatedValue: 0, leads: 0 },
  );

  const monthAgg = new Map<string, number>();
  for (const mm of data.monthlyMetrics) {
    const sumCurrency = Object.entries(mm.values).reduce((s, [k, v]) => {
      if (!currencyDefIds.has(k)) return s;
      const num = Number(v);
      return Number.isFinite(num) ? s + num : s;
    }, 0);
    monthAgg.set(mm.month, (monthAgg.get(mm.month) ?? 0) + sumCurrency);
  }

  const chartData = [...monthAgg.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, value]) => ({ month, value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Agency-wide impact metrics</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Agency Impact</h1>
        </div>
        <Badge className="w-fit rounded-full bg-[color:var(--im-navy)] text-white">
          Internal executive view
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active clients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{activeClients}</div>
            <div className="mt-2 text-sm text-muted-foreground">{data.clients.length} total</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-[color:var(--im-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{completedReports}</div>
            <div className="mt-2 text-sm text-muted-foreground">Across all clients</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads captured</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{formatNumber(totals.leads)}</div>
            <div className="mt-2 text-sm text-muted-foreground">Summed from monthly KPIs</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wins documented</CardTitle>
            <Sparkles className="h-4 w-4 text-[color:var(--im-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">{wins}</div>
            <div className="mt-2 text-sm text-muted-foreground">Case-study worthy: {caseStudyWins}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Total currency impact over time</CardTitle>
            <div className="text-sm text-muted-foreground">
              Aggregates currency KPIs across all clients (revenue, value created, etc.)
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 rounded-3xl bg-white p-3 ring-1 ring-border/60">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Add currency KPIs in ROI Tracking to populate this chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, left: 10, right: 18, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#185391" fill="#26bbc0" fillOpacity={0.25} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Impact totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
              <div className="text-xs text-muted-foreground">Total revenue tracked</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(totals.revenue)}</div>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
              <div className="text-xs text-muted-foreground">Total donations influenced</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(totals.donations)}</div>
            </div>
            <div className="rounded-2xl bg-[color:var(--im-navy)] p-4 text-white ring-1 ring-white/10">
              <div className="text-xs text-white/80">Estimated value created</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(totals.estimatedValue)}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              Totals are computed from ROI KPI definitions (custom per client).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
