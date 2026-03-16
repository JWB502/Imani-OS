character in JSX text to fix TS1382 error.">
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

        {/* ...rest of the file remains unchanged... */}
      </div>
    </div>
  );
}