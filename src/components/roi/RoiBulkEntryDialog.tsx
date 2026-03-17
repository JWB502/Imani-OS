import * as React from "react";
import {
  Calendar,
  ChevronRight,
  ListTodo,
  Table as TableIcon,
  X,
  Plus,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import { Client, MetricDefinition, MonthlyMetric } from "@/types/imani";

interface RoiBulkEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  metricDefs: MetricDefinition[];
}

type Step = "year" | "metrics" | "data";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function RoiBulkEntryDialog({
  open,
  onOpenChange,
  client,
  metricDefs,
}: RoiBulkEntryDialogProps) {
  const { bulkUpsertMonthlyMetrics, data } = useData();
  const [step, setStep] = React.useState<Step>("year");
  const [selectedYear, setSelectedYear] = React.useState(
    new Date().getFullYear().toString(),
  );
  const [selectedMetricIds, setSelectedMetricIds] = React.useState<string[]>(
    metricDefs.map((m) => m.id),
  );
  const [bulkValues, setBulkValues] = React.useState<
    Record<string, Record<string, string>>
  >({});

  // Reset values when year/metrics change
  React.useEffect(() => {
    if (step === "data" && open) {
      const initial: Record<string, Record<string, string>> = {};
      for (let i = 1; i <= 12; i++) {
        const month = `${selectedYear}-${String(i).padStart(2, "0")}`;
        const existing = data.monthlyMetrics.find(
          (m) => m.clientId === client.id && m.month === month,
        );
        initial[month] = {};
        for (const metricId of selectedMetricIds) {
          initial[month][metricId] =
            existing?.values[metricId]?.toString() || "";
        }
      }
      setBulkValues(initial);
    }
  }, [step, selectedYear, selectedMetricIds, client.id, data.monthlyMetrics, open]);

  const handleSave = () => {
    const now = new Date().toISOString();
    const metricsToUpsert: Omit<MonthlyMetric, 'id'>[] = [];

    for (const [month, values] of Object.entries(bulkValues)) {
      const numericValues: Record<string, number> = {};
      let hasValue = false;
      for (const [mid, val] of Object.entries(values)) {
        if (val.trim() === "") continue;
        const n = parseFloat(val);
        if (!isNaN(n)) {
          numericValues[mid] = n;
          hasValue = true;
        }
      }

      if (hasValue) {
        metricsToUpsert.push({
          clientId: client.id,
          month,
          values: numericValues,
          createdAt: now,
          updatedAt: now
        });
      }
    }

    if (metricsToUpsert.length > 0) {
      bulkUpsertMonthlyMetrics(metricsToUpsert);
    }
    
    onOpenChange(false);
    setStep("year");
  };

  const years = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => (current - 5 + i).toString());
  }, []);

  const toggleMetric = (id: string) => {
    setSelectedMetricIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-primary" />
            Bulk KPI Entry - {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "year" && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Select Target Year</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the calendar year you want to enter data for.
                </p>
              </div>

              <div className="flex justify-center max-w-xs mx-auto">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === "metrics" && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <ListTodo className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Select KPIs to Update</h3>
                <p className="text-sm text-muted-foreground">
                  Pick the metrics you want to include in the bulk entry table.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {metricDefs.map((md) => (
                  <div
                    key={md.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedMetricIds.includes(md.id)
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "bg-white/50 border-border/70 hover:border-primary/50"
                    }`}
                    onClick={() => toggleMetric(md.id)}
                  >
                    <Checkbox
                      checked={selectedMetricIds.includes(md.id)}
                      onCheckedChange={() => toggleMetric(md.id)}
                      className="h-5 w-5 rounded-md"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-none truncate">
                        {md.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-1">
                        {md.kind}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "data" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedYear} Data Entry</h3>
                  <p className="text-xs text-muted-foreground">
                    Entering values for {selectedMetricIds.length} KPIs
                  </p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Auto-saving to temporary state
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border/70">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-4 py-3 text-left font-semibold border-b border-border/50 sticky left-0 bg-muted/30 z-10 w-32">
                        Month
                      </th>
                      {selectedMetricIds.map((mid) => {
                        const md = metricDefs.find((m) => m.id === mid);
                        return (
                          <th
                            key={mid}
                            className="px-4 py-3 text-left font-semibold border-b border-border/50 min-w-[140px]"
                          >
                            <div className="flex flex-col">
                              <span className="truncate">{md?.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-normal">
                                {md?.kind === "currency" ? "$" : md?.kind === "percent" ? "%" : "#"}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {MONTH_NAMES.map((name, i) => {
                      const monthKey = `${selectedYear}-${String(i + 1).padStart(
                        2,
                        "0",
                      )}`;
                      return (
                        <tr key={monthKey} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-medium border-r border-border/50 sticky left-0 bg-white/70 z-10">
                            {name}
                          </td>
                          {selectedMetricIds.map((mid) => (
                            <td key={mid} className="px-4 py-2">
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="h-9 rounded-xl border-border/50 focus:ring-primary/20"
                                value={bulkValues[monthKey]?.[mid] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBulkValues((prev) => ({
                                    ...prev,
                                    [monthKey]: {
                                      ...prev[monthKey],
                                      [mid]: val,
                                    },
                                  }));
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-white/50">
          <div className="flex items-center justify-between w-full">
            <div>
              {step !== "year" && (
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    if (step === "metrics") setStep("year");
                    if (step === "data") setStep("metrics");
                  }}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {step === "data" ? (
                <Button className="rounded-xl px-8" onClick={handleSave}>
                  Save All Changes
                </Button>
              ) : (
                <Button
                  className="rounded-xl"
                  onClick={() => {
                    if (step === "year") setStep("metrics");
                    else if (step === "metrics") setStep("data");
                  }}
                  disabled={step === "metrics" && selectedMetricIds.length === 0}
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}