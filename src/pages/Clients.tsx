import * as React from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";

import { SoftButton } from "@/components/app/SoftButton";
import { StarRating } from "@/components/app/StarRating";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import type { Client, ClientStatus, BillingType } from "@/types/imani";
import { INDUSTRIES } from "@/types/imani";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function statusBadge(status: ClientStatus) {
  switch (status) {
    case "Lead":
      return "bg-[color:var(--im-secondary)] text-white";
    case "Active":
      return "bg-primary text-primary-foreground";
    case "Paused":
      return "bg-amber-200 text-amber-900";
    case "Former":
      return "bg-slate-200 text-slate-900";
  }
}

// Local draft type extends Client with UI-only fields.
type ClientDraft = Omit<Client, "id" | "createdAt" | "updatedAt"> & {
  /** Local-only numeric input for total service expenses used to auto-calc lifetime value */
  serviceExpensesTotal?: never; // no longer used; lifetime comes from ROI tracking
  /** Whether this client is included in retention metrics (UI-only for now) */
  includeInRetention?: boolean;
};

const emptyDraft: ClientDraft = {
  name: "",
  status: "Lead",
  billingType: "Retainer",
  rating: 0,
  tags: [],
  serviceTypes: [],
  totalLifetimeValue: 0,
  includeInRetention: true,
};

