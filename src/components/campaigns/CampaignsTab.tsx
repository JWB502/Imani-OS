import * as React from "react";
import { Megaphone, Plus } from "lucide-react";

import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignDialog } from "@/components/campaigns/CampaignDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types/imani";

function calcRoi(adSpendTotal: number, incomeTotal: number) {
  if (!adSpendTotal || adSpendTotal <= 0) return undefined;
  return ((incomeTotal - adSpendTotal) / adSpendTotal) * 100;
}

function sortCampaigns(a: Campaign, b: Campaign) {
  if (a.startDate && b.startDate && a.startDate !== b.startDate) {
    return b.startDate.localeCompare(a.startDate);
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

type Props = { clientId: string };

export function CampaignsTab({ clientId }: Props) {
  const { data } = useData();

  const campaigns = React.useMemo(
    () => (data.campaigns ?? []).filter((c) => c.clientId === clientId).slice().sort(sortCampaigns),
    [data.campaigns, clientId],
  );

  const totals = React.useMemo(() => {
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.adSpend ?? 0), 0);
    const totalIncome = campaigns.reduce((sum, c) => sum + (c.income ?? 0), 0);
    return {
      totalSpend,
      totalIncome,
      roi: calcRoi(totalSpend, totalIncome),
    };
  }, [campaigns]);

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Campaign | undefined>(undefined);

  const openCreate = () => {
    setActive(undefined);
    setOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setActive(c);
    setOpen(true);
  };

  const roiClass =
    totals.roi === undefined
      ? "bg-white/70 text-foreground"
      : totals.roi >= 25
        ? "bg-emerald-100 text-emerald-900"
        : totals.roi >= 0
          ? "bg-sky-100 text-sky-900"
          : "bg-rose-100 text-rose-900";

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border/70 bg-white/70 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Campaigns</div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Single-channel campaigns with ad-hoc outcomes and ROI.
            </div>
          </div>

          <Button className="rounded-2xl" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Campaign
          </Button>
        </div>

        <Separator className="my-5" />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-[color:var(--im-navy)]/95 p-4 text-white ring-1 ring-white/10">
            <div className="text-xs text-white/70">Total Spend</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {formatCurrency(totals.totalSpend)}
            </div>
          </div>
          <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-border/60">
            <div className="text-xs text-muted-foreground">Total Income</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {formatCurrency(totals.totalIncome)}
            </div>
          </div>
          <div className={cn("rounded-3xl p-4 ring-1 ring-border/60", roiClass)}>
            <div className="text-xs opacity-80">ROI</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {totals.roi === undefined ? "—" : formatPercent(totals.roi)}
            </div>
          </div>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/70 p-10 text-center">
          <div className="text-sm font-medium">No campaigns yet</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Add your first campaign to track spend, income, and outcomes.
          </div>
          <Button className="mt-4 rounded-2xl" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} onClick={() => openEdit(c)} />
          ))}
        </div>
      )}

      <CampaignDialog
        open={open}
        onOpenChange={setOpen}
        clientId={clientId}
        campaign={active}
      />
    </div>
  );
}
