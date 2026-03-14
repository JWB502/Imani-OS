import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-9 w-9 rounded-2xl bg-[linear-gradient(135deg,var(--im-gradient-from),var(--im-gradient-to))] shadow-sm ring-1 ring-white/10" />
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Imani OS</div>
        <div className="text-xs text-sidebar-foreground/70">Operations Workspace</div>
      </div>
    </div>
  );
}
