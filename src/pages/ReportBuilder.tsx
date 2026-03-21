import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Copy, Download, Eye, Trash2 } from "lucide-react";

import { SoftButton } from "@/components/app/SoftButton";
import { DocumentStatusBadge, DocumentToolbar } from "@/components/documents/DocumentToolbar";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";
import { ReportPrintView } from "@/components/reports/ReportPrintView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { exportElementToPdf } from "@/lib/pdf";

export default function ReportBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { data, duplicateReport, updateReport, deleteReport } = useData();

  const report = data.reports.find((item) => item.id === id);
  const client = report ? data.clients.find((item) => item.id === report.clientId) : undefined;
  const reusableFragments = data.documentTemplates.filter((item) => item.kind === "fragment" && !item.archived);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const printHostRef = React.useRef<HTMLDivElement | null>(null);

  if (!report || !client) {
    return (
      <div className="rounded-[32px] border border-border/70 bg-white/75 p-8 shadow-sm">
        <div className="text-lg font-semibold">Report not found</div>
        <div className="mt-2 text-sm text-muted-foreground">It may have been deleted or the client reference is missing.</div>
        <Button asChild className="mt-4 rounded-2xl">
          <Link to="/reports">Back to reports</Link>
        </Button>
      </div>
    );
  }

  async function exportPdf() {
    const host = printHostRef.current;
    const element = host?.querySelector("[data-print-root='true']") as HTMLElement | null;
    if (!element) return;

    toast({ title: "Generating PDF…" });
    await exportElementToPdf({
      element,
      fileName: `${client.name} — ${report.title}.pdf`,
      pageNumbers: report.pdfPageNumbers ?? settings.pdfPageNumbers,
    });
  }

  return (
    <div className="space-y-6">
      <DocumentWorkspace
        pages={report.pages}
        reusableFragments={reusableFragments}
        onChangePages={(pages) => updateReport(report.id, { pages })}
        topSlot={
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <SoftButton asChild className="rounded-2xl">
                <Link to="/reports">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to reports
                </Link>
              </SoftButton>
            </div>

            <DocumentToolbar
              eyebrow={`Report workspace • ${client.name}`}
              title={report.title}
              description="Reports now share the same page-tree and block editing model as templates. Export rendering follows the flattened page order shown in preview."
              warnings={report.migrationWarnings}
              badges={
                <>
                  <DocumentStatusBadge label={report.status} tone={report.status === "Complete" ? "success" : "warning"} />
                  <DocumentStatusBadge label={report.templateSourceId ? "Detached copy" : "Standalone document"} tone="muted" />
                  {report.legacySourceType ? <DocumentStatusBadge label={`Migrated from ${report.legacySourceType}`} tone="muted" /> : null}
                </>
              }
              actions={
                <>
                  <Button variant="outline" className="rounded-2xl" onClick={() => setPreviewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" /> Export preview
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={exportPdf}>
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => {
                      const duplicate = duplicateReport(report.id);
                      if (!duplicate) return;
                      toast({ title: "Report duplicated." });
                      navigate(`/reports/${duplicate.id}`);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                  </Button>
                  <Button
                    className="rounded-2xl"
                    onClick={() => updateReport(report.id, { status: report.status === "Complete" ? "Draft" : "Complete" })}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {report.status === "Complete" ? "Mark draft" : "Mark complete"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-2xl"
                    onClick={() => {
                      if (!confirm(`Delete “${report.title}”?`)) return;
                      deleteReport(report.id);
                      navigate("/reports");
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </>
              }
            />

            <Card className="rounded-[32px] border-border/70 bg-white/75 shadow-sm">
              <CardContent className="grid gap-4 p-5 xl:grid-cols-2">
                <div className="space-y-2 xl:col-span-2">
                  <Label>Report title</Label>
                  <Input value={report.title} onChange={(event) => updateReport(report.id, { title: event.target.value })} className="h-11 rounded-2xl bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Report type</Label>
                  <Input value={report.reportType} onChange={(event) => updateReport(report.id, { reportType: event.target.value })} className="h-11 rounded-2xl bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Reporting period</Label>
                  <Input value={report.reportingPeriod ?? ""} onChange={(event) => updateReport(report.id, { reportingPeriod: event.target.value })} className="h-11 rounded-2xl bg-white" placeholder="Q1 2026" />
                </div>
                <div className="space-y-2">
                  <Label>Analyst</Label>
                  <Input value={report.analyst ?? ""} onChange={(event) => updateReport(report.id, { analyst: event.target.value })} className="h-11 rounded-2xl bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={report.status} onValueChange={(status) => updateReport(report.id, { status: status as any })}>
                    <SelectTrigger className="h-11 rounded-2xl bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-[28px] border border-border/70 bg-muted/20 p-4 xl:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">PDF page numbers</div>
                      <div className="text-sm text-muted-foreground">Keep header/footer metadata and page numbering in export output.</div>
                    </div>
                    <Switch
                      checked={report.pdfPageNumbers ?? settings.pdfPageNumbers}
                      onCheckedChange={(checked) => updateReport(report.id, { pdfPageNumbers: checked })}
                    />
                  </div>
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label>Executive summary</Label>
                  <Textarea value={report.executiveSummary ?? ""} onChange={(event) => updateReport(report.id, { executiveSummary: event.target.value })} className="min-h-28 rounded-2xl bg-white" placeholder="Decision-ready summary" />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label>Next steps</Label>
                  <Textarea value={report.nextSteps ?? ""} onChange={(event) => updateReport(report.id, { nextSteps: event.target.value })} className="min-h-24 rounded-2xl bg-white" placeholder="Recommended actions, CTA, or delivery notes" />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label>Internal notes</Label>
                  <Textarea value={report.internalNotes ?? ""} onChange={(event) => updateReport(report.id, { internalNotes: event.target.value })} className="min-h-24 rounded-2xl bg-white" placeholder="Internal-only context" />
                </div>
              </CardContent>
            </Card>
          </div>
        }
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-[92vw] overflow-auto rounded-[32px] bg-[#edf5ff] p-4 lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Export preview</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto rounded-[28px] border border-border/70 bg-[#edf5ff] p-4">
            <ReportPrintView report={report} client={client} settings={settings} />
          </div>
        </DialogContent>
      </Dialog>

      <div className="absolute left-[-10000px] top-0" ref={printHostRef}>
        <div data-print-root="true">
          <ReportPrintView report={report} client={client} settings={settings} />
        </div>
      </div>
    </div>
  );
}
