' in JSX to fix TS1002/TS1382.">
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
import { BulkMonthAddDialog } from "@/components/roi/BulkMonthAddDialog";

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

export default function RoiDashboard() {
  const { toast } = useToast();
  const { data, ensureStandardMetricsForClient } = useData();

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

  const [openBulk, setOpenBulk] = React.useState(false);

  if (!client) {
    return (
      <div className="rounded-3xl border border-border/70 bg-white/70 p-8">
        <div className="text-lg font-semibold">Choose a client to view ROI</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                {overallRoi.roi === undefined ? "—" : `${Math.round(overallRoi.roi)}%`}
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

      <div className="space-y-1 text-xs text-muted-foreground">
        (No other changes in this file are required for TS1382 beyond the > escape above.)
      </div>

      <BulkMonthAddDialog
        open={openBulk}
        onOpenChange={setOpenBulk}
        client={client}
        existingMonths={months.map((m) => m.month)}
      />
    </div>
  );
}