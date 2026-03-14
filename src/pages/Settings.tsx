import * as React from "react";
import { RefreshCw, Shield, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";

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

      <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">PDF export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium">Page numbering</div>
            <div className="text-sm text-muted-foreground">
              Adds “page X / Y” to the footer.
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
          <Button
            variant="secondary"
            className="rounded-2xl bg-white"
            onClick={() => {
              if (!confirm("Reset all app data to the initial demo set?")) return;
              resetToSeed();
              toast({ title: "Demo data restored." });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
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
    </div>
  );
}
