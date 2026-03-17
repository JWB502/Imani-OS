import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/favicon.ico"
        alt="Imani OS"
        className="h-9 w-9 rounded-2xl shadow-sm ring-1 ring-white/10 shrink-0 object-contain"
      />
      <div className="leading-tight group-data-[collapsible=icon]:hidden animate-in fade-in duration-300">
        <div className="text-sm font-semibold tracking-tight">Imani OS</div>
        <div className="text-xs text-sidebar-foreground/70">Operations Workspace</div>
      </div>
    </div>
  );
}
