import * as React from "react";

import type { Client } from "@/types/imani";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";

const MONTHS: Array<{ label: string; value: number }> = [
  { label: "Jan", value: 1 },
  { label: "Feb", value: 2 },
  { label: "Mar", value: 3 },
  { label: "Apr", value: 4 },
  { label: "May", value: 5 },
  { label: "Jun", value: 6 },
  { label: "Jul", value: 7 },
  { label: "Aug", value: 8 },
  { label: "Sep", value: 9 },
  { label: "Oct", value: 10 },
  { label: "Nov", value: 11 },
  { label: "Dec", value: 12 },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toPretty(month: string) {
  // YYYY-MM -> MM-YYYY
  const [y, m] = month.split("-");
  return `${m}-${y}`;
}

export function BulkMonthAddDialog({
  open,
  onOpenChange,
  client,
  existingMonths,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  existingMonths: string[];
}) {
  const { toast } = useToast();
  const { bulkUpsertMonthlyMetrics } = useData();

  const nowYear = new Date().getFullYear();
  const [year, setYear] = React.useState(String(nowYear));
  const [startMonth, setStartMonth] = React.useState(1);
  const [endMonth, setEndMonth] = React.useState(12);
  const [skipExisting, setSkipExisting] = React.useState(true);
  const [prefill, setPrefill] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setYear(String(nowYear));
    setStartMonth(1);
    setEndMonth(12);
    setSkipExisting(true);
    setPrefill(false);
  }, [open, nowYear]);

  const yearNum = Number(year);
  const yearOk = Number.isInteger(yearNum) && yearNum >= 2000 && yearNum <= 2100;

  const monthsRequested = React.useMemo(() => {
    if (!yearOk) return [] as string[];
    const s = Math.min(startMonth, endMonth);
    const e = Math.max(startMonth, endMonth);
    const out: string[] = [];
    for (let m = s; m <= e; m++) out.push(`${yearNum}-${pad2(m)}`);
    return out;
  }, [endMonth, startMonth, yearNum, yearOk]);

  const existing = React.useMemo(() => new Set(existingMonths), [existingMonths]);

  const preview = React.useMemo(() => {
    if (skipExisting) return monthsRequested.filter((m) => !existing.has(m));
    return monthsRequested;
  }, [existing, monthsRequested, skipExisting]);

  const canCreate = preview.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Bulk add months</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-[color:var(--im-navy)]/95 p-4 text-white ring-1 ring-white/10">
            <div className="text-xs text-white/70">Client</div>
            <div className="mt-1 font-semibold">{client.name}</div>
            <div className="mt-1 text-xs text-white/70">
              Creates blank monthly rows for fast historical KPI entry.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Year</Label>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                inputMode="numeric"
                className="h-11 rounded-2xl"
                placeholder="YYYY"
              />
              {!yearOk ? (
                <div className="text-xs text-muted-foreground">Enter a valid year (2000–2100).</div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Start</Label>
              <Select value={String(startMonth)} onValueChange={(v) => setStartMonth(Number(v))}>
                <SelectTrigger className="h-11 rounded-2xl bg-white/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>End</Label>
              <Select value={String(endMonth)} onValueChange={(v) => setEndMonth(Number(v))}>
                <SelectTrigger className="h-11 rounded-2xl bg-white/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3">
            <label className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
              <Checkbox
                checked={skipExisting}
                onCheckedChange={(v) => setSkipExisting(Boolean(v))}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">Skip existing months</div>
                <div className="text-xs text-muted-foreground">
                  Prevents overwriting entries you’ve already tracked.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
              <Checkbox
                checked={prefill}
                onCheckedChange={(v) => setPrefill(Boolean(v))}
                className="mt-0.5"
                disabled={typeof client.monthlyRetainer !== "number"}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">Prefill Service Expenses from client retainer</div>
                <div className="text-xs text-muted-foreground">
                  {typeof client.monthlyRetainer === "number"
                    ? `Uses ${client.monthlyRetainer} for Service Expenses when creating months.`
                    : "Add a monthly retainer on the client to enable prefill."}
                </div>
              </div>
            </label>
          </div>

          <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
            <div className="text-sm font-medium">Preview</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {preview.length} month{preview.length === 1 ? "" : "s"} will be created.
            </div>

            <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-auto">
              {preview.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {yearOk
                    ? "Nothing to create for this range."
                    : "Select a valid year to preview months."}
                </div>
              ) : (
                preview.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="rounded-full bg-primary/10 text-primary"
                  >
                    {toPretty(m)}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <Button
            variant="secondary"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-2xl"
            disabled={!canCreate}
            onClick={() => {
              const res = bulkUpsertMonthlyMetrics({
                clientId: client.id,
                months: monthsRequested,
                skipExisting,
                prefillServiceExpenses: prefill,
              });

              toast({
                title: "Months added.",
                description: `Created ${res.created}. You can now fill in historical KPIs.`,
              });
              onOpenChange(false);
            }}
          >
            Create months
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
