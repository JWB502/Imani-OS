import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FilePlus2, Pencil, Sparkles, TrendingUp, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, updateClient, deleteClient } = useData();

  const client = data.clients.find((c) => c.id === id);
  const reports = data.reports.filter((r) => r.clientId === id);
  const wins = data.wins.filter((w) => w.clientId === id);

  if (!client) {
    return (
      <div className="rounded-3xl border border-border/70 bg-white/70 p-8">
        <div className="text-lg font-semibold">Client not found</div>
        <div className="mt-2 text-sm text-muted-foreground">
          It may have been deleted.
        </div>
        <Button asChild className="mt-4 rounded-2xl">
          <Link to="/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  const statusClass =
    client.status === "Active"
      ? "bg-primary text-primary-foreground"
      : client.status === "Lead"
        ? "bg-[color:var(--im-secondary)] text-white"
        : client.status === "Paused"
          ? "bg-amber-200 text-amber-900"
          : "bg-slate-200 text-slate-900";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{client.name}</h1>
            <Badge className={cn("rounded-full", statusClass)}>{client.status}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {[client.city, client.state].filter(Boolean).join(", ") || "No location"}
            {client.organizationType ? ` • ${client.organizationType}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-2xl">
            <Link to={`/reports/new?clientId=${client.id}`}>
              <FilePlus2 className="mr-2 h-4 w-4" /> New report
            </Link>
          </Button>
          <Button asChild variant="secondary" className="rounded-2xl bg-white/70">
            <Link to={`/clients?edit=${client.id}`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>

          <Button
            variant="destructive"
            className="rounded-2xl"
            onClick={() => {
              if (!confirm(`Delete ${client.name}? This also removes reports, ROI, and wins.`)) return;
              deleteClient(client.id);
              navigate("/clients");
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-border/60">
              <div className="text-xs text-muted-foreground">Primary contact</div>
              <div className="mt-1 font-medium">
                {client.contactName || "—"}
              </div>
              <div className="text-sm text-muted-foreground">
                {client.contactEmail || "—"}
              </div>
              <div className="text-sm text-muted-foreground">
                {client.contactPhone || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-[color:var(--im-navy)] p-4 text-white ring-1 ring-white/10">
              <div className="text-xs text-white/80">Commercial snapshot</div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-white/70">Retainer</div>
                  <div className="font-semibold">
                    {formatCurrency(client.monthlyRetainer)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/70">Lifetime</div>
                  <div className="font-semibold">
                    {formatCurrency(client.totalLifetimeValue)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/70">Start</div>
                  <div className="font-semibold">{formatDate(client.startDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/70">CRM</div>
                  <div className="font-semibold">{client.crmUsed || "—"}</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {(client.tags || []).map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="rounded-full bg-white/70"
                  >
                    {t}
                  </Badge>
                ))}
                {(client.serviceTypes || []).map((s) => (
                  <Badge
                    key={s}
                    className="rounded-full bg-primary/10 text-primary hover:bg-primary/15"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">At a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
              <div>
                <div className="text-sm font-medium">Active reports</div>
                <div className="text-xs text-muted-foreground">Drafts + in progress</div>
              </div>
              <div className="text-lg font-semibold">
                {reports.filter((r) => r.status === "Draft").length}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
              <div>
                <div className="text-sm font-medium">Completed reports</div>
                <div className="text-xs text-muted-foreground">Ready for PDF</div>
              </div>
              <div className="text-lg font-semibold">
                {reports.filter((r) => r.status === "Complete").length}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
              <div>
                <div className="text-sm font-medium">Wins</div>
                <div className="text-xs text-muted-foreground">Notes for case studies</div>
              </div>
              <div className="text-lg font-semibold">{wins.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="h-11 rounded-2xl bg-white/70 p-1">
          <TabsTrigger value="reports" className="rounded-2xl">
            Reports
          </TabsTrigger>
          <TabsTrigger value="roi" className="rounded-2xl">
            ROI
          </TabsTrigger>
          <TabsTrigger value="wins" className="rounded-2xl">
            Wins
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-2xl">
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          <div className="grid gap-3">
            {reports.length === 0 ? (
              <div className="rounded-3xl border border-border/70 bg-white/70 p-8 text-center">
                <div className="text-sm font-medium">No reports yet</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Create a report from a full template.
                </div>
                <Button asChild className="mt-4 rounded-2xl">
                  <Link to={`/reports/new?clientId=${client.id}`}>Create report</Link>
                </Button>
              </div>
            ) : (
              reports
                .slice()
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((r) => (
                  <Link
                    key={r.id}
                    to={`/reports/${r.id}`}
                    className="block rounded-3xl border border-border/70 bg-white/70 p-4 shadow-sm transition hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {r.reportType}
                          {r.reportingPeriod ? ` • ${r.reportingPeriod}` : ""}
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-full",
                          r.status === "Complete"
                            ? "bg-primary text-primary-foreground"
                            : "bg-amber-200 text-amber-900",
                        )}
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </Link>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <div className="rounded-3xl border border-border/70 bg-white/70 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">ROI tracking</div>
                <div className="text-sm text-muted-foreground">
                  Monthly metrics + narrative notes.
                </div>
              </div>
              <Button asChild variant="secondary" className="rounded-2xl bg-white">
                <Link to={`/roi?clientId=${client.id}`}>
                  <TrendingUp className="mr-2 h-4 w-4" /> Open ROI dashboard
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wins" className="mt-4">
          <div className="rounded-3xl border border-border/70 bg-white/70 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Wins</div>
                <div className="text-sm text-muted-foreground">
                  Log outcomes for case studies and annual reporting.
                </div>
              </div>
              <Button asChild className="rounded-2xl">
                <Link to={`/wins?clientId=${client.id}`}>
                  <Sparkles className="mr-2 h-4 w-4" /> Open wins
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium">General notes</div>
                <Textarea
                  value={client.notes ?? ""}
                  onChange={(e) => updateClient(client.id, { notes: e.target.value })}
                  className="mt-2 min-h-28 rounded-2xl bg-white/70"
                  placeholder="Meeting notes, constraints, context…"
                />
              </div>
              <div>
                <div className="text-sm font-medium">Relationships / context</div>
                <Textarea
                  value={client.internalContext ?? ""}
                  onChange={(e) =>
                    updateClient(client.id, { internalContext: e.target.value })
                  }
                  className="mt-2 min-h-28 rounded-2xl bg-white/70"
                  placeholder="Things the team should remember…"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Autosaved.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
