import * as React from "react";
import { AlertTriangle, FileStack } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function DocumentToolbar({
  eyebrow,
  title,
  description,
  badges,
  actions,
  warnings,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  warnings?: string[];
}) {
  return (
    <div className="space-y-4 rounded-[32px] border border-border/70 bg-white/75 p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <FileStack className="h-4 w-4 text-primary" /> {eyebrow}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--im-navy)]">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
          {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {warnings && warnings.length > 0 ? (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" /> Migration notes
          </div>
          <div className="mt-2 space-y-2 text-sm">
            {warnings.map((warning, index) => (
              <div key={`${warning}-${index}`} className="rounded-2xl bg-white/80 px-3 py-2">
                {warning}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DocumentStatusBadge({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "warning" | "muted" }) {
  const className =
    tone === "success"
      ? "bg-emerald-100 text-emerald-900"
      : tone === "warning"
        ? "bg-amber-100 text-amber-900"
        : tone === "muted"
          ? "bg-slate-200 text-slate-900"
          : "bg-primary text-primary-foreground";

  return <Badge className={`rounded-full px-3 py-1 ${className}`}>{label}</Badge>;
}