function toCsvArray(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Clients() {
  const { data, createClient, updateClient, deleteClient } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { globalSearchQuery } = useOutletContext<AppLayoutOutletContext>();
  const [localQuery, setLocalQuery] = React.useState("");
  const query = (localQuery || globalSearchQuery).trim().toLowerCase();

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [draft, setDraft] = React.useState<ClientDraft>(emptyDraft);

  React.useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    const c = data.clients.find((x) => x.id === editId);
    if (!c) return;
    openEdit(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, data.clients]);

  React.useEffect(() => {
    if (location.pathname === "/clients/new") {
      setEditing(null);
      setDraft(emptyDraft);
      setOpen(true);
    }
  }, [location.pathname]);

  const filtered = data.clients
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((c) => {
      if (!query) return true;
      const hay = [
        c.name,
        c.status,
        c.organizationType,
        c.industry,
        c.city,
        c.state,
        c.tags.join(" "),
        c.serviceTypes.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setDraft({
      name: client.name,
      organizationType: client.organizationType,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      website: client.website,
      crmUsed: client.crmUsed,
      status: client.status,
      startDate: client.startDate,
      endDate: client.endDate,
      dashboardUrl: client.dashboardUrl,
      pmUrl: client.pmUrl,
      notes: client.notes,
      billingType: client.billingType ?? "Retainer",
      rating: client.rating ?? 0,
      tags: client.tags,
      serviceTypes: client.serviceTypes,
      industry: client.industry,
      city: client.city,
      state: client.state,
      monthlyRetainer: client.monthlyRetainer,
      oneTimeProjectValue: client.oneTimeProjectValue,
      totalLifetimeValue: client.totalLifetimeValue,
      internalContext: client.internalContext,
      // Time-Cost Analysis
      enableTimeCostAnalysis: client.enableTimeCostAnalysis,
      avgHoursSavedPerMonth: client.avgHoursSavedPerMonth,
      hourlyValue: client.hourlyValue,
      // Existing clients default to being included in retention
      includeInRetention: true,
    });
    setOpen(true);
  }

  function save() {
    if (!draft.name.trim()) {
      toast({ title: "Client name is required." });
      return;
    }

    // Lifetime value is controlled by ROI tracking, so we just pass through
    const payload = {
      ...draft,
      name: draft.name.trim(),
      tags: draft.tags,
      serviceTypes: draft.serviceTypes,
    };

    if (editing) {
      updateClient(editing.id, payload);
      toast({ title: "Client updated." });
    } else {
      const created = createClient(payload);
      toast({ title: "Client created." });
      navigate(`/clients/${created.id}`);
    }

    setOpen(false);
    setEditing(null);
    setDraft(emptyDraft);
    if (location.pathname === "/clients/new") navigate("/clients", { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Full CRUD client management
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Clients</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openCreate} className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" /> Add client
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Filter clients by name, status, tags…"
            className="h-10 rounded-2xl bg-white/70 pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filtered.length} of {data.clients.length}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/70 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="hidden lg:table-cell">Services</TableHead>
              <TableHead className="hidden lg:table-cell">Lifetime</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} className="hover:bg-white/60">
                <TableCell>
                  <div className="font-medium">
                    <Link
                      to={`/clients/${c.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.organizationType || "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("rounded-full", statusBadge(c.status))}>
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell align-top lg:min-w-[220px]">
                  <div className="flex flex-wrap gap-1.5">
                    {(c.serviceTypes || []).slice(0, 2).map((s) => (
                      <Badge
                        key={s}
                        className="rounded-full bg-[color:var(--im-secondary)]/12 text-[color:var(--im-secondary)] ring-1 ring-[color:var(--im-secondary)]/20 px-2.5 py-0.5 text-xs font-medium"
                      >
                        {s}
                      </Badge>
                    ))}
                    {c.serviceTypes.length > 2 ? (
                      <span className="text-xs text-muted-foreground">
                        +{c.serviceTypes.length - 2}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatCurrency(c.totalLifetimeValue)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <SoftButton
                      className="h-9 rounded-2xl bg-white"
                      onClick={() => openEdit(c)}
                    >
                      Edit
                    </SoftButton>
                    <Button
                      variant="destructive"
                      className="h-9 rounded-2xl"
                      onClick={() => {
                        if (!confirm(`Delete ${c.name}? This also removes reports, ROI, and wins.`)) return;
                        deleteClient(c.id);
                        toast({ title: "Client deleted." });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="text-sm font-medium">No clients found</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Try a different search or add a new client.
                  </div>
                  <Button onClick={openCreate} className="mt-4 rounded-2xl">
                    <Plus className="mr-2 h-4 w-4" /> Add client
                  </Button>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v && (location.pathname === "/clients/new" || searchParams.get("edit"))) {
            navigate("/clients", { replace: true });
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">
              {editing ? "Edit client" : "New client"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-1 w-full">
            <TabsList className="mb-4 grid w-full grid-cols-3 rounded-2xl bg-muted/60 p-1">
              <TabsTrigger
                value="details"
                className="text-sm rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="text-sm rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Billing & metrics
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="text-sm rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Notes
              </TabsTrigger>
            </TabsList>

            {/* DETAILS TAB */}
            <TabsContent value="details" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <Label>Client name</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    className="h-11 rounded-2xl"
                    placeholder="e.g., North Star Nonprofit"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(v) =>
                      setDraft((p) => ({ ...p, status: v as ClientStatus }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Former">Former</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Organization type</Label>
                  <Input
                    value={draft.organizationType ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, organizationType: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                    placeholder="e.g. 501(c)(3), LLC"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Industry</Label>
                  <Select
                    value={draft.industry ?? ""}
                    onValueChange={(v) => setDraft((p) => ({ ...p, industry: v }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Contact name</Label>
                  <Input
                    value={draft.contactName ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, contactName: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Contact email</Label>
                  <Input
                    value={draft.contactEmail ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, contactEmail: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                    type="email"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Website URL</Label>
                  <Input
                    value={draft.website ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, website: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Data Dashboard URL</Label>
                  <Input
                    value={draft.dashboardUrl ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, dashboardUrl: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Project Management URL</Label>
                  <Input
                    value={draft.pmUrl ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, pmUrl: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>CRM Used</Label>
                  <Input
                    value={draft.crmUsed ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, crmUsed: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                    placeholder="e.g., Salesforce, HubSpot"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>City</Label>
                  <Input
                    value={draft.city ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, city: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>State</Label>
                  <Input
                    value={draft.state ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, state: e.target.value }))
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={draft.startDate ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        startDate: e.target.value || undefined,
                      }))
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={draft.endDate ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        endDate: e.target.value || undefined,
                      }))
                    }
                    className="h-11 rounded-2xl"
                  />
                </div>
              </div>
            </TabsContent>

            {/* BILLING & METRICS TAB */}
            <TabsContent value="billing" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Billing Type</Label>
                  <Select
                    value={draft.billingType}
                    onValueChange={(v) =>
                      setDraft((p) => ({ ...p, billingType: v as BillingType }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retainer">Retainer</SelectItem>
                      <SelectItem value="Project">Project</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draft.billingType === "Project" ? (
                  <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
                    <Label>Project Value</Label>
                    <Input
                      type="number"
                      value={draft.oneTimeProjectValue ?? ""}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          oneTimeProjectValue: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                      className="h-11 rounded-2xl"
                      inputMode="decimal"
                    />
                  </div>
                ) : (
                  <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
                    <Label>Monthly retainer</Label>
                    <Input
                      type="number"
                      value={draft.monthlyRetainer ?? ""}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          monthlyRetainer: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                      className="h-11 rounded-2xl"
                      inputMode="decimal"
                    />
                  </div>
                )}

                <div className="grid gap-1 md:col-span-2">
                  <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Total lifetime value
                      </div>
                      <div className="text-sm text-muted-foreground">
                        This is calculated from ROI tracking for this client.
                      </div>
                    </div>
                    <div className="text-right text-lg font-semibold">
                      {draft.totalLifetimeValue !== undefined
                        ? formatCurrency(draft.totalLifetimeValue)
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={draft.tags.join(", ")}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, tags: toCsvArray(e.target.value) }))
                    }
                    className="h-11 rounded-2xl"
                    placeholder="retainer, nonprofit, local"
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label>Service types (comma-separated)</Label>
                  <Input
                    value={draft.serviceTypes.join(", ")}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        serviceTypes: toCsvArray(e.target.value),
                      }))
                    }
                    className="h-11 rounded-2xl"
                    placeholder="Local SEO, Reporting, Operations"
                  />
                </div>

                <div className="md:col-span-2 mt-2 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">
                      Include in retention metrics
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Turn this off for one-off projects that shouldn&apos;t affect
                      retention.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        includeInRetention:
                          p.includeInRetention === false
                            ? true
                            : !p.includeInRetention
                            ? true
                            : false,
                      }))
                    }
                    className={cn(
                      "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
                      draft.includeInRetention !== false
                        ? "bg-[color:var(--im-secondary)] border-[color:var(--im-secondary)]"
                        : "bg-muted border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                        draft.includeInRetention !== false
                          ? "translate-x-6"
                          : "translate-x-1",
                      )}
                    />
                  </button>
                </div>

                {/* TIME-COST ANALYSIS SECTION */}
                <div className="md:col-span-2 mt-4 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-indigo-50/30 px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-indigo-900">
                        Time-Cost Analysis
                      </div>
                      <p className="text-xs text-indigo-700/70">
                        Measure monetary value of time saved for this client.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          enableTimeCostAnalysis: !p.enableTimeCostAnalysis,
                        }))
                      }
                      className={cn(
                        "relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
                        draft.enableTimeCostAnalysis
                          ? "bg-indigo-600 border-indigo-600"
                          : "bg-muted border-border",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                          draft.enableTimeCostAnalysis
                            ? "translate-x-6"
                            : "translate-x-1",
                        )}
                      />
                    </button>
                  </div>

                  {draft.enableTimeCostAnalysis && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl border border-indigo-100 bg-white shadow-sm animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase">Avg Hours Saved / Mo</Label>
                        <Input
                          type="number"
                          value={draft.avgHoursSavedPerMonth ?? ""}
                          onChange={(e) => setDraft(p => ({ ...p, avgHoursSavedPerMonth: Number(e.target.value) }))}
                          placeholder="0"
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase">Value of an Hour ($)</Label>
                        <Input
                          type="number"
                          value={draft.hourlyValue ?? ""}
                          onChange={(e) => setDraft(p => ({ ...p, hourlyValue: Number(e.target.value) }))}
                          placeholder="0.00"
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase">Monthly Savings</Label>
                        <div className="h-10 flex items-center px-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/50">
                          {formatCurrency((draft.avgHoursSavedPerMonth || 0) * (draft.hourlyValue || 0))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* NOTES TAB (LAST) */}
            <TabsContent value="notes" className="mt-0">
              <div className="grid gap-4">
                <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm">
                  <Label className="text-sm font-medium">Client rating</Label>
                  <div className="flex items-center gap-4">
                    <StarRating
                      rating={draft.rating}
                      onRatingChange={(r) => setDraft((p) => ({ ...p, rating: r }))}
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      {draft.rating || 0} / 5 stars
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Internal notes</Label>
                  <Textarea
                    value={draft.notes ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, notes: e.target.value }))
                    }
                    className="min-h-24 rounded-2xl"
                    placeholder="Relationship context, constraints, priorities…"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Relationships / context</Label>
                  <Textarea
                    value={draft.internalContext ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, internalContext: e.target.value }))
                    }
                    className="min-h-24 rounded-2xl"
                    placeholder="Internal context notes (what the team should remember)…"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button className="rounded-2xl" onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}