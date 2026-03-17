import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  FileText,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { SoftButton, SoftIconButton } from "@/components/app/SoftButton";
import { ReportPrintView } from "@/components/reports/ReportPrintView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { runOpenAiChat } from "@/lib/ai";
import { exportElementToPdf } from "@/lib/pdf";
import { clamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createId } from "@/lib/id";
import { sanitizeForAI } from "@/lib/privacy";
import type {
  ChecklistItem,
  KPIItem,
  Report,
  ReportSection,
  SectionBlock,
} from "@/types/imani";

function replaceToken(s: string, token: string, value: string) {
  return s.split(token).join(value);
}

function replacePlaceholders(text: string, report: Report, clientName: string) {
  let out = text;
  out = replaceToken(out, "{{Client Name}}", clientName);
  out = replaceToken(out, "{{Report Title}}", report.title);
  out = replaceToken(out, "{{Report Period}}", report.reportingPeriod ?? "");
  out = replaceToken(out, "{{Date}}", new Date().toLocaleDateString());
  out = replaceToken(out, "{{Analyst Name}}", report.analyst ?? "");
  return out;
}

function BlockCard({
  block,
  onChange,
  onRemove,
  clientName,
  report,
}: {
  block: SectionBlock;
  onChange: (next: SectionBlock) => void;
  onRemove: () => void;
  clientName: string;
  report: Report;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Label className="text-xs text-muted-foreground">{block.type}</Label>
          <Input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value } as any)}
            className="mt-1 h-10 rounded-2xl bg-white/70"
            placeholder="Block label"
          />
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="mt-5 h-10 w-10 rounded-2xl"
          onClick={onRemove}
          aria-label="Remove block"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {block.type === "richText" ? (
        <div className="mt-3">
          <Textarea
            value={block.content}
            onChange={(e) =>
              onChange({ ...block, content: e.target.value } as SectionBlock)
            }
            className="min-h-28 rounded-2xl bg-white/70"
            placeholder="Write findings, notes, narrative…"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            Placeholders supported:{" "}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">
              {"{{Client Name}}"}
            </code>
            ,{" "}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">
              {"{{Report Period}}"}
            </code>
            ,{" "}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">
              {"{{Analyst Name}}"}
            </code>
          </div>
          <div className="mt-2 rounded-2xl border border-border/70 bg-white p-3">
            <div className="text-xs font-medium text-muted-foreground">Preview</div>
            <div className="mt-1 whitespace-pre-wrap text-sm">
              {replacePlaceholders(block.content, report, clientName) || "—"}
            </div>
          </div>
        </div>
      ) : null}

      {block.type === "checklist" ? (
        <div className="mt-3 space-y-2">
          {block.items.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <Switch
                checked={it.checked}
                onCheckedChange={(checked) => {
                  const items = block.items.map((x) =>
                    x.id === it.id ? { ...x, checked } : x,
                  );
                  onChange({ ...block, items } as any);
                }}
              />
              <Input
                value={it.text}
                onChange={(e) => {
                  const items = block.items.map((x) =>
                    x.id === it.id ? { ...x, text: e.target.value } : x,
                  );
                  onChange({ ...block, items } as any);
                }}
                className="h-10 rounded-2xl bg-white/70"
              />
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-white"
                onClick={() => {
                  const items = block.items.filter((x) => x.id !== it.id);
                  onChange({ ...block, items } as any);
                }}
                aria-label="Remove checklist item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            className="rounded-2xl bg-white"
            onClick={() =>
              onChange({
                ...block,
                items: [
                  ...block.items,
                  { id: createId("chk"), text: "", checked: false },
                ],
              } as any)
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add item
          </Button>
        </div>
      ) : null}

      {block.type === "score" ? (
        <div className="mt-3">
          <div className="flex items-end justify-between">
            <div className="text-sm font-medium">Score</div>
            <div className="text-sm text-muted-foreground">
              {block.value} / {block.max}
            </div>
          </div>
          <Slider
            value={[block.value]}
            min={0}
            max={block.max}
            step={1}
            className="mt-3"
            onValueChange={(v) =>
              onChange({ ...block, value: clamp(v[0] ?? 0, 0, block.max) } as any)
            }
          />
          <Textarea
            value={block.note ?? ""}
            onChange={(e) => onChange({ ...block, note: e.target.value } as any)}
            className="mt-3 min-h-20 rounded-2xl bg-white/70"
            placeholder="Optional note about the score…"
          />
        </div>
      ) : null}

      {block.type === "kpi" ? (
        <div className="mt-3 space-y-2">
          {block.items.map((it) => (
            <div key={it.id} className="grid grid-cols-12 gap-2">
              <Input
                value={it.name}
                onChange={(e) => {
                  const items = block.items.map((x) =>
                    x.id === it.id ? ({ ...x, name: e.target.value } as KPIItem) : x,
                  );
                  onChange({ ...block, items } as any);
                }}
                className="col-span-5 h-10 rounded-2xl bg-white/70"
                placeholder="KPI"
              />
              <Input
                value={it.value}
                onChange={(e) => {
                  const items = block.items.map((x) =>
                    x.id === it.id ? ({ ...x, value: e.target.value } as KPIItem) : x,
                  );
                  onChange({ ...block, items } as any);
                }}
                className="col-span-4 h-10 rounded-2xl bg-white/70"
                placeholder="Value"
              />
              <Input
                value={it.unit ?? ""}
                onChange={(e) => {
                  const items = block.items.map((x) =>
                    x.id === it.id ? ({ ...x, unit: e.target.value } as KPIItem) : x,
                  );
                  onChange({ ...block, items } as any);
                }}
                className="col-span-2 h-10 rounded-2xl bg-white/70"
                placeholder="Unit"
              />
              <Button
                variant="secondary"
                size="icon"
                className="col-span-1 h-10 w-10 rounded-2xl bg-white"
                onClick={() => {
                  const items = block.items.filter((x) => x.id !== it.id);
                  onChange({ ...block, items } as any);
                }}
                aria-label="Remove KPI"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            className="rounded-2xl bg-white"
            onClick={() =>
              onChange({
                ...block,
                items: [
                  ...block.items,
                  { id: createId("kpi"), name: "", value: "" },
                ],
              } as any)
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add KPI
          </Button>
        </div>
      ) : null}

      {block.type === "image" ? (
        <div className="mt-3 space-y-2">
          <Input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value } as any)}
            className="h-10 rounded-2xl bg-white/70"
            placeholder="Image URL (screenshot, chart, etc.)"
          />
          <Input
            value={block.caption ?? ""}
            onChange={(e) =>
              onChange({ ...block, caption: e.target.value } as any)
            }
            className="h-10 rounded-2xl bg-white/70"
            placeholder="Caption (optional)"
          />
          {block.url ? (
            <img
              src={block.url}
              alt={block.caption || block.label}
              className="mt-2 max-h-72 w-full rounded-2xl object-cover ring-1 ring-border/60"
            />
          ) : null}
        </div>
      ) : null}

      {block.type === "table" ? (
        <div className="mt-3 space-y-2">
          <Input
            value={block.columns.join(", ")}
            onChange={(e) =>
              onChange({
                ...block,
                columns: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              } as any)
            }
            className="h-10 rounded-2xl bg-white/70"
            placeholder="Columns (comma-separated)"
          />
          <Textarea
            value={block.rows.map((r) => r.join(" | ")).join("\n")}
            onChange={(e) => {
              const rows = e.target.value
                .split("\n")
                .map((line) =>
                  line
                    .split("|")
                    .map((s) => s.trim())
                    .filter((v) => v.length > 0),
                )
                .filter((r) => r.length > 0);
              onChange({ ...block, rows } as any);
            }}
            className="min-h-28 rounded-2xl bg-white/70"
            placeholder="Rows (one per line, use | between cells)"
          />
          <div className="text-xs text-muted-foreground">
            Example: <span className="font-mono">Competitor | Strength | Gap</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildBlock(type: SectionBlock["type"]): SectionBlock {
  switch (type) {
    case "richText":
      return {
        id: createId("blk"),
        type,
        label: "Narrative",
        content: "",
      };
    case "checklist":
      return {
        id: createId("blk"),
        type,
        label: "Checklist",
        items: [{ id: createId("chk"), text: "", checked: false }],
      };
    case "score":
      return { id: createId("blk"), type, label: "Score", value: 50, max: 100 };
    case "kpi":
      return {
        id: createId("blk"),
        type,
        label: "KPIs",
        items: [{ id: createId("kpi"), name: "", value: "" }],
      };
    case "table":
      return { id: createId("blk"), type, label: "Table", columns: [""], rows: [] };
    case "image":
      return { id: createId("blk"), type, label: "Screenshot", url: "" };
  }
}

export default function ReportBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data,
    duplicateReport,
    updateReport,
    deleteReport,
    updateReportSection,
    reorderReportSections,
  } = useData();
  const { settings } = useSettings();

  const report = data.reports.find((r) => r.id === id);
  const client = report ? data.clients.find((c) => c.id === report.clientId) : undefined;

  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiMode, setAiMode] = React.useState<
    "executive" | "recommendations" | "rewrite"
  >("executive");
  const [aiInput, setAiInput] = React.useState("");
  const [aiOutput, setAiOutput] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  const printHostRef = React.useRef<HTMLDivElement | null>(null);

  if (!report || !client) {
    return (
      <div className="rounded-3xl border border-border/70 bg-white/70 p-8">
        <div className="text-lg font-semibold">Report not found</div>
        <div className="mt-2 text-sm text-muted-foreground">
          It may have been deleted.
        </div>
        <Button asChild className="mt-4 rounded-2xl">
          <Link to="/reports">Back to Reports</Link>
        </Button>
      </div>
    );
  }

  function onReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = report.sections.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    reorderReportSections(report.id, next.map((s) => s.id));
  }

  async function runAi() {
    const key = settings.aiProvider === "openrouter" ? settings.openRouterApiKey : settings.openAiApiKey;
    if (!key) {
      toast({ title: `Add your ${settings.aiProvider === "openrouter" ? "Open Router" : "OpenAI"} API key in Settings to use AI tools.` });
      return;
    }

    setAiLoading(true);
    setAiOutput("");

    try {
      const system =
        "You are an agency analyst writing strategic, practical reporting language. Be concise, confident, and specific. Use bullets when helpful.";

      const stitched = report.sections
        .map((s) => {
          const rich = s.blocks
            .filter((b) => b.type === "richText")
            .map((b) => `${b.label}: ${(b as any).content}`)
            .join("\n");
          return `## ${s.title}\n${rich}`;
        })
        .join("\n\n");

      const prompt =
        aiMode === "executive"
          ? `Create an executive summary for this internal agency report. Client: ${client.name}. Period: ${report.reportingPeriod ?? ""}.\n\nContent:\n${stitched}\n\nOutput: a polished executive summary (short paragraphs + 4–8 bullets).`
          : aiMode === "recommendations"
            ? `Based on this report content, draft practical recommendations for the next 30–90 days. Client: ${client.name}.\n\nContent:\n${stitched}\n\nOutput: priority-ordered bullets with brief rationale.`
            : `Rewrite the following notes into professional client-facing report language. Keep meaning, improve clarity, tighten sentences.\n\nRaw notes:\n${aiInput}`;

      const sanitizedPrompt = sanitizeForAI({ report, client, settings, prompt });

      const out = await runOpenAiChat({
        apiKey: settings.aiProvider === "openrouter" ? settings.openRouterApiKey! : settings.openAiApiKey,
        model: settings.openAiModel,
        provider: settings.aiProvider,
        system,
        user: sanitizedPrompt,
      });

      setAiOutput(out);

      if (aiMode === "executive") {
        updateReport(report.id, { executiveSummary: out });
        toast({ title: "Executive summary drafted and saved." });
      }

      if (aiMode === "recommendations") {
        updateReport(report.id, { nextSteps: out });
        toast({ title: "Recommendations drafted and saved." });
      }
    } catch (e: any) {
      toast({
        title: "AI request failed",
        description: String(e?.message ?? e),
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function exportPdf() {
    const host = printHostRef.current;
    const el = host?.querySelector("[data-print-root='true']") as HTMLElement | null;
    if (!el) return;

    toast({ title: "Generating PDF…" });
    await exportElementToPdf({
      element: el,
      fileName: `${client.name} — ${report.title}.pdf`,
      pageNumbers: report.pdfPageNumbers ?? settings.pdfPageNumbers,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted-foreground">
            Report builder • {client.name}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {report.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-2xl border-border bg-white shadow-sm hover:bg-slate-50"
            onClick={() => setAiOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4 text-primary" /> AI assist
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-border bg-white shadow-sm hover:bg-slate-50"
            onClick={() => {
              const dupe = duplicateReport(report.id);
              if (!dupe) return;
              toast({ title: "Report duplicated." });
              navigate(`/reports/${dupe.id}`);
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-border bg-white shadow-sm hover:bg-slate-50"
            onClick={exportPdf}
          >
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button
            className={cn(
              "rounded-2xl",
              report.status === "Complete" &&
                "bg-[color:var(--im-navy)] text-white hover:bg-[color:var(--im-navy)]/90",
            )}
            onClick={() =>
              updateReport(report.id, {
                status: report.status === "Complete" ? "Draft" : "Complete",
              })
            }
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {report.status === "Complete" ? "Mark draft" : "Mark complete"}
          </Button>
          <Button
            variant="destructive"
            className="rounded-2xl"
            onClick={() => {
              if (!confirm(`Delete report "${report.title}"?`)) return;
              deleteReport(report.id);
              navigate("/reports");
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: outline */}
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Outline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.sections.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.blocks.length} blocks
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <SoftIconButton
                    size="icon"
                    className="h-9 w-9 rounded-2xl bg-white"
                    onClick={() => onReorder(idx, Math.max(0, idx - 1))}
                    aria-label="Move up"
                  >
                    <GripVertical className="h-4 w-4" />
                  </SoftIconButton>
                  <SoftIconButton
                    size="icon"
                    className="h-9 w-9 rounded-2xl bg-white"
                    onClick={() =>
                      onReorder(idx, Math.min(report.sections.length - 1, idx + 1))
                    }
                    aria-label="Move down"
                  >
                    <GripVertical className="h-4 w-4" />
                  </SoftIconButton>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Center: content */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Report metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label>Title</Label>
                <Input
                  value={report.title}
                  onChange={(e) => updateReport(report.id, { title: e.target.value })}
                  className="h-11 rounded-2xl bg-white/70"
                />
              </div>
              <div className="grid gap-2">
                <Label>Report type</Label>
                <Input
                  value={report.reportType}
                  onChange={(e) => updateReport(report.id, { reportType: e.target.value })}
                  className="h-11 rounded-2xl bg-white/70"
                />
              </div>
              <div className="grid gap-2">
                <Label>Reporting period</Label>
                <Input
                  value={report.reportingPeriod ?? ""}
                  onChange={(e) =>
                    updateReport(report.id, { reportingPeriod: e.target.value })
                  }
                  className="h-11 rounded-2xl bg-white/70"
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="grid gap-2">
                <Label>Analyst</Label>
                <Input
                  value={report.analyst ?? ""}
                  onChange={(e) => updateReport(report.id, { analyst: e.target.value })}
                  className="h-11 rounded-2xl bg-white/70"
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={report.status}
                  onValueChange={(v) => updateReport(report.id, { status: v as any })}
                >
                  <SelectTrigger className="h-11 rounded-2xl bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4 md:col-span-2 rounded-2xl border border-border/60 bg-white/70 px-4 py-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show PDF Page Numbers</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle page numbers for this specific report's export.
                  </p>
                </div>
                <Switch
                  checked={report.pdfPageNumbers ?? settings.pdfPageNumbers}
                  onCheckedChange={(checked) => updateReport(report.id, { pdfPageNumbers: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Executive summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={report.executiveSummary ?? ""}
                onChange={(e) =>
                  updateReport(report.id, { executiveSummary: e.target.value })
                }
                className="min-h-28 rounded-2xl bg-white/70"
                placeholder="Decision-ready summary (or use AI assist)…"
              />
              <div className="mt-2 text-xs text-muted-foreground">Autosaved.</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.sections.map((s) => (
                <SectionEditor
                  key={s.id}
                  report={report}
                  section={s}
                  clientName={client.name}
                  onChange={(patch) => updateReportSection(report.id, s.id, patch)}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Optional next steps / CTA</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={report.nextSteps ?? ""}
                onChange={(e) => updateReport(report.id, { nextSteps: e.target.value })}
                className="min-h-24 rounded-2xl bg-white/70"
                placeholder="Optional CTA or next-step section…"
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Internal notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={report.internalNotes ?? ""}
                onChange={(e) =>
                  updateReport(report.id, { internalNotes: e.target.value })
                }
                className="min-h-24 rounded-2xl bg-white/70"
                placeholder="Internal-only context, to-dos, friction…"
              />
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            PDFs are generated in letter-size portrait with section page breaks.
          </div>
        </div>
      </div>

      {/* Offscreen print host */}
      <div className="absolute left-[-10000px] top-0" ref={printHostRef}>
        <div data-print-root="true">
          <ReportPrintView report={report} client={client} settings={settings} />
        </div>
      </div>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-3xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">AI assistance</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-white/70 p-4">
              <div className="text-sm font-medium">Tool</div>
              <div className="mt-3 grid gap-2">
                <Button
                  type="button"
                  variant={aiMode === "executive" ? "default" : "secondary"}
                  className="justify-start rounded-2xl"
                  onClick={() => setAiMode("executive")}
                >
                  Draft executive summary
                </Button>
                <Button
                  type="button"
                  variant={aiMode === "recommendations" ? "default" : "secondary"}
                  className="justify-start rounded-2xl"
                  onClick={() => setAiMode("recommendations")}
                >
                  Draft recommendations (30–90 days)
                </Button>
                <Button
                  type="button"
                  variant={aiMode === "rewrite" ? "default" : "secondary"}
                  className="justify-start rounded-2xl"
                  onClick={() => setAiMode("rewrite")}
                >
                  Rewrite notes into report language
                </Button>
              </div>

              {aiMode === "rewrite" ? (
                <div className="mt-4">
                  <Label>Raw notes</Label>
                  <Textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="mt-2 min-h-32 rounded-2xl bg-white"
                    placeholder="Paste messy notes here…"
                  />
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl bg-[color:var(--im-navy)] p-3 text-xs text-white/85 ring-1 ring-white/10">
                Tip: AI supports the analyst — you're still the final editor.
                <div className="mt-1 text-white/80">PII redaction is applied before sending to AI.</div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Output</div>
                <Button
                  type="button"
                  onClick={runAi}
                  className="rounded-2xl"
                  disabled={aiLoading || (aiMode === "rewrite" && !aiInput.trim())}
                >
                  {aiLoading ? "Generating…" : "Generate"}
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="min-h-48 whitespace-pre-wrap text-sm">
                {aiOutput || (
                  <span className="text-muted-foreground">
                    Generated text will appear here.
                  </span>
                )}
              </div>
              {aiMode === "rewrite" && aiOutput ? (
                <SoftButton
                  type="button"
                  className="mt-3 w-full rounded-2xl bg-white"
                  onClick={() => {
                    navigator.clipboard.writeText(aiOutput);
                    toast({ title: "Copied to clipboard." });
                  }}
                >
                  Copy output
                </SoftButton>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" className="rounded-2xl" onClick={() => setAiOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionEditor({
  report,
  section,
  clientName,
  onChange,
}: {
  report: Report;
  section: ReportSection;
  clientName: string;
  onChange: (patch: Partial<ReportSection>) => void;
}) {
  const [open, setOpen] = React.useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between gap-2 rounded-3xl border border-border/70 bg-white p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-muted-foreground">Section</div>
          <Input
            value={section.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="mt-1 h-10 rounded-2xl bg-white/70"
          />
        </div>
        <CollapsibleTrigger asChild>
          <SoftIconButton size="icon" className="h-10 w-10 rounded-2xl" aria-label="Toggle">
            <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
          </SoftIconButton>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-3 space-y-3">
        {section.blocks.map((b) => (
          <BlockCard
            key={b.id}
            block={b}
            report={report}
            clientName={clientName}
            onChange={(next) =>
              onChange({ blocks: section.blocks.map((x) => (x.id === b.id ? next : x)) })
            }
            onRemove={() => onChange({ blocks: section.blocks.filter((x) => x.id !== b.id) })}
          />
        ))}

        <div className="flex flex-wrap gap-2">
          <SoftButton
            className="rounded-2xl bg-white"
            onClick={() =>
              onChange({ blocks: [...section.blocks, buildBlock("richText")] })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add rich text
          </SoftButton>
          <SoftButton
            className="rounded-2xl bg-white"
            onClick={() =>
              onChange({ blocks: [...section.blocks, buildBlock("checklist")] })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add checklist
          </SoftButton>
          <SoftButton
            className="rounded-2xl bg-white"
            onClick={() => onChange({ blocks: [...section.blocks, buildBlock("kpi")] })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add KPI block
          </SoftButton>
          <SoftButton
            className="rounded-2xl bg-white"
            onClick={() => onChange({ blocks: [...section.blocks, buildBlock("score")] })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add score
          </SoftButton>
          <SoftButton
            className="rounded-2xl bg-white"
            onClick={() => onChange({ blocks: [...section.blocks, buildBlock("image")] })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add image
          </SoftButton>
          <SoftButton
            className="rounded-2xl bg-white"
            onClick={() => onChange({ blocks: [...section.blocks, buildBlock("table")] })}
          >
            <Plus className="mr-2 h-4 w-4" /> Add table
          </SoftButton>
        </div>

        <div className="rounded-3xl border border-border/70 bg-white/70 p-4">
          <div className="text-sm font-medium">Section internal notes</div>
          <Textarea
            value={section.internalNotes ?? ""}
            onChange={(e) => onChange({ internalNotes: e.target.value })}
            className="mt-2 min-h-20 rounded-2xl bg-white/70"
            placeholder="Internal-only notes for this section…"
          />
        </div>

        <Separator />
      </CollapsibleContent>
    </Collapsible>
  );
}