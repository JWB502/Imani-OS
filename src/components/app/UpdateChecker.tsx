import * as React from "react";
import { toast } from "sonner";

import { UpdateDialog } from "@/components/app/UpdateDialog";
import { checkForUpdates, installAndRelaunch } from "@/lib/updater";

export function UpdateChecker() {
  const [open, setOpen] = React.useState(false);
  const [installing, setInstalling] = React.useState(false);
  const [payload, setPayload] = React.useState<
    | { version: string; notes?: string; update: unknown }
    | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await checkForUpdates();
        if (cancelled || !result.available) return;

        setPayload({
          version: result.version || "New version",
          notes: result.notes,
          update: result.update,
        });
        setOpen(true);
      } catch (e: any) {
        if (cancelled) return;
        toast.error("Update check failed", {
          description: String(e?.message ?? e),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!payload) return null;

  return (
    <UpdateDialog
      open={open}
      onOpenChange={setOpen}
      version={payload.version}
      notes={payload.notes}
      installing={installing}
      onInstall={async () => {
        if (installing) return;
        setInstalling(true);
        const id = toast.loading("Downloading update…");
        try {
          await installAndRelaunch(payload.update);
        } catch (e: any) {
          toast.dismiss(id);
          toast.error("Update install failed", {
            description: String(e?.message ?? e),
          });
          setInstalling(false);
        }
      }}
    />
  );
}
