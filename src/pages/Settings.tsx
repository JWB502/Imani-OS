import * as React from "react";
import { Download, RefreshCw, Shield, Sparkles, Upload } from "lucide-react";

import { SoftButton } from "@/components/app/SoftButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { exportBackup, importBackup, validateBackupPayload } from "@/lib/backup";
import { openFile, saveFile } from "@/lib/native";

function csv(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Settings() {
  const { toast } = useToast();
  const { resetToSeed } = useData();
  const { settings, updateSettings } = useSettings();

  const [analysts, setAnalysts] = React.useState(settings.analysts.join(", "));
  const [importCandidate, setImportCandidate] = React.useState<
    | { raw: unknown; summary: { clients: number; reports: number; exportedAt: string } }
    | null
  >(null);

  React.useEffect(() => {
    setAnalysts(settings.analysts.join(", "));
  }, [settings.analysts]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium text-muted-foreground">App preferences</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Agency name</Label>
              <Input
                value={settings.agencyName}
                onChange={(e) => updateSettings({ agencyName: e.target.value })}
                className="h-11 rounded-2xl bg-white/70"
              />
            </div>
            <div className="rounded-2xl bg-[color:var(--im-navy)] p-4 text-sm text-white ring-1 ring-white/10">
              <div className="font-medium text-white">Imani OS</div>
              <div className="mt-1 text-white/80">
                Premium internal SaaS feel • mobile-friendly • template-driven
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> AI assistance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label>OpenAI API key</Label>
              <Input
                value={settings.openAiApiKey ?? ""}
                onChange={(e) => updateSettings({ openAiApiKey: e.target.value || undefined })}
                type="password"
                className="h-11 rounded-2xl bg-white/70"
                placeholder="sk-..."
              />
              <div className="text-xs text-muted-foreground">
                Stored locally in your browser. Recommended for internal-only use.
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Model</Label>
              <Input
                value={settings.openAiModel}
                onChange={(e) => updateSettings({ openAiModel: e.target.value })}
                className="h-11 rounded-2xl bg-white/70"
                placeholder="gpt-4o-mini"
              />
            </div>
            <div className="grid gap-2">
              <Label>Analysts (comma-separated)</Label>
              <Input
                value={analysts}
                onChange={(e) => setAnalysts(e.target.value)}
                onBlur={() => updateSettings({ analysts: csv(analysts) })}
                className="h-11 rounded-2xl bg-white/70"
                placeholder="Imani Analyst, Jordan, Sam"
              />
              <div className="text-xs text-muted-foreground">
                Used as a suggestion in report creation.
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">How AI is used</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Summaries, recommendations, rewrites — analyst remains in control.
                  </div>
                </div>
                <Shield className="h-5 w-5 text-[color:var(--im-secondary)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-[color:var(--im-secondary)]" /> Privacy &amp; Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium">AI redaction style</div>
              <div className="mt-1 text-sm text-muted-foreground">
                PII redaction applies to AI requests only. UI data is shown normally.
              </div>
            </div>

            <RadioGroup
              value={settings.redactionStyle}
              onValueChange={(v) => updateSettings({ redactionStyle: v as any })}
              className="grid gap-3"
            >
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-3xl border border-border/70 bg-white/70 p-4 ring-1 ring-border/60",
                  settings.redactionStyle === "iaid" && "ring-2 ring-primary/30",
                )}
              >
                <RadioGroupItem value="iaid" className="mt-1" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">IA ID per client (IA#######)</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Default. Consistent anonymization across all AI prompts.
                  </div>
                </div>
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-3xl border border-border/70 bg-white/70 p-4 ring-1 ring-border/60",
                  settings.redactionStyle === "initial" && "ring-2 ring-primary/30",
                )}
              >
                <RadioGroupItem value="initial" className="mt-1" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">First-initial for people</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Example: John Doe → J.D. (best-effort on known name fields).
                  </div>

                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Backups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" id="backups">
            <div className="text-sm text-muted-foreground">
              Import replaces local data on this device. API keys are not included in backups.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SoftButton
                className="h-11 justify-center rounded-2xl bg-white"
                onClick={async () => {
                  try {
                    const { filename, content } = exportBackup();
                    await saveFile({ content, defaultPath: filename });
                    toast({ title: "Backup exported." });
                  } catch (e: any) {
                    toast({
                      title: "Export failed",
                      description: String(e?.message ?? e),
                    });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Export JSON
              </SoftButton>

              <SoftButton
                className="h-11 justify-center rounded-2xl bg-white"
                onClick={async () => {
                  const text = await openFile();
                  if (!text) return;

                  try {
                    const raw = JSON.parse(text);
                    const parsed = validateBackupPayload(raw);
                    setImportCandidate({
                      raw,
                      summary: {
                        clients: parsed.data.clients.length,
                        reports: parsed.data.reports.length,
                        exportedAt: parsed.exportedAt,
                      },
                    });
                  } catch (e: any) {
                    toast({
                      title: "Invalid backup file",
                      description: String(e?.message ?? e),
                    });
                  }
                }}
              >
                <Upload className="mr-2 h-4 w-4" /> Import JSON
              </SoftButton>
            </div>

            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
              <div className="text-sm font-medium">What's included</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Clients, reports, templates, ROI, wins, campaigns, and app settings.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">PDF export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium">Page numbering</div>
            <div className="text-sm text-muted-foreground">
              Adds "page X / Y" to the footer.
            </div>
          </div>
          <Switch
            checked={settings.pdfPageNumbers}
            onCheckedChange={(v) => updateSettings({ pdfPageNumbers: v })}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium">Reset demo data</div>
            <div className="text-sm text-muted-foreground">
              Restores sample client + template preload set.
            </div>
          </div>
          <SoftButton
            className="rounded-2xl bg-white"
            onClick={() => {
              if (!confirm("Reset all app data to the initial demo set?")) return;
              resetToSeed();
              toast({ title: "Demo data restored." });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </SoftButton>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-24 rounded-2xl bg-white/70"
            placeholder="Internal ops notes… (stored only in this device)"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            If you want to connect a database + real auth later, we can integrate Supabase.
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(importCandidate)}
        onOpenChange={(open) => {
          if (!open) setImportCandidate(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Import backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace local data and settings on this device. Your current OpenAI API key will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {importCandidate ? (
            <div className="rounded-2xl bg-white/70 p-4 text-sm ring-1 ring-border/60">
              <div className="font-medium">Backup summary</div>
              <div className="mt-1 text-muted-foreground">
                {importCandidate.summary.clients} clients • {importCandidate.summary.reports} reports
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Exported: {new Date(importCandidate.summary.exportedAt).toLocaleString()}
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl"
              onClick={async () => {
                if (!importCandidate) return;
                try {
                  await importBackup(importCandidate.raw);
                  toast({ title: "Backup imported. Reloading…" });
                  setImportCandidate(null);
                  setTimeout(() => window.location.reload(), 450);
                } catch (e: any) {
                  toast({
                    title: "Import failed",
                    description: String(e?.message ?? e),
                  });
                }
              }}
            >
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}