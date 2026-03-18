"use client";

import * as React from "react";
import { Link, useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import { FileText, Plus, Search, Trash2, Filter, Copy, Check, ChevronsUpDown } from "lucide-react";

import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SoftButton } from "@/components/app/SoftButton";
import type { AppLayoutOutletContext } from "@/components/app/AppLayout";
import type { Client, ReportStatus } from "@/types/imani";

export default function Reports() {
  const { data, createReportFromTemplate, duplicateReport, deleteReport } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { globalSearchQuery } = useOutletContext<AppLayoutOutletContext>();

  const [localQuery, setLocalQuery] = React.useState("");
  const query = (localQuery || globalSearchQuery).trim().toLowerCase();

  const [open, setOpen] = React.useState(false);
  const [comboboxOpen, setComboboxOpen] = React.useState(false);
  const [selectedClientId, setSelectedClientId] = React.useState<string>(params.get("clientId") || "");
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("");

  React.useEffect(() => {
    if (params.get("clientId") && !selectedClientId) {
      setSelectedClientId(params.get("clientId") || "");
    }
  }, [params]);

  const clientMap = React.useMemo(() => {
    const map = new Map<string, Client>();
    data.clients.forEach(c => map.set(c.id, c));
    return map;
  }, [data.clients]);

  const activeClients = React.useMemo(() => 
    data.clients.filter(c => c.status === "Active" || c.status === "Lead"),
    [data.clients]
  );

  const filteredReports = data.reports
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter(r => {
      const client = clientMap.get(r.clientId);
      const clientName = client?.name ?? "";
      
      if (params.get("clientId") && r.clientId !== params.get("clientId")) return false;
      
      if (!query) return true;
      const hay = [r.title, r.reportType, r.reportingPeriod, r.status, clientName].map(s => s.toLowerCase());
      return hay.some(h => h.includes(query));
    });

  const handleCreate = () => {
    if (!selectedClientId || !selectedTemplateId) {
      toast({ title: "Please select both a client and a template." });
      return;
    }

    const report = createReportFromTemplate(selectedClientId, selectedTemplateId);
    if (report) {
      toast({ title: "Report created successfully." });
      navigate(`/reports/${report.id}`);
    } else {
      toast({ title: "Failed to create report." });
    }
  };

  const statusBadge = (status: ReportStatus) => {
    if (status === "Complete") return "bg-primary text-primary-foreground";
    return "bg-amber-200 text-amber-900";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Strategic insights + performance narratives
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-2xl shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Create Report
        </Button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search reports by title, client, status..."
            className="h-10 rounded-2xl bg-white/70 pl-9"
          />
        </div>
        
        {params.get("clientId") && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20 gap-1 px-3 py-1">
              <Filter className="h-3 w-3" />
              {clientMap.get(params.get("clientId")!)?.name}
              <button onClick={() => {
                params.delete("clientId");
                setParams(params);
              }} className="ml-1 hover:text-primary/70">
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/70 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Report Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((r) => (
              <TableRow key={r.id} className="hover:bg-white/60 group">
                <TableCell className="pl-6">
                  <Link to={`/reports/${r.id}`} className="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    <span className="font-medium">{r.title}</span>
                  </Link>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{r.reportType}</div>
                </TableCell>
                <TableCell>
                  <Link to={`/clients/${r.clientId}`} className="hover:underline">
                    {clientMap.get(r.clientId)?.name ?? "—"}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">
                  {r.reportingPeriod || "—"}
                </TableCell>
                <TableCell>
                  <Badge className={cn("rounded-full", statusBadge(r.status))}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(r.updatedAt)}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex justify-end gap-2">
                    <SoftButton
                      className="h-8 rounded-xl bg-white"
                      onClick={() => {
                        const dupe = duplicateReport(r.id);
                        if (dupe) toast({ title: "Report duplicated." });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
                    </SoftButton>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-xl"
                      onClick={() => {
                        if (!confirm(`Delete report "${r.title}"?`)) return;
                        deleteReport(r.id);
                        toast({ title: "Report deleted." });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filteredReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">No reports found</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {query ? "Try a different search query." : "Start by creating your first report from a template."}
                    </div>
                    {!query && (
                      <Button onClick={() => setOpen(true)} className="mt-4 rounded-2xl">
                        <Plus className="mr-2 h-4 w-4" /> Create report
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Report</DialogTitle>
            <DialogDescription>
              Select a client and a report template to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client-select">Client</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="h-11 w-full justify-between rounded-2xl bg-white/70 font-normal"
                  >
                    {selectedClientId
                      ? activeClients.find((c) => c.id === selectedClientId)?.name
                      : "Search for a client..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 rounded-2xl" align="start">
                  <Command className="rounded-2xl">
                    <CommandInput placeholder="Type client name..." />
                    <CommandList>
                      <CommandEmpty>No client found.</CommandEmpty>
                      <CommandGroup>
                        {activeClients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => {
                              setSelectedClientId(client.id);
                              setComboboxOpen(false);
                            }}
                            className="rounded-xl mx-1"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-primary",
                                selectedClientId === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {client.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="template-select">Report Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="template-select" className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {data.fullTemplates.filter(t => !t.archived).map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-[10px] text-muted-foreground">{t.sectionTemplateIds.length} sections</span>
                      </div>
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
            <Button 
              className="rounded-2xl" 
              onClick={handleCreate}
              disabled={!selectedClientId || !selectedTemplateId}
            >
              Start Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}