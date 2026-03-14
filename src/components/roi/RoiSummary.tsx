import { formatPercent } from "@/lib/format";

export function RoiSummary({
  revenue,
  expenses,
}: {
  revenue?: number;
  expenses?: number;
}) {
  const revenueOk = typeof revenue === "number" && Number.isFinite(revenue);
  const expensesOk = typeof expenses === "number" && Number.isFinite(expenses) && expenses > 0;

  const hasValid = revenueOk && expensesOk;
  const roi = hasValid ? ((revenue! - expenses!) / expenses!) * 100 : undefined;

  const tone =
    roi === undefined
      ? "text-[color:var(--im-navy)]"
      : roi < 0
        ? "text-rose-600"
        : "text-[color:var(--im-secondary)]";

  const helper = !expensesOk
    ? "Add expenses to compute ROI."
    : !revenueOk
      ? "Add revenue to compute ROI."
      : "Computed from Revenue and Service Expenses.";

  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
      <div className="text-xs font-medium text-muted-foreground">Client ROI</div>
      <div className={`mt-1 text-3xl font-semibold tracking-tight ${tone}`}>
        {hasValid ? formatPercent(roi, 0) : "—"}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}