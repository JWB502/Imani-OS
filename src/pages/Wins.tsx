import * as React from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Plus, Search, Sparkles, Trash2 } from "lucide-react";

import type { AppLayoutOutletContext } from "@/components/app/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import type { Win, WinCategory } from "@/types/imani";
import { cn } from "@/lib/utils";

function toCsvArray(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const categories: WinCategory[] = [
  "Visibility",
  "Operations",
  "Automation",
  "Revenue",
  "Donations",
  "Reviews",
  "Other",
];

function catBadge(cat: WinCategory) {
  switch (cat) {
    case "Visibility":
      return "bg-primary/10 text-primary";
    case "Operations":
      return "bg-[color:var(--im-secondary)]/10 text-[color:var(--im-secondary)]";
    case "Automation":
      return "bg-indigo-100 text-indigo-900";
    case "Revenue":
      return "bg-emerald-100 text-emerald-900";
    case "Donations":
      return "bg-cyan-100 text-cyan-900";
    case "Reviews":
      return "bg-amber-100 text-amber-900";
    case "Other":
      return "bg-slate-100 text-slate-900";
  }
}

export default function Wins() {
  const { toast } = useToast();
  const { data, createWin, deleteWin, updateWin } = useData();
  const [params, setParams] = useSearchParams();

  const { globalSearchQuery } = useOutletContext<AppLayoutOutletContext>();

  const [localQuery, setLocalQuery] = React.useState("");
  const query = (localQuery || globalSearchQuery).trim().toLowerCase();

  const [open, setOpen] = React.useState(false);
  const [clientId, setClientId] = React.useState(params.get("clientId") ?? data.clients[0]?.id ?? "");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = React.useState<WinCategory>("Visibility");
  const [beforeAfter, setBeforeAfter] = React.useState("");
  const [measurableResult, setMeasurableResult] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [caseStudyPotential, setCaseStudyPotential] = React.useState(false);
  const [linkedReportId, setLinkedReportId] = React.useState("");

  React.useEffect(() => {
    if (clientId) {
      params.set("clientId", clientId);
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const clientMap = React.useMemo(
    () => new Map(data.clients.map((c) => [c.id, c.name])),
    [data.clients],
  );

  const filtered = data.wins
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((w) => {
      if (params.get("clientId") && params.get("clientId") !== w.clientId) {
        return false;
      }
      if (!query) return true;
      const hay = [
        w.title,
        w.description,
        w.category,
        w.measurableResult,
        w.beforeAfter,
        w.tags.join(" "),
        clientMap.get(w.clientId) ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });

  const reportsForClient = data.reports
    .filter((r) => r.clientId === clientId)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  function openCreate() {
    setTitle("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    setCategory("Visibility");
    setBeforeAfter("");
    setMeasurableResult("");
    setTags("");
    setCaseStudyPotential(false);
    setLinkedReportId("");
    setOpen(true);
  }

  function save() {
    if (!clientId) {
      toast({ title: "Choose a client." });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Win title is required." });
      return;
    }

    createWin({
      clientId,
      title: title.trim(),
      description: description.trim(),
      date,
      category,
      beforeAfter: beforeAfter.trim() || undefined,
      measurableResult: measurableResult.trim() || undefined,
      tags: toCsvArray(tags),
      caseStudyPotential,
      linkedReportId: linkedReportId || undefined,
    });

    toast({ title: "Win logged." });
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Wins + case-study notes (internal)
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Wins Library</h1>
        </div>
        <Button onClick={openCreate} className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" /> Log a win
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search wins by client, tags, results…"
            className="h-11 rounded-2xl bg-white/70 pl-9"
          />
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="h-11 rounded-2xl bg-white/70">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            {data.clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="rounded-3xl border border-border/70 bg-white/70 p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{w.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {clientMap.get(w.clientId) ?? "—"} • {w.date}
                    </div>
                  </div>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm">{w.description}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={cn("rounded-full", catBadge(w.category))}>
                    {w.category}
                  </Badge>
                  {w.caseStudyPotential ? (
                    <Badge className="rounded-full bg-[color:var(--im-navy)] text-white">
                      Case study potential
                    </Badge>
                  ) : null}
                  {w.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full bg-white/70">
                      {t}
                    </Badge>
                  ))}
                </div>
                {w.measurableResult ? (
                  <div className="mt-3 rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
                    <div className="text-xs font-medium text-muted-foreground">Result</div>
                    <div className="mt-1 text-sm">{w.measurableResult}</div>
                  </div>
                ) : null}
                {w.linkedReportId ? (
                  <div className="mt-2 text-sm">
                    Linked report: <Link className="underline" to={`/reports/${w.linkedReportId}`}>Open</Link>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="rounded-2xl bg-white"
                  onClick={() => updateWin(w.id, { caseStudyPotential: !w.caseStudyPotential })}
                >
                  {w.caseStudyPotential ? "Unmark case study" : "Mark case study"}
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-2xl"
                  onClick={() => {
                    if (!confirm(`Delete win "${w.title}"?`)) return;
                    deleteWin(w.id);
                    toast({ title: "Win deleted." });
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-white/70 p-10 text-center">
            <div className="text-sm font-medium">No wins found</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Log wins as you ship improvements and capture outcomes.
            </div>
            <Button onClick={openCreate} className="mt-4 rounded-2xl">
              <Plus className="mr-2 h-4 w-4" /> Log a win
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Log a win</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {data.clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="Improved ranking from #8 to #2"
              />
            </div>

            <div className="grid gap-2">
              <Label>Date</Label>
              <Input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as WinCategory)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24 rounded-2xl"
                placeholder="What happened? Why does it matter?"
              />
            </div>

            <div className="grid gap-2">
              <Label>Before / After</Label>
              <Input
                value={beforeAfter}
                onChange={(e) => setBeforeAfter(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="#8 → #2"
              />
            </div>
            <div className="grid gap-2">
              <Label>Measurable result</Label>
              <Input
                value={measurableResult}
                onChange={(e) => setMeasurableResult(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="+42% calls, +$12k revenue…"
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="gbp, automation, reviews"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60 md:col-span-2">
              <div>
                <div className="text-sm font-medium">Case study potential</div>
                <div className="text-xs text-muted-foreground">Mark for future storytelling</div>
              </div>
              <Switch checked={caseStudyPotential} onCheckedChange={setCaseStudyPotential} />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Linked report (optional)</Label>
              <Select value={linkedReportId} onValueChange={setLinkedReportId}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {reportsForClient.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" className="rounded-2xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-2xl" onClick={save}>
              Save win
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}