import * as React from "react";
import { Minus, Plus, Trash2, TrendingUp } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { formatDate, formatPercent } from "@/lib/format";
import { createId } from "@/lib/id";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignResult, ManagementType } from "@/types/imani";

const CHANNEL_OPTIONS = [
  "Facebook Ads",
  "Google Ads",
  "Direct Mail",
  "Instagram Ads",
  "LinkedIn Ads",
  "YouTube Ads",
  "Display Ads",
  "Other",
] as const;

function calcRoi(adSpend?: number, income?: number) {
  const spend = adSpend ?? 0;
  const inc = income ?? 0;
  if (!spend || spend <= 0) return undefined;
  return ((inc - spend) / spend) * 100;
}

function toNumberOrUndefined(raw: string) {
  const v = raw.trim();
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function toNonNegativeNumberOrUndefined(raw: string) {
  const n = toNumberOrUndefined(raw);
  if (n === undefined) return undefined;
  if (n < 0) return NaN;
  return n;
}

function defaultTitle(channel: string, startDate?: string) {
  if (!startDate) return channel;
  return `${channel} • ${formatDate(startDate)}`;
}

type ResultDraft = { id: string; name: string; value: string; unit: string };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string;
  campaign?: Campaign;
};

export function CampaignDialog({ open, onOpenChange, clientId, campaign }: Props) {
  const isEdit = !!campaign;
  const { createCampaign, updateCampaign, deleteCampaign } = useData();

  const initialChannelOption = React.useMemo(() => {
    const existing = campaign?.channel;
    if (!existing) return "Facebook Ads";
    return (CHANNEL_OPTIONS as readonly string[]).includes(existing) ? existing : "Other";
  }, [campaign?.channel]);

  const [title, setTitle] = React.useState("");
  const [channelOption, setChannelOption] = React.useState<string>(initialChannelOption);
  const [otherChannel, setOtherChannel] = React.useState("");
  const [managementType, setManagementType] = React.useState<ManagementType>("DFY");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [adSpend, setAdSpend] = React.useState("");
  const [income, setIncome] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [results, setResults] = React.useState<ResultDraft[]>([]);

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;

    setErrors({});
    setTitle(campaign?.title ?? "");

    const option = initialChannelOption;
    setChannelOption(option);
    setOtherChannel(option === "Other" ? (campaign?.channel ?? "") : "");

    setManagementType(campaign?.managementType ?? "DFY");
    setStartDate(campaign?.startDate ?? "");
    setEndDate(campaign?.endDate ?? "");
    setBudget(campaign?.budget === undefined ? "" : String(campaign.budget));
    setAdSpend(campaign?.adSpend === undefined ? "" : String(campaign.adSpend));
    setIncome(campaign?.income === undefined ? "" : String(campaign.income));
    setNotes(campaign?.notes ?? "");

    const base = (campaign?.results ?? []).map<ResultDraft>((r) => ({
      id: r.id,
      name: r.name,
      value: String(r.value ?? ""),
      unit: r.unit ?? "",
    }));
    setResults(base.length ? base : [{ id: createId("cmr"), name: "", value: "", unit: "" }]);
  }, [open, campaign, initialChannelOption]);

  const spendNum = toNumberOrUndefined(adSpend);
  const incomeNum = toNumberOrUndefined(income);
  const roi = calcRoi(spendNum, incomeNum);

  const roiChipClass =
    roi === undefined
      ? "bg-white/70 text-foreground"
      : roi >= 25
        ? "bg-emerald-100 text-emerald-900"
        : roi >= 0
          ? "bg-sky-100 text-sky-900"
          : "bg-rose-100 text-rose-900";

  const resolvedChannel = (channelOption === "Other" ? otherChannel : channelOption).trim();

  const validate = React.useCallback(() => {
    const nextErrors: Record<string, string> = {};

    if (!resolvedChannel) nextErrors.channel = "Channel is required.";

    const budgetN = toNonNegativeNumberOrUndefined(budget);
    const spendN = toNonNegativeNumberOrUndefined(adSpend);
    const incomeN = toNonNegativeNumberOrUndefined(income);

    if (Number.isNaN(budgetN)) nextErrors.budget = "Must be 0 or greater.";
    if (Number.isNaN(spendN)) nextErrors.adSpend = "Must be 0 or greater.";
    if (Number.isNaN(incomeN)) nextErrors.income = "Must be 0 or greater.";

    if (startDate && endDate && startDate > endDate) {
      nextErrors.dates = "Start date must be on or before end date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [resolvedChannel, budget, adSpend, income, startDate, endDate]);

  const onSave = () => {
    if (!validate()) return;

    const titleTrim = title.trim();
    const finalTitle = titleTrim ? titleTrim : defaultTitle(resolvedChannel, startDate || undefined);

    const budgetN = toNumberOrUndefined(budget);
    const spendN = toNumberOrUndefined(adSpend);
    const incomeN = toNumberOrUndefined(income);

    const cleanedResults: CampaignResult[] = results
      .map((r) => ({
        id: r.id,
        name: r.name.trim(),
        value: Number(r.value),
        unit: r.unit.trim() || undefined,
      }))
      .filter((r) => r.name && Number.isFinite(r.value));

    if (isEdit && campaign) {
      updateCampaign(campaign.id, {
        title: finalTitle,
        channel: resolvedChannel,
        managementType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: budgetN,
        adSpend: spendN,
        income: incomeN,
        notes: notes.trim() || undefined,
        results: cleanedResults,
      });
    } else {
      createCampaign({
        clientId,
        title: finalTitle,
        channel: resolvedChannel,
        managementType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: budgetN,
        adSpend: spendN,
        income: incomeN,
        notes: notes.trim() || undefined,
        results: cleanedResults,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl border-border/70 bg-white/80 p-0 shadow-xl backdrop-blur">
        <div className="p-6 sm:p-7 md:p-8 space-y-6">
          <DialogHeader className="gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DialogTitle className="text-xl tracking-tight">
                  {isEdit ? "Edit campaign" : "Add campaign"}
                </DialogTitle>
                <DialogDescription>
                  Track spend, income, and ad-hoc outcomes for a single channel.
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={cn("rounded-full px-3 py-1 text-xs ring-1 ring-border/50", roiChipClass)}>
                  ROI: {roi === undefined ? "—" : formatPercent(roi)}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <Separator className="my-5" />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cmp-title">Title</Label>
                  <Input
                    id="cmp-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Optional (defaults to channel + start date)"
                    className="rounded-2xl bg-white/80"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={channelOption} onValueChange={setChannelOption}>
                    <SelectTrigger className="rounded-2xl bg-white/80">
                      <SelectValue placeholder="Choose a channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.channel ? (
                    <div className="text-xs text-rose-700">{errors.channel}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Management type</Label>
                  <Select
                    value={managementType}
                    onValueChange={(v) => setManagementType(v as ManagementType)}
                  >
                    <SelectTrigger className="rounded-2xl bg-white/80">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIY">DIY</SelectItem>
                      <SelectItem value="DWY">DWY</SelectItem>
                      <SelectItem value="DFY">DFY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {channelOption === "Other" ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cmp-channel-other">Channel (other)</Label>
                    <Input
                      id="cmp-channel-other"
                      value={otherChannel}
                      onChange={(e) => setOtherChannel(e.target.value)}
                      placeholder="e.g., TikTok Ads"
                      className="rounded-2xl bg-white/80"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="cmp-start">Start date</Label>
                  <Input
                    id="cmp-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-2xl bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cmp-end">End date</Label>
                  <Input
                    id="cmp-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-2xl bg-white/80"
                  />
                </div>
                {errors.dates ? (
                  <div className="md:col-span-2 text-xs text-rose-700">{errors.dates}</div>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cmp-budget">Budget</Label>
                  <Input
                    id="cmp-budget"
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step="1"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0"
                    className="rounded-2xl bg-white/80"
                  />
                  {errors.budget ? (
                    <div className="text-xs text-rose-700">{errors.budget}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cmp-spend">Actual ad spend</Label>
                  <Input
                    id="cmp-spend"
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step="1"
                    value={adSpend}
                    onChange={(e) => setAdSpend(e.target.value)}
                    placeholder="0"
                    className="rounded-2xl bg-white/80"
                  />
                  {errors.adSpend ? (
                    <div className="text-xs text-rose-700">{errors.adSpend}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cmp-income">Income</Label>
                  <Input
                    id="cmp-income"
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step="1"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="0"
                    className="rounded-2xl bg-white/80"
                  />
                  {errors.income ? (
                    <div className="text-xs text-rose-700">{errors.income}</div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cmp-notes">Notes</Label>
                <Textarea
                  id="cmp-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Context, offer details, targeting notes, creative learnings…"
                  className="min-h-[110px] rounded-2xl bg-white/80"
                />
              </div>

              <div className="rounded-3xl border border-border/70 bg-white/70 p-4">
                <div className="text-sm font-semibold">Results</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Track outcomes for this campaign. Use Metric, Value, and Unit (optional). Examples: Leads, Calls, Sign-ups, Bookings.
                </div>

                <div className="mt-4 grid grid-cols-12 gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                  <div className="col-span-6">Metric</div>
                  <div className="col-span-3">Value</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-1 text-right">Remove</div>
                </div>

                <div className="mt-2 space-y-3">
                  {results.map((r, idx) => (
                    <div key={r.id} className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <Input
                          value={r.name}
                          onChange={(e) =>
                            setResults((prev) =>
                              prev.map((p) => (p.id === r.id ? { ...p, name: e.target.value } : p)),
                            )
                          }
                          placeholder={idx === 0 ? "Metric name (e.g., Leads)" : "Metric name"}
                          aria-label="Result metric name"
                          className="h-9 rounded-2xl bg-white/80"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={r.value}
                          inputMode="decimal"
                          type="number"
                          step="1"
                          onChange={(e) =>
                            setResults((prev) =>
                              prev.map((p) => (p.id === r.id ? { ...p, value: e.target.value } : p)),
                            )
                          }
                          placeholder="Number"
                          aria-label="Result value"
                          className="h-9 rounded-2xl bg-white/80"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={r.unit}
                          onChange={(e) =>
                            setResults((prev) =>
                              prev.map((p) => (p.id === r.id ? { ...p, unit: e.target.value } : p)),
                            )
                          }
                          placeholder="Unit (optional)"
                          aria-label="Result unit (optional)"
                          className="h-9 rounded-2xl bg-white/80"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-2xl"
                          onClick={() =>
                            setResults((prev) =>
                              prev.length <= 1 ? prev : prev.filter((p) => p.id !== r.id),
                            )
                          }
                          aria-label="Remove result"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl bg-white/80"
                    onClick={() =>
                      setResults((prev) => [
                        ...prev,
                        { id: createId("cmr"), name: "", value: "", unit: "" },
                      ])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add result
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 text-foreground ring-1 ring-primary/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--im-navy)]">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Live ROI
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Based on Income and Actual Ad Spend.
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div
                    className={cn(
                      "text-3xl font-semibold tracking-tight",
                      roi === undefined
                        ? "text-foreground/70"
                        : roi >= 25
                          ? "text-emerald-700"
                          : roi >= 0
                            ? "text-sky-700"
                            : "text-rose-700",
                    )}
                  >
                    {roi === undefined ? "—" : formatPercent(roi)}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    Spend must be greater than 0
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-2">
            {isEdit && campaign ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-2xl">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-border/70 bg-white/90 backdrop-blur">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        deleteCampaign(campaign.id);
                        onOpenChange(false);
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl bg-white"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" className="rounded-2xl" onClick={onSave}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}