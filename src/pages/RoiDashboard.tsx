"use client";

import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { 
  CalendarPlus, 
  Edit3, 
  Lock, 
  Plus, 
  TrendingUp, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Info
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import type { MetricDefinition } from "@/types/imani";
import { formatCurrency, formatNumber } from "@/lib/format";
import { SoftButton } from "@/components/app/SoftButton";
import { RoiBulkEntryDialog } from "@/components/roi/RoiBulkEntryDialog";
import { RoiSummary } from "@/components/roi/RoiSummary";
import { ImpactToggle } from "@/components/roi/ImpactToggle";
import { RoiPerformanceChart } from "@/components/roi/RoiPerformanceChart";
import { RoiClientSelector } from "@/components/roi/RoiClientSelector";
import { RoiExportDialog } from "@/components/roi/RoiExportDialog";

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

function metricSort(a: MetricDefinition, b: MetricDefinition) {
  const aStd = a.isStandard ? 1 : 0;
  const bStd = b.isStandard ? 1 : 0;
  if (aStd !== bStd) return bStd - aStd;

  const aKey = normalizeName(a.name);
  const bKey = normalizeName(b.name);
  const order = new Map([
    ["revenue", 0],
    ["service expenses", 1],
  ]);
  const ao = order.get(aKey);
  const bo = order.get(bKey);
  if (ao !== undefined || bo !== undefined) return (ao ?? 99) - (bo ?? 99);

  return a.name.localeCompare(b.name);
}

function parseNumberOrUndefined(raw: string): number | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export default function RoiDashboard() {
  const { toast } = useToast();
  const {
    data,
    ensureStandardMetricsForClient,
    createMetricDefinition,
    updateMetricDefinition,
    deleteMetricDefinition,
    upsertMonthlyMetric,
  } = useData();

  const [params, setParams] = useSearchParams();

  const clientIdFromUrl = params.get("clientId") ?? "";
  const [clientId, setClientId] = React.useState(clientIdFromUrl || "");

  React.useEffect(() => {
    if (clientId && clientId !== clientIdFromUrl) {
      params.set("clientId", clientId);
      setParams(params, { replace: true });
    }
  }, [clientId, clientIdFromUrl, params, setParams]);

  React.useEffect(() => {
    if (!clientId) return;
    ensureStandardMetricsForClient(clientId);
  }, [clientId, ensureStandardMetricsForClient]);

  const client = data.clients.find((c) => c.id === clientId);

  const metricDefs = data.metricDefinitions
    .filter((m) => m.clientId === clientId)
    .slice()
    .sort(metricSort);

  const revenueMd =
    metricDefs.find((m) => m.isStandard && normalizeName(m.name) === "revenue") ??
    metricDefs.find((m) => normalizeName(m.name) === "revenue");

  const expensesMd =
    metricDefs.find(
      (m) =>
        m.isStandard &&
        (normalizeName(m.name) === "service expenses" ||
          normalizeName(m.name) === "service expense"),
    ) ??
    metricDefs.find(
      (m) =>
        normalizeName(m.name) === "service expenses" ||
        normalizeName(m.name) === "service expense",
    );

  const standardIds = new Set(
    [revenueMd?.id, expensesMd?.id].filter(Boolean) as string[],
  );

  const months = data.monthlyMetrics
    .filter((m) => m.clientId === clientId)
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month));

  const overallRoi = React.useMemo(() => {
    if (!revenueMd || !expensesMd)
      return { roi: undefined as number | undefined, months: 0 };
    let sum = 0;
    let count = 0;
    for (const mm of months) {
      const rev = mm.values[revenueMd.id];
      const exp = mm.values[expensesMd.id];
      if (
        typeof rev === "number" &&
        typeof exp === "number" &&
        Number.isFinite(rev) &&
        Number.isFinite(exp) &&
        exp > 0
      ) {
        const roi = ((rev - exp) / exp) * 100;
        sum += roi;
        count++;
      }
    }
    return {
      roi: count > 0 ? sum / count : undefined,
      months: count,
    };
  }, [months, revenueMd, expensesMd]);

  const yoyGrowth = React.useMemo(() => {
    if (!revenueMd || months.length < 13) return null;
    const latest = months[months.length - 1];
    const latestRev = latest.values[revenueMd.id];
    
    const lastYearParts = latest.month.split("-");
    const lastYearMonth = `${parseInt(lastYearParts[0]) - 1}-${lastYearParts[1]}`;
    const previous = months.find(m => m.month === lastYearMonth);
    const previousRev = previous?.values[revenueMd.id];

    if (typeof latestRev === "number" && typeof previousRev === "number" && previousRev > 0) {
      return ((latestRev - previousRev) / previousRev) * 100;
    }
    return null;
  }, [months, revenueMd]);

  const latestMonth =
    months[months.length - 1]?.month ?? new Date().toISOString().slice(0, 7);
  const [activeMonth, setActiveMonth] = React.useState(latestMonth);

  React.useEffect(() => {
    setActiveMonth(latestMonth);
  }, [latestMonth, clientId]);

  const monthEntry = months.find((m) => m.month === activeMonth);

  const [openBulk, setOpenBulk] = React.useState(false);
  const [openExport, setOpenExport] = React.useState(false);
  const [openAddMetric, setOpenAddMetric] = React.useState(false);
  const [newMetric, setNewMetric] = React.useState({
    name: "",
    kind: "currency" as MetricDefinition["kind"],
  });

  const [editingMetricId, setEditingMetricId] = React.useState<string | null>(
    null,
  );
  const [editMetricName, setEditMetricName] = React.useState("");

  if (!client) {
    return (
      <RoiClientSelector 
        clients={data.clients} 
        onSelect={(id) => setClientId(id)} 
      />
    );
  }

  const monthRevenue = revenueMd ? monthEntry?.values[revenueMd.id] : undefined;
  const monthExpenses = expensesMd
    ? monthEntry?.values[expensesMd.id]
    : undefined;

  const handleValueChange = (metricId: string, valStr: string) => {
    const val = parseNumberOrUndefined(valStr);
    upsertMonthlyMetric({
      clientId,
      month: activeMonth,
      values: {
        ...monthEntry?.values,
        [metricId]: val as any,
      },
    });
  };

  const handlePrevMonth = () => {
    const idx = months.findIndex((m) => m.month === activeMonth);
    if (idx > 0) setActiveMonth(months[idx - 1].month);
  };

  const handleNextMonth = () => {
    const idx = months.findIndex((m) => m.month === activeMonth);
    if (idx !== -1 && idx < months.length - 1)
      setActiveMonth(months[idx + 1].month);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl h-10 w-10 border border-border/50 bg-white/50"
            onClick={() => setClientId("")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ROI Tracking</h1>
            <p className="text-sm text-muted-foreground">
              Core KPIs for <span className="font-semibold text-foreground">{client.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setOpenExport(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setOpenBulk(true)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Bulk Entry
          </Button>
          <Button
            className="rounded-2xl"
            onClick={() => {
              setNewMetric({ name: "", kind: "currency" });
              setOpenAddMetric(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add KPI
          </Button>
        </div>
      </div>

      <RoiPerformanceChart 
        months={months} 
        revenueMd={revenueMd} 
        expensesMd={expensesMd} 
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Average ROI <Info className="h-3 w-3" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overallRoi.roi === undefined
                ? "—"
                : `${Math.round(overallRoi.roi)}%`}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              (Revenue - Service Expenses) / Service Expenses
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">YoY Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              {yoyGrowth === null ? "—" : `${Math.round(yoyGrowth)}%`}
              {yoyGrowth !== null && (
                <TrendingUp className={`h-5 w-5 ${yoyGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Revenue vs same month last year
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{months.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Total monthly records tracked
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-3xl border border-border/70 bg-white/70 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-white/30 px-6 py-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">Tracked KPIs</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handlePrevMonth}
                  disabled={months.length <= 1 || months[0]?.month === activeMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select value={activeMonth} onValueChange={setActiveMonth}>
                  <SelectTrigger className="h-9 w-[140px] rounded-xl bg-white/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {months.length === 0 ? (
                      <SelectItem value={activeMonth}>{activeMonth}</SelectItem>
                    ) : (
                      months.map((m) => (
                        <SelectItem key={m.id} value={m.month}>{m.month}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleNextMonth}
                  disabled={months.length <= 1 || months[months.length - 1]?.month === activeMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {metricDefs.map((md) => {
                  const val = monthEntry?.values[md.id];
                  const isStandard = standardIds.has(md.id);

                  return (
                    <div
                      key={md.id}
                      className="group flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        {editingMetricId === md.id && !isStandard ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editMetricName}
                              onChange={(e) => setEditMetricName(e.target.value)}
                              className="h-8 rounded-lg"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateMetricDefinition(md.id, { name: editMetricName });
                                  setEditingMetricId(null);
                                } else if (e.key === "Escape") {
                                  setEditingMetricId(null);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-8 rounded-lg"
                              onClick={() => {
                                updateMetricDefinition(md.id, { name: editMetricName });
                                setEditingMetricId(null);
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isStandard ? 'text-[color:var(--im-navy)]' : 'text-foreground'}`}>
                              {md.name}
                            </span>
                            {isStandard && (
                              <Badge
                                variant="secondary"
                                className="h-4 rounded-full px-1.5 py-0 text-[8px] font-bold uppercase bg-slate-100 text-slate-500 border-none"
                              >
                                <Lock className="h-2 w-2 mr-1" /> Locked
                              </Badge>
                            )}
                            {!isStandard && (
                              <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setEditingMetricId(md.id);
                                    setEditMetricName(md.name);
                                  }}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-rose-600"
                                  onClick={() => {
                                    if (confirm(`Delete metric "${md.name}"? Historical data will be lost.`)) {
                                      deleteMetricDefinition(md.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {md.kind}
                        </div>
                      </div>

                      <div className="w-full sm:w-48">
                        <div className="relative">
                          <Input
                            placeholder="0.00"
                            className="h-10 rounded-xl bg-white/50 pl-8 pr-4 focus:ring-primary/20"
                            value={val === undefined ? "" : val}
                            onChange={(e) => handleValueChange(md.id, e.target.value)}
                            inputMode="decimal"
                          />
                          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {md.kind === "currency" ? (
                              <span className="text-sm font-medium">$</span>
                            ) : md.kind === "percent" ? (
                              <span className="text-sm font-medium">%</span>
                            ) : (
                              <TrendingUp className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <RoiSummary revenue={monthRevenue} expenses={monthExpenses} />

          {monthEntry && (
            <ImpactToggle
              checked={monthEntry.includeInAgencyImpact ?? true}
              onCheckedChange={(val) => {
                upsertMonthlyMetric({
                  clientId,
                  month: activeMonth,
                  includeInAgencyImpact: val,
                  values: monthEntry.values,
                });
              }}
            />
          )}

          <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Monthly Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Context for this month's performance..."
                className="min-h-[120px] rounded-2xl bg-white/50 resize-none border-border/50"
                value={monthEntry?.notes ?? ""}
                onChange={(e) =>
                  upsertMonthlyMetric({
                    clientId,
                    month: activeMonth,
                    notes: e.target.value,
                    values: monthEntry?.values ?? {},
                  })
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openAddMetric} onOpenChange={setOpenAddMetric}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add New KPI</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">KPI Name</Label>
              <Input
                id="name"
                placeholder="e.g. Sales, Lead Volume, CPA"
                className="rounded-xl h-11"
                value={newMetric.name}
                onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Unit Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["currency", "percent", "number"] as const).map((k) => (
                  <Button
                    key={k}
                    variant={newMetric.kind === k ? "default" : "outline"}
                    className="rounded-xl h-10"
                    onClick={() => setNewMetric({ ...newMetric, kind: k })}
                  >
                    {k === "currency" ? "$" : k === "percent" ? "%" : "#"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpenAddMetric(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={!newMetric.name.trim()}
              onClick={() => {
                createMetricDefinition({
                  clientId,
                  name: newMetric.name,
                  kind: newMetric.kind,
                });
                setOpenAddMetric(false);
                toast({
                  title: "KPI Added",
                  description: `"${newMetric.name}" is now available.`,
                });
              }}
            >
              Add KPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RoiBulkEntryDialog
        open={openBulk}
        onOpenChange={setOpenBulk}
        client={client}
        metricDefs={metricDefs}
      />

      <RoiExportDialog
        open={openExport}
        onOpenChange={setOpenExport}
        client={client}
        metricDefs={metricDefs}
        months={months}
      />
    </div>
  );
}