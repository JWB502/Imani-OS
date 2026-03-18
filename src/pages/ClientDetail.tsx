import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FilePlus2, Image as ImageIcon, Pencil, Sparkles, TrendingUp, Trash2, ExternalLink } from "lucide-react";

import { CampaignsTab } from "@/components/campaigns/CampaignsTab";
import { SoftButton } from "@/components/app/SoftButton";
import { StarRating } from "@/components/app/StarRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SectionBlock } from "@/types/imani";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, updateClient, deleteClient } = useData();

  const client = data.clients.find((c) => c.id === id);
  const reports = data.reports.filter((r) => r.clientId === id);
  const wins = data.wins.filter((w) => w.clientId === id);
  const monthly = data.monthlyMetrics.filter((m) => m.clientId === id);

  const [notesDraft, setNotesDraft] = React.useState({
    notes: client?.notes ?? "",
    internalContext: client?.internalContext ?? "",
  });

  const hasNotesChanges =
    notesDraft.notes !== (client?.notes ?? "") ||
    notesDraft.internalContext !== (client?.internalContext ?? "");

  React.useEffect(() => {
    if (client) {
      setNotesDraft({
        notes: client.notes ?? "",
        internalContext: client.internalContext ?? "",
      });
    }
  }, [client?.id]); // Reset only when client changes

  const attachments = React.useMemo(() => {
    const out: Array<{
      reportId: string;
      reportTitle: string;
      label: string;
      url: string;
    }> = [];

    for (const r of reports) {
      for (const s of r.sections) {
        for (const b of s.blocks) {
          const block = b as SectionBlock;
          if (block.type !== "image") continue;
          if (!block.url) continue;
          out.push({
            reportId: r.id,
            reportTitle: r.title,
            label: `${s.title} — ${block.label}`,
            url: block.url,
          });
        }
      }
    }
    return out;
  }, [reports]);

  const activity = React.useMemo(() => {
    const items: Array<{ date: string; title: string; href?: string; meta?: string }> = [];

    for (const r of reports) {
      items.push({
        date: r.createdAt,
        title: `Report created: ${r.title}`,
        href: `/reports/${r.id}`,
        meta: r.reportType,
      });
      if (r.status === "Complete") {
        items.push({
          date: r.updatedAt,
          title: `Report completed: ${r.title}`,
          href: `/reports/${r.id}`,
        });
      }
    }

    for (const w of wins) {
      items.push({
        date: `${w.date}T12:00:00.000Z`,
        title: `Win logged: ${w.title}`,
        href: w.linkedReportId ? `/reports/${w.linkedReportId}` : undefined,
        meta: w.category,
      });
    }

    for (const m of monthly) {
      items.push({
        date: `${m.month}-01T12:00:00.000Z`,
        title: `ROI updated: ${m.month}`,
        href: `/roi?clientId=${client?.id ?? ""}`,
      });
    }

    return items
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 40);
  }, [reports, wins, monthly, client?.id]);

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

  const includeInAgencyImpact = client.includeInAgencyImpact ?? true;

  function saveNotes() {
    updateClient(client!.id, {
      notes: notesDraft.notes,
      internalContext: notesDraft.internalContext,
    });
  }

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
          <div className="mt-1 text-xs text-muted-foreground">
            Privacy ID: <span className="font-medium text-foreground/70">{client.privacyId ?? "—"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-2xl">
            <Link to={`/reports/new?clientId=${client.id}`}>
              <FilePlus2 className="mr-2 h-4 w-4" /> New report
            </Link>
          </Button>
          <SoftButton asChild className="rounded-2xl">
            <Link to={`/clients?edit=${client.id}`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </SoftButton>

          <Button
            variant="destructive"
            className="rounded-2xl"
            onClick={() => {
              if (!confirm(`Delete ${client.name}? This also removes reports, ROI, wins, and campaigns.`)) return;
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
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Primary contact</div>
              <div className="space-y-1">
                <div className="font-medium">
                  {client.contactName || "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {client.contactEmail || "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {client.contactPhone || "—"}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                {client.website && (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[color:var(--im-secondary)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Website
                  </a>
                )}
                {client.dashboardUrl && (
                  <a
                    href={client.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[color:var(--im-secondary)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Data Dashboard
                  </a>
                )}
                {client.pmUrl && (
                  <a
                    href={client.pmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[color:var(--im-secondary)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Project Management
                  </a>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-[color:var(--im-navy)] p-4 text-white ring-1 ring-white/10">
              <div className="text-xs text-white/80 font-medium uppercase tracking-wider mb-2">Commercial snapshot</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                <div>
                  <div className="text-xs text-white/60">
                    {client.billingType === "Project" ? "Project Value" : "Monthly Retainer"}
                  </div>
                  <div className="font-semibold text-sm">
                    {formatCurrency(
                      client.billingType === "Project"
                        ? client.oneTimeProjectValue
                        : client.monthlyRetainer
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Lifetime Value</div>
                  <div className="font-semibold text-sm">
                    {formatCurrency(client.totalLifetimeValue)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Billing Type</div>
                  <div className="font-semibold text-sm">{client.billingType || "Retainer"}</div>
                </div>
                <div>
                  <div className="text-xs text-white/60">CRM Used</div>
                  <div className="font-semibold text-sm truncate">{client.crmUsed || "—"}</div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Include in Agency Impact</div>
                    <div className="text-xs text-white/70">
                      Default setting (can be overridden per month in ROI).
                    </div>
                  </div>
                  <Switch
                    checked={includeInAgencyImpact}
                    onCheckedChange={(checked) =>
                      updateClient(client.id, { includeInAgencyImpact: checked })
                    }
                    className="data-[state=checked]:bg-[color:var(--im-secondary)] data-[state=unchecked]:bg-white/30"
                  />
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
          <TabsTrigger value="campaigns" className="rounded-2xl">
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="roi" className="rounded-2xl">
            ROI
          </TabsTrigger>
          <TabsTrigger value="wins" className="rounded-2xl">
            Wins
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-2xl">
            Activity
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

        <TabsContent value="campaigns" className="mt-4">
          <CampaignsTab clientId={client.id} />
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
              <SoftButton asChild className="rounded-2xl bg-white">
                <Link to={`/roi?clientId=${client.id}`}>
                  <TrendingUp className="mr-2 h-4 w-4" /> Open ROI dashboard
                </Link>
              </SoftButton>
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

        <TabsContent value="activity" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activity.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-white/70 p-8 text-center text-sm text-muted-foreground">
                    Activity will appear as you create reports, track ROI, and log wins.
                  </div>
                ) : (
                  activity.map((a, idx) => (
                    <div
                      key={`${a.date}_${idx}`}
                      className="flex items-start justify-between gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-border/60"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {a.href ? (
                            <Link className="underline-offset-4 hover:underline" to={a.href}>
                              {a.title}
                            </Link>
                          ) : (
                            a.title
                          )}
                        </div>
                        {a.meta ? (
                          <div className="text-xs text-muted-foreground">{a.meta}</div>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(a.date)}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4 text-primary" /> Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-white/70 p-6 text-center text-sm text-muted-foreground">
                    Add image blocks in reports to collect screenshots here.
                  </div>
                ) : (
                  attachments.slice(0, 12).map((a) => (
                    <a
                      key={`${a.reportId}_${a.url}`}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl bg-white/70 p-3 ring-1 ring-border/60 hover:bg-white"
                    >
                      <div className="text-sm font-medium">{a.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        From: {a.reportTitle}
                      </div>
                    </a>
                  ))
                )}
                {attachments.length > 12 ? (
                  <div className="text-xs text-muted-foreground">
                    Showing 12 of {attachments.length}.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <CardTitle className="text-base">Internal notes</CardTitle>
                <div className="flex items-center gap-2">
                  <StarRating rating={client.rating} readOnly />
                  {client.rating ? (
                    <span className="text-xs font-semibold text-muted-foreground/80">
                      {client.rating} / 5
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground/40 italic">Unrated</span>
                  )}
                </div>
              </div>
              {hasNotesChanges && (
                <Button onClick={saveNotes} size="sm" className="rounded-xl">
                  Save Notes
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium">General notes</div>
                <Textarea
                  value={notesDraft.notes}
                  onChange={(e) => setNotesDraft((p) => ({ ...p, notes: e.target.value }))}
                  className="mt-2 min-h-28 rounded-2xl bg-white/70"
                  placeholder="Meeting notes, constraints, context…"
                />
              </div>
              <div>
                <div className="text-sm font-medium">Relationships / context</div>
                <Textarea
                  value={notesDraft.internalContext}
                  onChange={(e) =>
                    setNotesDraft((p) => ({ ...p, internalContext: e.target.value }))
                  }
                  className="mt-2 min-h-28 rounded-2xl bg-white/70"
                  placeholder="Things the team should remember…"
                />
              </div>
              {!hasNotesChanges && (
                <div className="text-xs text-muted-foreground">
                  No unsaved changes.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}