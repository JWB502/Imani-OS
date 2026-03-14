import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/app/BrandMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { isTauri } from "@/lib/native";
import type { UserRole } from "@/types/imani";

type GhAsset = { name: string; browser_download_url: string };

type GhRelease = {
  html_url?: string;
  assets?: GhAsset[];
};

function normalize(s: string) {
  return s.toLowerCase();
}

async function detectMacArch(): Promise<"arm64" | "x64" | undefined> {
  const uaData: any = (navigator as any).userAgentData;
  if (uaData?.getHighEntropyValues) {
    try {
      const out = await uaData.getHighEntropyValues(["architecture"]);
      const arch = normalize(String(out?.architecture ?? ""));
      if (arch.includes("arm")) return "arm64";
      if (arch.includes("x86") || arch.includes("x64")) return "x64";
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function getLatestInstallerUrl(): Promise<string> {
  const releasesPage = "https://github.com/JWB502/Imani-OS/releases/latest";

  const res = await fetch(
    "https://api.github.com/repos/JWB502/Imani-OS/releases/latest",
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!res.ok) return releasesPage;

  const data = (await res.json()) as GhRelease;
  const assets = data.assets ?? [];

  const platform = normalize(
    String((navigator as any).userAgentData?.platform ?? navigator.platform ?? ""),
  );
  const ua = normalize(navigator.userAgent);
  const isMac = platform.includes("mac") || ua.includes("mac os") || ua.includes("macintosh");
  const isWindows = platform.includes("win") || ua.includes("windows");

  const byExt = (ext: string) =>
    assets.filter((a) => normalize(a.name).endsWith(ext));

  if (isMac) {
    const dmgs = byExt(".dmg");
    const pick = (pred: (a: GhAsset) => boolean) => dmgs.find(pred);

    const universal = pick((a) => normalize(a.name).includes("universal"));
    if (universal) return universal.browser_download_url;

    const arch = await detectMacArch();
    if (arch === "arm64") {
      const arm = pick((a) =>
        ["aarch64", "arm64", "apple"].some((h) => normalize(a.name).includes(h)),
      );
      if (arm) return arm.browser_download_url;
    }

    const intel = pick((a) =>
      ["x86_64", "x64", "intel"].some((h) => normalize(a.name).includes(h)),
    );
    if (intel) return intel.browser_download_url;

    if (dmgs[0]) return dmgs[0].browser_download_url;
  }

  if (isWindows) {
    const msis = byExt(".msi");
    if (msis[0]) return msis[0].browser_download_url;

    const exes = byExt(".exe");
    if (exes[0]) return exes[0].browser_download_url;
  }

  return data.html_url || releasesPage;
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [name, setName] = React.useState("Imani Team");
  const [email, setEmail] = React.useState("team@imaniadvantage.com");
  const [role, setRole] = React.useState<UserRole>("admin");
  const [downloading, setDownloading] = React.useState(false);

  const desktop = isTauri();

  React.useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const from = location?.state?.from ?? "/dashboard";

  return (
    <div className="min-h-svh bg-[color:var(--im-bg)] text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-md items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-3xl bg-[color:var(--im-navy)] p-5 shadow-[0_10px_30px_rgba(0,17,41,0.25)] ring-1 ring-white/10">
              <BrandMark className="text-white" />
            </div>
          </div>

          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-[0_12px_30px_rgba(3,17,17,0.10)] backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Sign in</CardTitle>
              <CardDescription className="text-base">
                Internal access for Imani Advantage team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  login({ name, email, role });
                  navigate(from, { replace: true });
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-2xl bg-white/80"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-2xl bg-white/80"
                    type="email"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger className="h-11 rounded-2xl bg-white/80">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin / Owner</SelectItem>
                      <SelectItem value="editor">Team Member / Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="h-11 rounded-2xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Enter Imani OS
                </Button>

                <div className="rounded-2xl bg-[color:var(--im-navy)] p-4 text-sm text-white/85 ring-1 ring-white/10">
                  <div className="font-medium text-white">No public accounts</div>
                  <div className="mt-1">
                    This is an internal operations system — access is managed by your team.
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {!desktop ? (
            <div className="mt-4">
              <Button
                disabled={downloading}
                onClick={async () => {
                  if (downloading) return;
                  setDownloading(true);
                  const id = toast.loading("Finding the right installer…");
                  try {
                    const url = await getLatestInstallerUrl();
                    toast.dismiss(id);
                    window.location.assign(url);
                  } catch (e: any) {
                    toast.dismiss(id);
                    toast.error("Couldn't start download", {
                      description: "Opening the Releases page instead.",
                    });
                    window.location.assign(
                      "https://github.com/JWB502/Imani-OS/releases/latest",
                    );
                  } finally {
                    setDownloading(false);
                  }
                }}
                className="h-11 w-full justify-center rounded-2xl bg-[color:var(--im-navy)] text-white shadow-[0_14px_35px_rgba(0,17,41,0.22)] ring-1 ring-white/10 hover:bg-[color:var(--im-navy)]/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Desktop App
              </Button>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                One-click installer • offline-ready • in-app updates
              </div>
            </div>
          ) : null}

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Tip: Add your OpenAI API key in Settings to enable AI drafting.
          </div>
        </div>
      </div>
    </div>
  );
}