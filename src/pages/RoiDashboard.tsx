in JSX, and keep ROI bulk add, bulk edit, and Add KPI working.">
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarPlus, Edit3, Lock, Plus, TrendingUp, Trash2 } from "lucide-react";
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

  const standardMetricDefs = [revenueMd, expensesMd].filter(
    Boolean,
  ) as MetricDefinition[];
  const customMetricDefs = metricDefs.filter((m) => !standardIds.has(m.id));

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

  const effectiveIncludeInAgencyImpact =
    monthEntry?.includeInAgencyImpact ?? client?.includeInAgencyImpact ?? true;

  const monthRevenue = revenueMd
    ? monthEntry?.values[revenueMd.id]
    : undefined;
  const monthExpenses = expensesMd
    ? monthEntry?.values[expensesMd.id]
    : undefined;

  const [metricForChart, setMetricForChart] = React.useState(
    metricDefs[0]?.id ?? "",
  );
  React.useEffect(() => {
    setMetricForChart((prev) => prev || metricDefs[0]?.id || "");
  }, [metricDefs]);

  const chartMetric = metricDefs.find((m) => m.id === metricForChart);

  const fullChartData = months.map((m) => ({
    month: m.month,
    value: m.values[metricForChart] ?? 0,
  }));
  const chartData =
    fullChartData.length > 12
      ? fullChartData.slice(fullChartData.length - 12)
      : fullChartData;

  const last = chartData[chartData.length - 1]?.value;
  const prev = chartData[chartData.length - 2]?.value;
  const diff =
    last === undefined || prev === undefined
      ? undefined
      : Math.round((last - prev) * 100) / 100;

  const [openMetric, setOpenMetric] = React.useState(false);
  const [openBulk, setOpenBulk] = React.useState(false);
  const [openBulkEdit, setOpenBulkEdit] = React.useState(false);

  const thisYear = new Date().getFullYear();
  const [bulkYear, setBulkYear] = React.useState<string>(String(thisYear));
  const [bulkMetricId, setBulkMetricId] = React.useState<string>("");
  const [bulkRows, setBulkRows] = React.useState<Record<string, string>>({});

  const [newMetricName, setNewMetricName] = React.useState("");
  const [newMetricKind, setNewMetricKind] =
    React.useState<MetricDefinition["kind"]>("number");
  const [newMetricUnit, setNewMetricUnit] = React.useState("");

  React.useEffect(() => {
    if (!bulkMetricId && metricDefs[0]) {
      setBulkMetricId(metricDefs[0].id);
    }
  }, [metricDefs, bulkMetricId]);

  if (!client) {
    return (
      <div className="rounded-3xl border border-border/70 bg-white/70 p-8">
        <div className="text-lg font-semibold">Choose a client to view ROI</div>
      </div>
    );
  }

  const setMetricValue = (mdId: string, nextRaw: string) => {
    const v = nextRaw ? Number(nextRaw) : undefined;
    const values = { ...(monthEntry?.values ?? {}) };
    if (v === undefined || Number.isNaN(v)) delete values[mdId];
    else values[mdId] = v;

    upsertMonthlyMetric({
      clientId,
      month: activeMonth,
      values,
      notes: monthEntry?.notes,
      includeInAgencyImpact: monthEntry?.includeInAgencyImpact,
      id: monthEntry?.id,
    });
  };

  function openBulkEditDialog() {
    if (!bulkMetricId && !metricDefs.length) {
      toast({ title: "Add a KPI first." });
      return;
    }

    const targetMetricId = bulkMetricId || metricDefs[0]?.id;
    if (!targetMetricId) return;

    const year = Number(bulkYear) || thisYear;
    const rows: Record<string, string> = {};

    for (const { num } of MONTH_META) {
      const monthKey = `${year}-${pad2(num)}`;
      const existing = data.monthlyMetrics.find(
        (mm) => mm.clientId === clientId && mm.month === monthKey,
      );
      const val = existing?.values[targetMetricId];
      rows[monthKey] =
        typeof val === "number" && Number.isFinite(val) ? String(val) : "";
    }

    setBulkYear(String(year));
    setBulkMetricId(targetMetricId);
    setBulkRows(rows);
    setOpenBulkEdit(true);
  }

  function saveBulkEdit() {
    if (!bulkMetricId) {
      toast({ title: "Choose a KPI to edit." });
      return;
    }

    const yearNum = Number(bulkYear);
    if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
      toast({ title: "Enter a valid year (2000–2100)." });
      return;
    }

    let changed = 0;

    for (const { num } of MONTH_META) {
      const monthKey = `${yearNum}-${pad2(num)}`;
      const raw = bulkRows[monthKey] ?? "";
      const val = parseNumberOrUndefined(raw);
      if (val === undefined && !raw.trim()) {
        continue;
      }

      const existing = data.monthlyMetrics.find(
        (mm) => mm.clientId === clientId && mm.month === monthKey,
      );

      const baseValues = { ...(existing?.values ?? {}) };
      if (val === undefined) {
        delete baseValues[bulkMetricId];
      } else {
        baseValues[bulkMetricId] = val;
      }

      upsertMonthlyMetric({
        clientId,
        month: monthKey,
        values: baseValues,
        notes: existing?.notes,
        includeInAgencyImpact: existing?.includeInAgencyImpact,
        id: existing?.id,
      });
      changed++;
    }

    setOpenBulkEdit(false);
    toast({
      title: "KPI updated.",
      description: changed
        ? `Saved values for ${changed} month${changed === 1 ? "" : "s"}.`
        : "No changes were applied.",
    });
  }

  function saveNewMetric() {
    const name = newMetricName.trim();
    if (!name) {
      toast({ title: "Metric name is required." });
      return;
    }

    const existing = metricDefs.find(
      (m) => normalizeName(m.name) === normalizeName(name),
    );

    if (existing) {
      updateMetricDefinition(existing.id, {
        name,
        kind: newMetricKind,
        unit: newMetricUnit.trim() || undefined,
      });
      toast({ title: "KPI updated." });
    } else {
      createMetricDefinition({
        clientId,
        name,
        kind: newMetricKind,
        unit: newMetricUnit.trim() || undefined,
        isStandard: false,
      });
      toast({ title: "KPI created." });
    }

    setNewMetricName("");
    setNewMetricUnit("");
    setNewMetricKind("number");
    setOpenMetric(false);
  }

  const currentNotes = monthEntry?.notes ?? "";

  return (
    <div className="space-y-6">
      {/* Header and controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Month-to-month ROI tracking
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            ROI Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="h-11 w-[260px] rounded-2xl bg-white/70">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {data.clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setOpenBulk(true)}
            className="h-11 rounded-2xl border-[color:var(--im-secondary)]/40 bg-[color:var(--im-secondary)]/8 px-3 text-sm font-medium text-[color:var(--im-secondary)] shadow-sm transition-colors hover:border-[color:var(--im-secondary)] hover:bg-[color:var(--im-secondary)]/14"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Bulk add months
          </Button>

          <Button
            variant="outline"
            onClick={openBulkEditDialog}
            className="h-11 rounded-2xl border-primary/40 bg-primary/5 px-3 text-sm font-medium text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary/10"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Bulk edit KPI
          </Button>

          <Button
            onClick={() => setOpenMetric(true)}
            className="h-11 rounded-2xl"
          >
            <Plus className="mr-2 h-4 w-4" /> Add KPI
          </Button>
        </div>
      </div>

      {/* Overall ROI summary row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm md:col-span-2">
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
                {overallRoi.months} month
                {overallRoi.months === 1 ? "" : "s"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Only months with both Revenue and Service Expenses > 0 are
                included.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Client snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Client</span>
              <span className="font-medium text-foreground">{client.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-medium text-foreground">
                {client.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Monthly retainer</span>
              <span className="font-medium text-foreground">
                {formatCurrency(client.monthlyRetainer)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + this month editor */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">KPI trend</CardTitle>
              <div className="text-sm text-muted-foreground">
                Last 12 months for a single KPI.
              </div>
            </div>
            <Select
              value={metricForChart}
              onValueChange={(v) => setMetricForChart(v)}
            >
              <SelectTrigger className="h-9 w-[220px] rounded-2xl bg-white">
                <SelectValue placeholder="Choose KPI" />
              </SelectTrigger>
              <SelectContent>
                {metricDefs.map((md) => (
                  <SelectItem key={md.id} value={md.id}>
                    {metricLabel(md)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64">
              {chartMetric && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#185391"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Add data to see a trend.
                </div>
              )}
            </div>
            {chartMetric && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>
                  Latest:{" "}
                  <span className="font-medium text-foreground">
                    {formatNumber(last ?? 0)}
                  </span>
                  {diff !== undefined && (
                    <>
                      {" "}
                      · Change vs prev:{" "}
                      <span
                        className={
                          diff > 0
                            ? "font-medium text-emerald-600"
                            : diff < 0
                            ? "font-medium text-rose-600"
                            : "font-medium text-muted-foreground"
                        }
                      >
                        {diff > 0 ? "+" : ""}
                        {formatNumber(diff)}
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              This month: {activeMonth}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={activeMonth}
              onValueChange={(v) => setActiveMonth(v)}
            >
              <SelectTrigger className="h-9 rounded-2xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.month} value={m.month}>
                    {m.month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ImpactToggle
              checked={effectiveIncludeInAgencyImpact}
              onCheckedChange={(next) =>
                upsertMonthlyMetric({
                  clientId,
                  month: activeMonth,
                  values: monthEntry?.values ?? {},
                  notes: monthEntry?.notes,
                  includeInAgencyImpact: next,
                  id: monthEntry?.id,
                })
              }
            />

            <div className="space-y-3">
              {metricDefs.map((md) => (
                <div key={md.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {metricLabel(md)}
                    </span>
                    {standardIds.has(md.id) && (
                      <Badge className="flex items-center gap-1 rounded-full bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        <Lock className="h-3 w-3" />
                        Standard
                      </Badge>
                    )}
                  </div>
                  <Input
                    className="h-9 rounded-2xl bg-white/80"
                    value={
                      monthEntry?.values[md.id] !== undefined
                        ? String(monthEntry?.values[md.id])
                        : ""
                    }
                    onChange={(e) =>
                      setMetricValue(md.id, e.target.value || "")
                    }
                    placeholder="Enter value"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Notes (optional)
              </Label>
              <Textarea
                className="min-h-[70px] rounded-2xl bg-white/80"
                value={currentNotes}
                onChange={(e) =>
                  upsertMonthlyMetric({
                    clientId,
                    month: activeMonth,
                    values: monthEntry?.values ?? {},
                    includeInAgencyImpact:
                      monthEntry?.includeInAgencyImpact ?? true,
                    notes: e.target.value,
                    id: monthEntry?.id,
                  })
                }
              />
            </div>

            {monthEntry && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center rounded-2xl text-xs text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Delete data for ${activeMonth} for this client?`,
                    )
                  )
                    return;
                  deleteMonthlyMetric(monthEntry.id);
                }}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete this month
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <RoiSummary revenue={monthRevenue} expenses={monthExpenses} />

      {/* Bulk add months dialog */}
      <BulkMonthAddDialog
        open={openBulk}
        onOpenChange={setOpenBulk}
        client={client}
        existingMonths={months.map((m) => m.month)}
      />

      {/* Bulk edit KPI dialog */}
      <Dialog open={openBulkEdit} onOpenChange={setOpenBulkEdit}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Bulk edit KPI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  className="h-10 rounded-2xl"
                  value={bulkYear}
                  onChange={(e) => setBulkYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label>KPI</Label>
                <Select
                  value={bulkMetricId || (metricDefs[0]?.id ?? "")}
                  onValueChange={(v) => setBulkMetricId(v)}
                >
                  <SelectTrigger className="h-10 rounded-2xl bg-white">
                    <SelectValue placeholder="Select KPI" />
                  </SelectTrigger>
                  <SelectContent>
                    {metricDefs.map((md) => (
                      <SelectItem key={md.id} value={md.id}>
                        {metricLabel(md)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {MONTH_META.map(({ label, num }) => {
                const key = `${bulkYear || thisYear}-${pad2(num)}`;
                return (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <Input
                      className="h-9 rounded-2xl bg-white/80"
                      value={bulkRows[key] ?? ""}
                      onChange={(e) =>
                        setBulkRows((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder="Value"
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => setOpenBulkEdit(false)}
            >
              Cancel
            </Button>
            <Button className="rounded-2xl" onClick={saveBulkEdit}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / edit KPI dialog */}
      <Dialog open={openMetric} onOpenChange={setOpenMetric}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Add KPI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                className="h-10 rounded-2xl"
                value={newMetricName}
                onChange={(e) => setNewMetricName(e.target.value)}
                placeholder="e.g. Leads, Conversions"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newMetricKind}
                onValueChange={(v) =>
                  setNewMetricKind(v as MetricDefinition["kind"])
                }
              >
                <SelectTrigger className="h-10 rounded-2xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit (optional)</Label>
              <Input
                className="h-10 rounded-2xl"
                value={newMetricUnit}
                onChange={(e) => setNewMetricUnit(e.target.value)}
                placeholder="e.g. leads, calls, signups"
              />
            </div>

            {customMetricDefs.length > 0 && (
              <div className="mt-4 rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Existing KPIs
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {customMetricDefs.map((md) => (
                    <SoftButton
                      key={md.id}
                      className="h-7 rounded-full bg-white px-3 text-xs"
                      onClick={() => {
                        setNewMetricName(md.name);
                        setNewMetricKind(md.kind);
                        setNewMetricUnit(md.unit ?? "");
                      }}
                    >
                      {md.name}
                    </SoftButton>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {customMetricDefs.length > 0 && newMetricName.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl text-xs text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    const existing = metricDefs.find(
                      (m) =>
                        normalizeName(m.name) ===
                        normalizeName(newMetricName.trim()),
                    );
                    if (!existing) {
                      toast({
                        title: "KPI not found.",
                        description:
                          "Type the exact name of an existing custom KPI to delete it.",
                      });
                      return;
                    }
                    if (
                      !window.confirm(
                        `Delete KPI "${existing.name}" and all its values for this client?`,
                      )
                    ) {
                      return;
                    }
                    deleteMetricDefinition(existing.id);
                    toast({ title: "KPI deleted." });
                    setNewMetricName("");
                    setNewMetricUnit("");
                    setNewMetricKind("number");
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete KPI
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="rounded-2xl"
                onClick={() => setOpenMetric(false)}
              >
                Cancel
              </Button>
              <Button className="rounded-2xl" onClick={saveNewMetric}>
                Save KPI
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}