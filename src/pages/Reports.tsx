import * as React from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { FileText, Plus, Trash2 } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

export default function Reports() {
  const { data, createReportFromTemplate, deleteReport } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const { globalSearchQuery } = useOutletContext<AppLayoutOutletContext>();

  const [localQuery, setLocalQuery] = React.useState("");
  const query = (localQuery || globalSearchQuery).trim().toLowerCase();

  const [open, setOpen] = React.useState(false);

  const [clientId, setClientId] = React.useState(params.get("clientId") ?? "");
  const [fullTemplateId, setFullTemplateId] = React.useState("");
  const [reportingPeriod, setReportingPeriod] = React.useState(
    new Date().toISOString().slice(0, 7),
  );
  const [title, setTitle] = React.useState("");
  const [analyst, setAnalyst] = React.useState(settings.analysts[0] ?? "");

  React.useEffect(() => {
    if (location.pathname === "/reports/new") setOpen(true);
  }, [location.pathname]);

  const clientMap = React.useMemo(
    () => new Map(data.clients.map((c) => [c.id, c])),
    [data.clients],
  );

  const filtered = data.reports
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((r) => {
      if (!query) return true;
      const clientName = clientMap.get(r.clientId)?.name ?? "";
      const hay = [r.title, r.reportType, r.reportingPeriod, r.status, clientName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });

  function openCreate() {
    setClientId(params.get("clientId") ?? data.clients[0]?.id ?? "");
    setFullTemplateId(data.fullTemplates.find((t) => !t.archived)?.id ?? "");
    setReportingPeriod(new Date().toISOString().slice(0, 7));
    setTitle("");
    setAnalyst(settings.analysts[0] ?? "");
    setOpen(true);
  }

  function save() {
    if (!clientId) {
      toast({ title: "Choose a client." });
      return;
    }
    if (!fullTemplateId) {
      toast({ title: "Choose a full template." });
      return;
    }

    const report = createReportFromTemplate({
      clientId,
      fullTemplateId,
      title: title.trim() || undefined,
      reportingPeriod,
      analyst: analyst || undefined,
    });

    toast({ title: "Report created." });
    setOpen(false);
    navigate(`/reports/${report.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Audit workspace + report builder
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1>
        </div>
        <Button onClick={openCreate} className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" /> New report
        </Button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/70 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Report</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden md:table-cell">Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Analyst</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className="hover:bg-white/60">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">
                        <Link
                          to={`/reports/${r.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {r.title}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">{r.reportType}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{clientMap.get(r.clientId)?.name ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {r.reportingPeriod ?? "—"}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="hidden lg:table-cell">{r.analyst ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      asChild
                      variant="secondary"
                      className="h-9 rounded-2xl bg-white"
                    >
                      <Link to={`/reports/${r.id}`}>Open</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-9 rounded-2xl"
                      onClick={() => {
                        if (!confirm(`Delete report “${r.title}”?`)) return;
                        deleteReport(r.id);
                        toast({ title: "Report deleted." });
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
                  <div className="text-sm font-medium">No reports found</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Create a report from a full template.
                  </div>
                  <Button onClick={openCreate} className="mt-4 rounded-2xl">
                    <Plus className="mr-2 h-4 w-4" /> New report
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
          if (!v && location.pathname === "/reports/new") {
            navigate("/reports", { replace: true });
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">New report</DialogTitle>
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
              <Label>Full template</Label>
              <Select value={fullTemplateId} onValueChange={setFullTemplateId}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {data.fullTemplates
                    .filter((t) => !t.archived)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Reporting period (YYYY-MM)</Label>
              <Input
                value={reportingPeriod}
                onChange={(e) => setReportingPeriod(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="2026-02"
              />
            </div>
            <div className="grid gap-2">
              <Label>Analyst</Label>
              <Input
                value={analyst}
                onChange={(e) => setAnalyst(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="Analyst name"
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Report title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-2xl"
                placeholder="Defaults to template name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" className="rounded-2xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-2xl" onClick={save}>
              Create report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-muted-foreground">
        Use templates to generate sections fast — edits inside a report do not affect master templates.
      </div>
    </div>
  );
}