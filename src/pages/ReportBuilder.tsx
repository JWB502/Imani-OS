import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Copy, Download, Eye, Trash2 } from "lucide-react";

import { SoftButton } from "@/components/app/SoftButton";
import { DocumentStatusBadge, DocumentToolbar } from "@/components/documents/DocumentToolbar";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";
import { PdfPreviewMock } from "@/components/reports/PdfPreviewMock";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { exportElementToPdf } from "@/lib/pdf";
import type { PdfExportOptions } from "@/types/imani";

const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  showHeader: true,
  showFooter: true,
  showPageNumbers: true,
  showDate: true,
  showAgencyName: true,
  showClientName: true,
  showReportTitle: true,
};

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

    const options = report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS;

    toast({ title: "Generating PDF…" });
    await exportElementToPdf({
      element,
      fileName: `${client.name} — ${report.title}.pdf`,
      // We disable the jspdf-native page numbering if our DOM-based footer is enabled
      pageNumbers: options.showFooter ? false : (report.pdfPageNumbers ?? settings.pdfPageNumbers),
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

                <div className="rounded-[28px] border border-border/70 bg-white/40 p-5 xl:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold">Export Configuration</div>
                      <div className="text-sm text-muted-foreground">Manage header, footer, and metadata placement.</div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Page Header</Label>
                          <div className="text-xs text-muted-foreground">Include a top metadata bar.</div>
                        </div>
                        <Switch
                          checked={report.pdfExportOptions?.showHeader ?? DEFAULT_PDF_OPTIONS.showHeader}
                          onCheckedChange={(val) => updateReport(report.id, {
                            pdfExportOptions: { ...(report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS), showHeader: val }
                          })}
                        />
                      </div>

                      {(report.pdfExportOptions?.showHeader ?? DEFAULT_PDF_OPTIONS.showHeader) && (
                        <div className="ml-6 grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={report.pdfExportOptions?.showAgencyName ?? DEFAULT_PDF_OPTIONS.showAgencyName}
                              onCheckedChange={(val) => updateReport(report.id, {
                                pdfExportOptions: { ...(report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS), showAgencyName: val }
                              })}
                            />
                            <Label className="text-xs">Agency name</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={report.pdfExportOptions?.showClientName ?? DEFAULT_PDF_OPTIONS.showClientName}
                              onCheckedChange={(val) => updateReport(report.id, {
                                pdfExportOptions: { ...(report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS), showClientName: val }
                              })}
                            />
                            <Label className="text-xs">Client name</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={report.pdfExportOptions?.showReportTitle ?? DEFAULT_PDF_OPTIONS.showReportTitle}
                              onCheckedChange={(val) => updateReport(report.id, {
                                pdfExportOptions: { ...(report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS), showReportTitle: val }
                              })}
                            />
                            <Label className="text-xs">Report title</Label>
                          </div>
                        </div>
                      )}

                      <Separator className="my-2" />

                      <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Page Footer</Label>
                          <div className="text-xs text-muted-foreground">Include a bottom metadata bar.</div>
                        </div>
                        <Switch
                          checked={report.pdfExportOptions?.showFooter ?? DEFAULT_PDF_OPTIONS.showFooter}
                          onCheckedChange={(val) => updateReport(report.id, {
                            pdfExportOptions: { ...(report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS), showFooter: val }
                          })}
                        />
                      </div>

                      {(report.pdfExportOptions?.showFooter ?? DEFAULT_PDF_OPTIONS.showFooter) && (
                        <div className="ml-6 grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={report.pdfExportOptions?.showPageNumbers ?? DEFAULT_PDF_OPTIONS.showPageNumbers}
                              onCheckedChange={(val) => updateReport(report.id, {
                                pdfExportOptions: { ...(report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS), showPageNumbers: val }
                              })}
                            />
                            <Label className="text-xs">Page numbering</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={report.pdfExportOptions?.showDate ?? DEFAULT_PDF_OPTIONS.showDate}
                              onCheckedChange={(val) => updateReport(report.id, {
                                pdfExportOptions: { ...(report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS), showDate: val }
                              })}
                            />
                            <Label className="text-xs">Date</Label>
                          </div>
                        </div>

                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <Label className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Mock Preview</Label>
                      <PdfPreviewMock
                        options={report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS}
                        agencyName={settings.agencyName}
                        clientName={client.name}
                        reportTitle={report.title}
                      />
                    </div>
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
