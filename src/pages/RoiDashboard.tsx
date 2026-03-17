import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarPlus, Edit3, Lock, Plus, TrendingUp, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
import { BulkMonthAddDialog } from "@/components/roi/BulkMonthAddDialog";
import { RoiSummary } from "@/components/roi/RoiSummary";
import { ImpactToggle } from "@/components/roi/ImpactToggle";

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

function metricLabel(md: MetricDefinition) {
  if (md.kind === "currency") return `${md.name} ($)`;
  if (md.kind === "percent") return `${md.name} (%)`;
  return md.name;
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

const MONTH_META = [
  { label: "Jan", num: 1 },
  { label: "Feb", num: 2 },
  { label: "Mar", num: 3 },
  { label: "Apr", num: 4 },
  { label: "May", num: 5 },
  { label: "Jun", num: 6 },
  { label: "Jul", num: 7 },
  { label: "Aug", num: 8 },
  { label: "Sep", num: 9 },
  { label: "Oct", num: 10 },
  { label: "Nov", num: 11 },
  { label: "Dec", num: 12 },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
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
    deleteMonthlyMetric,
  } = useData();

  const [params, setParams] = useSearchParams();

  const clientIdFromUrl = params.get("clientId") ?? "";
  const [clientId, setClientId] = React.useState(
    clientIdFromUrl || data.clients[0]?.id || "",
  );

  React.useEffect(() => {
    if (clientId && clientId !== clientIdFromUrl) {
      params.set("clientId", clientId);
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

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

  const latestMonth =
    months[months.length - 1]?.month ?? new Date().toISOString().slice(0, 7);
  const [activeMonth, setActiveMonth] = React.useState(latestMonth);

  React.useEffect(() => {
    setActiveMonth(latestMonth);
  }, [latestMonth, clientId]);

  const monthEntry = months.find((m) => m.month === activeMonth);

  const [openBulk, setOpenBulk] = React.useState(false);
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
      <div className="rounded-3xl border border-border/70 bg-white/70 p-8">
        <div className="text-lg font-semibold">Choose a client to view ROI</div>
      </div>
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
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ROI Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Track metrics and calculate ROI for {client.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setOpenBulk(true)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Bulk add months
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Overall ROI (client)</CardTitle>
            <div className="text-sm text-muted-foreground">
              Average monthly ROI across all months with Revenue & Service
              Expenses.
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="rounded-2xl bg-[color:var(--im-navy)] p-4 text-white ring-1 ring-white/10">
              <div className="text-xs text-white/80">Average ROI</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">
                {overallRoi.roi === undefined
                  ? "—"
                  : `${Math.round(overallRoi.roi)}%`}
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
              <div className="text-xs text-muted-foreground">Based on</div>
              <div className="mt-1 text-lg font-semibold">
                {overallRoi.months} month{overallRoi.months === 1 ? "" : "s"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Only months with both Revenue and Service Expenses {">"} 0 are
                included.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Client snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Client</span>
              <span className="font-medium text-foreground">{client.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active months</span>
              <span className="font-medium text-foreground">
                {months.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-3xl border border-border/70 bg-white/70 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-white/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Monthly Tracking</CardTitle>
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
                    <SelectTrigger className="h-9 w-[140px] rounded-xl bg-white/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.length === 0 ? (
                        <SelectItem value={activeMonth}>
                          {activeMonth}
                        </SelectItem>
                      ) : (
                        months.map((m) => (
                          <SelectItem key={m.id} value={m.month}>
                            {m.month}
                          </SelectItem>
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
                        {editingMetricId === md.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editMetricName}
                              onChange={(e) => setEditMetricName(e.target.value)}
                              className="h-8 rounded-lg"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateMetricDefinition(md.id, {
                                    name: editMetricName,
                                  });
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
                                updateMetricDefinition(md.id, {
                                  name: editMetricName,
                                });
                                setEditingMetricId(null);
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {md.name}
                            </span>
                            {isStandard && (
                              <Badge
                                variant="secondary"
                                className="h-4 rounded-full px-1.5 py-0 text-[10px] font-medium"
                              >
                                Standard
                              </Badge>
                            )}
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
                              {!isStandard && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-rose-600"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Delete metric "${md.name}"? This will remove all historical data for this KPI.`,
                                      )
                                    ) {
                                      deleteMetricDefinition(md.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
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
                            className="h-10 rounded-xl bg-white/50 pl-8 pr-4"
                            value={val === undefined ? "" : val}
                            onChange={(e) =>
                              handleValueChange(md.id, e.target.value)
                            }
                            inputMode="decimal"
                          />
                          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {md.kind === "currency" ? (
                              <span className="text-sm">$</span>
                            ) : md.kind === "percent" ? (
                              <span className="text-sm">%</span>
                            ) : (
                              <TrendingUp className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {metricDefs.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    No KPIs defined yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <RoiSummary revenue={monthRevenue} expenses={monthExpenses} />

          {monthEntry && (
            <ImpactToggle
              checked={monthEntry.includeInAgencyImpact ?? false}
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

          <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Monthly observations or context..."
                className="min-h-[120px] rounded-2xl bg-white/50"
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
                className="rounded-xl"
                value={newMetric.name}
                onChange={(e) =>
                  setNewMetric({ ...newMetric, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Unit Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["currency", "percent", "number"] as const).map((k) => (
                  <Button
                    key={k}
                    variant={newMetric.kind === k ? "default" : "outline"}
                    className="rounded-xl"
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
                  description: `"${newMetric.name}" is now available for tracking.`,
                });
              }}
            >
              Add KPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkMonthAddDialog
        open={openBulk}
        onOpenChange={setOpenBulk}
        client={client}
        existingMonths={months.map((m) => m.month)}
      />
    </div>
  );
}
