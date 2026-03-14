import * as React from "react";
import { CalendarDays, Coins, Target, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Campaign, ManagementType } from "@/types/imani";

type Props = {
  campaign: Campaign;
  onClick: () => void;
};

function calcRoi(adSpend?: number, income?: number) {
  const spend = adSpend ?? 0;
  const inc = income ?? 0;
  if (!spend || spend <= 0) return undefined;
  return ((inc - spend) / spend) * 100;
}

function managementBadge(mt: ManagementType) {
  if (mt === "DFY") return "bg-primary text-primary-foreground";
  if (mt === "DWY") return "bg-[color:var(--im-secondary)] text-white";
  return "bg-slate-200 text-slate-900";
}

export function CampaignCard({ campaign, onClick }: Props) {
  const roi = calcRoi(campaign.adSpend, campaign.income);

  const title =
    campaign.title?.trim() ||
    `${campaign.channel}${campaign.startDate ? ` • ${formatDate(campaign.startDate)}` : ""}`;

  const dateLabel = campaign.startDate
    ? `${formatDate(campaign.startDate)} • ${campaign.endDate ? formatDate(campaign.endDate) : "Ongoing"}`
    : campaign.endDate
      ? `Ends ${formatDate(campaign.endDate)}`
      : "No dates";

  const roiClass =
    roi === undefined
      ? ""
      : roi >= 25
        ? "bg-emerald-100 text-emerald-900"
        : roi >= 0
          ? "bg-sky-100 text-sky-900"
          : "bg-rose-100 text-rose-900";

  const topResults = (campaign.results || [])
    .filter((r) => r.name.trim() && Number.isFinite(r.value))
    .slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-3xl border border-border/70 bg-white/70 p-4 text-left shadow-sm ring-1 ring-transparent transition",
        "hover:bg-white hover:ring-border/70 focus:outline-none focus:ring-2 focus:ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold tracking-tight">{title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-white/70 text-foreground ring-1 ring-border/60">
              {campaign.channel}
            </Badge>
            <Badge className={cn("rounded-full", managementBadge(campaign.managementType))}>
              {campaign.managementType}
            </Badge>
            {roi !== undefined ? (
              <Badge className={cn("rounded-full", roiClass)}>
                <TrendingUp className="mr-1 h-3.5 w-3.5" /> {formatPercent(roi)}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--im-navy)]/95 px-3 py-2 text-xs text-white ring-1 ring-white/10">
            <CalendarDays className="h-4 w-4 text-white/80" />
            <span className="whitespace-nowrap">{dateLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-4 w-4 text-primary" /> Budget
          </div>
          <div className="mt-1 text-sm font-semibold">{formatCurrency(campaign.budget)}</div>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Coins className="h-4 w-4 text-[color:var(--im-secondary)]" /> Spend
          </div>
          <div className="mt-1 text-sm font-semibold">{formatCurrency(campaign.adSpend)}</div>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-700" /> Income
          </div>
          <div className="mt-1 text-sm font-semibold">{formatCurrency(campaign.income)}</div>
        </div>
      </div>

      {topResults.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {topResults.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/10"
            >
              {r.name}: {r.value}
              {r.unit ? ` ${r.unit}` : ""}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}