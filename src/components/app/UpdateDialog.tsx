import {
  AlertDialog,

  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function UpdateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
  notes?: string;
  installing?: boolean;
  onInstall: () => void;
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent
        className={cn(
          "rounded-3xl border-border/70 bg-white/85 shadow-[0_18px_55px_rgba(0,17,41,0.22)] backdrop-blur",
          "ring-1 ring-[color:var(--im-secondary)]/20",
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl tracking-tight">
            Update available
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            A newer version is ready to install.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[color:var(--im-bg)] px-4 py-3 ring-1 ring-border/60">
            <div className="text-sm font-medium text-[color:var(--im-navy)]">
              Version
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--im-secondary)] ring-1 ring-border/60">
              {props.version}
            </div>
          </div>

          {props.notes ? (
            <div className="rounded-2xl bg-white/70 p-4 text-sm text-muted-foreground ring-1 ring-border/60">
              <div className="text-sm font-medium text-foreground">What's new</div>
              <div className="mt-2 whitespace-pre-wrap leading-relaxed">
                {props.notes}
              </div>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel className="rounded-2xl" disabled={props.installing}>
            Not now
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "rounded-2xl bg-[color:var(--im-navy)] text-white shadow-sm",
              "hover:bg-[color:var(--im-navy)]/90",
            )}
            onClick={props.onInstall}
            disabled={props.installing}
          >
            {props.installing ? "Installing…" : "Install & Restart"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
