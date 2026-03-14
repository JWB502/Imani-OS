import { Switch } from "@/components/ui/switch";

export function ImpactToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
      <div className="min-w-0">
        <div className="text-sm font-medium">Include this month in Agency Impact</div>
        <div className="text-xs text-muted-foreground">
          Used for Agency ROI averages (filtered by project dates).
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-[color:var(--im-secondary)]"
      />
    </div>
  );
}
