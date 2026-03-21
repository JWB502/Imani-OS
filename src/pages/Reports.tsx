"use client";

import * as React from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { Check, ChevronsUpDown, Copy, FileStack, Filter, Plus, Search, Trash2 } from "lucide-react";

import type { AppLayoutOutletContext } from "@/components/app/AppLayout";
import { SoftButton } from "@/components/app/SoftButton";
import { DocumentStatusBadge } from "@/components/documents/DocumentToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, createReportFromTemplate, duplicateReport, deleteReport } = useData();
  const { globalSearchQuery } = useOutletContext<AppLayoutOutletContext>();
  const [params, setParams] = useSearchParams();

  const [open, setOpen] = React.useState(false);
  const [clientPickerOpen, setClientPickerOpen] = React.useState(false);
  const [localQuery, setLocalQuery] = React.useState("");
  const [selectedClientId, setSelectedClientId] = React.useState(params.get("clientId") || "");
  const [selectedTemplateId, setSelectedTemplateId] = React.useState("");

  const query = (localQuery || globalSearchQuery).trim().toLowerCase();
  const templates = data.documentTemplates.filter((template) => template.kind === "template" && !template.archived);
  const activeClients = data.clients.filter((client) => client.status === "Active" || client.status === "Lead");
  const clientMap = new Map(data.clients.map((client) => [client.id, client]));

  const reports = data.reports
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((report) => {
      if (params.get("clientId") && report.clientId !== params.get("clientId")) return false;
      if (!query) return true;
      const clientName = clientMap.get(report.clientId)?.name ?? "";
      return [report.title, report.reportType, report.reportingPeriod, report.status, clientName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  function handleCreate() {
    if (!selectedClientId || !selectedTemplateId) {
      toast({ title: "Choose both a client and a template first." });
      return;
    }

    const report = createReportFromTemplate(selectedClientId, selectedTemplateId);
    if (!report) {
      toast({ title: "Unable to create the report copy." });
      return;
    }

    toast({ title: "Detached report copy created." });
    setOpen(false);
    navigate(`/reports/${report.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-border/70 bg-white/75 p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Report workspace</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--im-navy)]">Document-first reports</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Every report is now generated as a detached copy of a document template, so teams can customize nested pages, richer blocks, and export structure without mutating the source template.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" /> Create report
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localQuery}
            onChange={(event) => setLocalQuery(event.target.value)}
            className="h-11 rounded-2xl bg-white/80 pl-10"
            placeholder="Search reports, clients, or status…"
          />
        </div>

        {params.get("clientId") ? (
          <Badge className="gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Filter className="h-4 w-4" />
            {clientMap.get(params.get("clientId")!)?.name}
            <button
              type="button"
              onClick={() => {
                params.delete("clientId");
                setParams(params);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-white/75 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Report</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Template source</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="group hover:bg-white/60">
                <TableCell className="pl-6">
                  <Link to={`/reports/${report.id}`} className="block font-medium transition-colors group-hover:text-primary">
                    {report.title}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">{report.reportingPeriod || report.reportType}</div>
                </TableCell>
                <TableCell>
                  <Link to={`/clients/${report.clientId}`} className="hover:underline">
                    {clientMap.get(report.clientId)?.name ?? "—"}
                  </Link>
                </TableCell>
                <TableCell>
                  <DocumentStatusBadge label={report.status} tone={report.status === "Complete" ? "success" : "warning"} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {data.documentTemplates.find((template) => template.id === report.templateSourceId)?.name ?? report.reportType}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(report.updatedAt)}</TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex justify-end gap-2">
                    <SoftButton
                      className="rounded-2xl"
                      onClick={() => {
                        const duplicate = duplicateReport(report.id);
                        if (!duplicate) return;
                        toast({ title: "Report duplicated." });
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </SoftButton>
                    <Button
                      variant="destructive"
                      className="rounded-2xl"
                      onClick={() => {
                        if (!confirm(`Delete “${report.title}”?`)) return;
                        deleteReport(report.id);
                        toast({ title: "Report deleted." });
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <FileStack className="h-6 w-6" />
                    </div>
                    <div className="text-lg font-semibold">No reports yet</div>
                    <div className="mt-2 text-sm text-muted-foreground">Create one from a document template to start editing on the new canvas.</div>
                    <Button className="mt-4 rounded-2xl" onClick={() => setOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Create report
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create a new report</DialogTitle>
            <DialogDescription>
              1) choose client, 2) choose template, 3) generate detached copy, 4) edit inside the document workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-2">
              <Label>Step 1 — Client</Label>
              <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={clientPickerOpen} className="h-11 w-full justify-between rounded-2xl bg-white font-normal">
                    {selectedClientId ? activeClients.find((client) => client.id === selectedClientId)?.name : "Search for a client"}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-2xl p-0">
                  <Command className="rounded-2xl">
                    <CommandInput placeholder="Search client" />
                    <CommandList>
                      <CommandEmpty>No client found.</CommandEmpty>
                      <CommandGroup>
                        {activeClients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => {
                              setSelectedClientId(client.id);
                              setClientPickerOpen(false);
                            }}
                            className="mx-1 rounded-xl"
                          >
                            <Check className={cn("mr-2 h-4 w-4 text-primary", selectedClientId === client.id ? "opacity-100" : "opacity-0")} />
                            {client.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Step 2 — Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="h-11 rounded-2xl bg-white">
                  <SelectValue placeholder="Choose a document template" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground">{template.pages.length} pages</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Reports created here are fully detached copies. Later template edits will not affect in-progress or completed reports.
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" className="rounded-2xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-2xl" disabled={!selectedClientId || !selectedTemplateId} onClick={handleCreate}>Generate report copy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
