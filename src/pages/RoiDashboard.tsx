in JSX, keep overall ROI, trailing-12 chart, bulk add/edit fully working.">
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

  // Overall ROI across all months for this client
  const overallRoi = React.useMemo(() => {
    if (!revenueMd || !expensesMd) return { roi: undefined, months: 0 };
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
    months[months.length - 1]?.month ??
    new Date().toISOString().slice(0, 7);
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

  // Trailing-twelve-months data for chart
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

  // Bulk edit state
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
      rows[monthKey] = typeof val === "number" && Number.isFinite(val) ? String(val) : "";
    }

    setBulkYear(String(year));
    setBulkMetricId(targetMetricId);
    setBulkRows(rows);
    setOpenBulkEdit(true);
  }

  async function saveBulkEdit() {
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
      the const val = parseNumberOrUndefined(raw);
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
              Average monthly ROI across all months with Revenue & Service Expenses.
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
                Only months with both Revenue and Service Expenses > 0 are included.
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
              <span className="font-medium text-foreground">{client.status}</span>
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

      {/* Trend + This month sections */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Trend / chart */}
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Trend (trailing 12 months)</CardTitle>
              <div className="text-sm text-muted-foreground">
                {chartMetric ? metricLabel(chartMetric) : "Select a KPI"}
              </div>
            </div>
            <Select value={metricForChart} onValueChange={setMetricForChart}>
              <SelectTrigger className="h-10 w-[260px] rounded-2xl bg-white/70">
                <SelectValue placeholder="Choose KPI" />
              </SelectTrigger>
              <SelectContent>
                {metricDefs.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {metricLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
                <div className="text-xs text-muted-foreground">Current</div>
                <div className="mt-1 text-2xl font-semibold">
                  {chartMetric?.kind === "currency"
                    ? formatCurrency(last)
                    : formatNumber(last)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
                <div className="text-xs text-muted-foreground">MoM change</div>
                <div className="mt-1 text-2xl font-semibold">
                  {diff === undefined
                    ? "—"
                    : chartMetric?.kind === "currency"
                    ? formatCurrency(diff)
                    : formatNumber(diff)}
                </div>
              </div>
              <div className="rounded-2xl bg-[color:var(--im-navy)] p-4 text-white ring-1 ring-white/10">
                <div className="text-xs text-white/80">Entries</div>
                <div className="mt-1 text-2xl font-semibold">{months.length}</div>
              </div>
            </div>

            <div className="mt-4 h-64 rounded-3xl bg-white p-3 ring-1 ring-border/60">
              {metricDefs.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Add your first KPI definition to start tracking.
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No data yet for this KPI.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, left: 8, right: 18, bottom: 0 }}
                  >
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#26bbc0"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* This month editor */}
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">This month</CardTitle>
            <div className="text-sm text-muted-foreground">{client.name}</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={activeMonth} onValueChange={setActiveMonth}>
              <SelectTrigger className="h-11 rounded-2xl bg-white/70">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {[...new Set([latestMonth, ...months.map((m) => m.month)])]
                  .sort()
                  .reverse()
                  .map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-border/60">
                <div className="text-sm font-semibold text-[color:var(--im-navy)]">
                  Standard KPIs
                </div>
                <div className="mt-3 space-y-2">
                  {standardMetricDefs.map((md) => {
                    const raw = monthEntry?.values[md.id];
                    return (
                      <div key={md.id} className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Lock className="h-4 w-4 text-muted-foreground" />{" "}
                            {md.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Currency
                          </div>
                        </div>
                        <Input
                          className="col-span-5 h-11 rounded-2xl bg-white/70"
                          inputMode="decimal"
                          value={raw ?? ""}
                          onChange={(e) =>
                            setMetricValue(md.id, e.target.value)
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 grid gap-2">
                  <RoiSummary
                    revenue={monthRevenue}
                    expenses={monthExpenses}
                  />
                  <ImpactToggle
                    checked={effectiveIncludeInAgencyImpact}
                    onCheckedChange={(checked) => {
                      upsertMonthlyMetric({
                        clientId,
                        month: activeMonth,
                        values: monthEntry?.values ?? {},
                        notes: monthEntry?.notes,
                        includeInAgencyImpact: checked,
                        id: monthEntry?.id,
                      });
                      toast({ title: "Agency Impact updated." });
                    }}
                  />
                </div>
              </div>

              {customMetricDefs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-white/70 p-6 text-center text-sm text-muted-foreground">
                  Add custom KPIs (leads, calls, reviews, donations, etc.).
                </div>
              ) : (
                <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-border/60">
                  <div className="text-sm font-semibold text-[color:var(--im-navy)]">
                    Custom KPIs
                  </div>
                  <div className="mt-3 space-y-2">
                    {customMetricDefs.map((md) => {
                      const raw = monthEntry?.values[md.id];
                      return (
                        <div key={md.id} className="grid grid-cols-12 gap-2">
                          <div className="col-span-7">
                            <div className="text-sm font-medium">
                              {md.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {md.kind}
                            </div>
                          </div>
                          <Input
                            className="col-span-5 h-11 rounded-2xl bg-white/70"
                            inputMode="decimal"
                            value={raw ?? ""}
                            onChange={(e) =>
                              setMetricValue(md.id, e.target.value)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Label>Notes</Label>
                <Textarea
                  value={monthEntry?.notes ?? ""}
                  onChange={(e) => {
                    upsertMonthlyMetric({
                      clientId,
                      month: activeMonth,
                      values: monthEntry?.values ?? {},
                      notes: e.target.value,
                      includeInAgencyImpact: monthEntry?.includeInAgencyImpact,
                      id: monthEntry?.id,
                    });
                  }}
                  className="mt-2 min-h-24 rounded-2xl bg-white/70"
                  placeholder="Explain wins, anomalies, context…"
                />
              </div>

              {monthEntry ? (
                <Button
                  variant="destructive"
                  className="w-full rounded-2xl"
                  onClick={() => {
                    if (!confirm(`Delete ROI entry for ${activeMonth}?`)) return;
                    deleteMonthlyMetric(monthEntry.id);
                    toast({ title: "Monthly entry deleted." });
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete month
                </Button>
              ) : (
                <Badge className="w-full justify-center rounded-2xl bg-primary/10 text-primary">
                  Autosaved on first value
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI definitions */}
      <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">KPI definitions</CardTitle>
            <div className="text-sm text-muted-foreground">
              Standard + custom per client
            </div>
          </div>
          <Button
            onClick={() => setOpenMetric(true)}
            className="rounded-2xl"
          >
            <TrendingUp className="mr-2 h-4 w-4" /> Add KPI
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {metricDefs.map((md) => (
            <div
              key={md.id}
              className="flex flex-col gap-2 rounded-2xl bg-white/70 p-3 ring-1 ring-border/60 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-2 font-medium">
                  {md.locked ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : null}
                  {md.name}
                  {md.locked ? (
                    <Badge className="ml-2 rounded-full bg-primary/10 text-primary">
                      Standard
                    </Badge>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {md.kind}
                  {md.unit ? ` • ${md.unit}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <SoftButton
                  disabled={md.locked}
                  className="rounded-2xl bg-white disabled:opacity-50"
                  onClick={() => {
                    const nextKind =
                      md.kind === "number"
                        ? "currency"
                        : md.kind === "currency"
                        ? "percent"
                        : "number";
                    updateMetricDefinition(md.id, { kind: nextKind });
                    toast({ title: "Metric updated." });
                  }}
                >
                  Cycle kind
                </SoftButton>
                <Button
                  variant="destructive"
                  disabled={md.locked}
                  className="rounded-2xl disabled:opacity-50"
                  onClick={() => {
                    if (!confirm(`Delete KPI "${md.name}"?`)) return;
                    deleteMetricDefinition(md.id);
                    toast({ title: "KPI deleted." });
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}

          {metricDefs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-white/70 p-10 text-center">
              <div className="text-sm font-medium">No KPIs yet</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Add custom KPI definitions per client (leads, revenue, reviews,
                donations, etc.).
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Add KPI dialog */}
      <Dialog open={openMetric} onOpenChange={setOpenMetric}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Add KPI</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={newMetricName}
                onChange={(e) => setNewMetricName(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="Leads, Reviews, Calls…"
              />
            </div>
            <div className="grid gap-2">
              <Label>Kind</Label>
              <Select
                value={newMetricKind}
                onValueChange={(v) => setNewMetricKind(v as any)}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Unit (optional)</Label>
              <Input
                value={newMetricUnit}
                onChange={(e) => setNewMetricUnit(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="calls, donors, %, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => setOpenMetric(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-2xl"
              onClick={() => {
                if (!newMetricName.trim()) {
                  toast({ title: "Metric name is required." });
                  return;
                }
                createMetricDefinition({
                  clientId,
                  name: newMetricName.trim(),
                  kind: newMetricKind,
                  unit: newMetricUnit.trim() || undefined,
                });
                toast({ title: "KPI added." });
                setNewMetricName("");
                setNewMetricUnit("");
                setOpenMetric(false);
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk edit dialog */}
      <Dialog open={openBulkEdit} onOpenChange={setOpenBulkEdit}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Bulk edit KPI</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Year</Label>
              <Input
                value={bulkYear}
                onChange={(e) => setBulkYear(e.target.value)}
                inputMode="numeric"
                className="h-11 rounded-2xl"
                placeholder="YYYY"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>KPI</Label>
              <Select
                value={bulkMetricId}
                onValueChange={(v) => setBulkMetricId(v)}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select KPI" />
                </SelectTrigger>
                <SelectContent>
                  {metricDefs.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {metricLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 max-h-80 space-y-2 overflow-auto rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {bulkYear || thisYear} values
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
              <span>Month</span>
              <span className="col-span-2">Value</span>
            </div>
            {MONTH_META.map(({ label, num }) => {
              const monthKey = `${Number(bulkYear) || thisYear}-${pad2(num)}`;
              return (
                <div
                  key={monthKey}
                  className="grid grid-cols-3 items-center gap-2"
                >
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Input
                    className="col-span-2 h-9 rounded-2xl bg-white"
                    inputMode="decimal"
                    value={bulkRows[monthKey] ?? ""}
                    onChange={(e) =>
                      setBulkRows((prev) => ({
                        ...prev,
                        [monthKey]: e.target.value,
                      }))
                    }
                    placeholder="Number"
                  />
                </div>
              );
            })}
            <div className="mt-2 text-xs text-muted-foreground">
              Leave a field blank to skip changes for that month.
            </div>
          </div>

          <DialogFooter className="mt-4">
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

      {/* Bulk add dialog */}
      <BulkMonthAddDialog
        open={openBulk}
        onOpenChange={setOpenBulk}
        client={client}
        existingMonths={months.map((m) => m.month)}
      />
    </div>
  );
}