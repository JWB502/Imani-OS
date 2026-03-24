import * as React from "react";

import { PdfPageViewer } from "@/components/documents/PdfPageViewer";
import { RichTextRenderer } from "@/components/editor/RichTextRenderer";
import { flattenReportPagesForExport, replaceDocumentBlockPlaceholders } from "@/lib/documentExport";
import { cn } from "@/lib/utils";
import type { AppSettings, Client, DocumentBlock, PdfExportOptions, Report } from "@/types/imani";

const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  showHeader: true,
  showFooter: true,
  showPageNumbers: true,
  showDate: true,
  showAgencyName: true,
  showClientName: true,
  showReportTitle: true,
};

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#dbe9f1]">
      <div className="h-full rounded-full bg-[#2f82ff]" style={{ width: `${pct}%` }} />
    </div>
  );
}

function BlockPrint({ block }: { block: DocumentBlock }) {
  if (block.type === "paragraph" || block.type === "heading") {
    return <RichTextRenderer doc={block.props.content} className="text-[13px] leading-6" />;
  }

  if (block.type === "toggle") {
    return (
      <div className="rounded-2xl border border-[#dbe9f1] bg-white p-4">
        <div className="text-sm font-semibold text-[#113049]">{block.props.title}</div>
        <div className="mt-2">
          <RichTextRenderer doc={block.props.content} className="text-[13px] leading-6" />
        </div>
      </div>
    );
  }

  if (block.type === "callout") {
    const toneClass =
      block.props.tone === "success"
        ? "bg-emerald-50 border-emerald-200"
        : block.props.tone === "warning"
          ? "bg-amber-50 border-amber-200"
          : block.props.tone === "danger"
            ? "bg-rose-50 border-rose-200"
            : "bg-sky-50 border-sky-200";

    return (
      <div className={cn("rounded-2xl border p-4", toneClass)}>
        <div className="text-sm font-semibold text-[#113049]">{block.props.title}</div>
        <div className="mt-2">
          <RichTextRenderer doc={block.props.content} className="text-[13px] leading-6" />
        </div>
      </div>
    );
  }

  if (block.type === "checklist") {
    return (
      <div className="space-y-2 text-sm">
        {block.props.items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <div className={cn("mt-1 h-4 w-4 rounded-[6px] border", item.checked ? "border-[#2f82ff] bg-[#2f82ff]" : "border-[#b7cad8] bg-white")} />
            <span>{item.text || "—"}</span>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "status") {
    return <div className="inline-flex rounded-full bg-[#edf5ff] px-3 py-1 text-sm font-medium text-[#113049]">{block.props.value || "—"}</div>;
  }

  if (block.type === "score") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>{block.props.value} / {block.props.max}</span>
          <span className="text-[#5b7285]">Score</span>
        </div>
        <ProgressBar value={block.props.value} max={block.props.max} />
        {block.props.note ? <div className="text-sm text-[#5b7285]">{block.props.note}</div> : null}
      </div>
    );
  }

  if (block.type === "progress") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>{block.props.value}%</span>
          <span className="text-[#5b7285]">Progress</span>
        </div>
        <ProgressBar value={block.props.value} max={block.props.max} />
      </div>
    );
  }

  if (block.type === "kpiGrid") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {block.props.items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[#dbe9f1] bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[#5b7285]">KPI</div>
            <div className="mt-2 text-sm font-semibold text-[#113049]">{item.name || "—"}</div>
            <div className="mt-1 text-lg font-semibold">{item.value || "—"}{item.unit ? ` ${item.unit}` : ""}</div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#dbe9f1]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#edf5ff] text-[#113049]">
            <tr>
              {block.props.columns.map((column, index) => (
                <th key={`${column}-${index}`} className="border-b border-[#dbe9f1] px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.24em]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.props.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b border-[#dbe9f1] px-3 py-2 align-top">
                    {cell || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "media") {
    return (
      <div>
        <img
          src={block.props.url}
          alt={block.props.caption || block.label || "Media"}
          className={cn(
            "rounded-2xl border border-[#dbe9f1]",
            block.props.fit === "cover" ? "object-cover" : "object-contain",
          )}
          style={{ width: `${Math.max(30, Math.min(100, block.props.widthPct ?? 100))}%` }}
        />
        {block.props.caption ? <div className="mt-2 text-xs text-[#5b7285]">{block.props.caption}</div> : null}
      </div>
    );
  }

  if (block.type === "divider") {
    return <div className="border-t border-dashed border-[#b7cad8]" />;
  }

  return null;
}

export function ReportPrintView({
  report,
  client,
  settings,
}: {
  report: Report;
  client: Client;
  settings: AppSettings;
}) {
  const options = report.pdfExportOptions ?? DEFAULT_PDF_OPTIONS;

  const flattenedPages = flattenReportPagesForExport(report.pages).map((page) => ({
    ...page,
    blocks: page.blocks.map((block) => replaceDocumentBlockPlaceholders(block, report, client)),
  }));

  // We add a class for PDF selection and ensure fixed height for 1:1 preview.
  const pageClass = "pdf-page-wrapper w-[816px] h-[1056px] bg-white p-[54px] shadow-2xl mx-auto mb-10 overflow-hidden relative flex flex-col";

  return (
    <div className="bg-[#f0f4f8] py-12">
      {/* Cover/Summary Page */}
      <div className={pageClass}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2f82ff]">{settings.agencyName}</div>
            <div className="mt-3 text-4xl font-semibold tracking-tight leading-[1.15]">{report.title}</div>
            <div className="mt-3 text-sm text-[#5b7285]">
              {client.name}
              {report.reportingPeriod ? ` • ${report.reportingPeriod}` : ""}
              {report.analyst ? ` • ${report.analyst}` : ""}
            </div>
          </div>
          <div className="rounded-[28px] bg-[#2f82ff] px-5 py-4 text-sm font-semibold text-white shrink-0">{report.status}</div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-5">
          <div className="rounded-[28px] border border-[#dbe9f1] bg-[#edf5ff] p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-[#5b7285]">Prepared for</div>
            <div className="mt-2 text-xl font-semibold">{client.name}</div>
            <div className="mt-2 text-sm text-[#5b7285]">{[client.city, client.state].filter(Boolean).join(", ") || "—"}</div>
          </div>
          <div className="rounded-[28px] border border-[#dbe9f1] bg-white p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-[#5b7285]">Document details</div>
            <div className="mt-2 space-y-1 text-sm">
              <div><span className="font-semibold">Type:</span> {report.reportType}</div>
              <div><span className="font-semibold">Created:</span> {new Date(report.createdAt).toLocaleDateString()}</div>
              <div><span className="font-semibold">Pages:</span> {flattenedPages.length}</div>
            </div>
          </div>
        </div>

        {report.executiveSummary ? (
          <div className="mt-10 rounded-[28px] border border-[#dbe9f1] bg-white p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-[#5b7285]">Executive summary</div>
            <div className="mt-3 whitespace-pre-wrap text-[13px] leading-6 line-clamp-[12]">{report.executiveSummary}</div>
          </div>
        ) : null}

        {report.nextSteps ? (
          <div className="mt-6 rounded-[28px] border border-[#dbe9f1] bg-white p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-[#5b7285]">Next steps</div>
            <div className="mt-3 whitespace-pre-wrap text-[13px] leading-6 line-clamp-6">{report.nextSteps}</div>
          </div>
        ) : null}
      </div>

      {/* Dynamic Content Pages */}
      {flattenedPages.map((page, pageIndex) => (
        <div key={page.id} className={pageClass}>
          {options.showHeader && (
            <div className="mb-4 flex items-center justify-between border-b border-[#dbe9f1] pb-3 text-[10px] text-[#5b7285] h-8 shrink-0">
              <div className="flex flex-col">
                {options.showAgencyName && <span className="font-semibold uppercase tracking-widest text-[#2f82ff]">{settings.agencyName}</span>}
                {options.showClientName && <span>{client.name}</span>}
              </div>
              {options.showReportTitle && <div className="max-w-[200px] truncate">{report.title}</div>}
            </div>
          )}

          <div className="flex-1 overflow-hidden relative">
            {page.isPdf && page.pdfData ? (
              <div className="h-full">
                <PdfPageViewer pdfData={page.pdfData} />
              </div>
            ) : (
              <>
                {page.coverUrl && (
                  <div className="mb-6 h-40 w-full overflow-hidden rounded-2xl border border-[#dbe9f1] shrink-0">
                    <img 
                      src={page.coverUrl} 
                      alt="" 
                      className="h-full w-full object-cover" 
                      style={{ objectPosition: page.coverImagePosition || 'center' }}
                    />
                  </div>
                )}
                <div className="text-2xl font-semibold tracking-tight shrink-0">{page.title}</div>
                <div className="mt-6 space-y-5">
                  {page.blocks.map((block) => (
                    <div key={block.id} className="break-inside-avoid rounded-[28px] border border-[#dbe9f1] bg-white p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
                      {block.label ? <div className="mb-3 text-[10px] uppercase tracking-[0.24em] font-black text-[#5b7285]">{block.label}</div> : null}
                      <BlockPrint block={block} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {options.showFooter && (
            <div className="mt-8 flex items-center justify-between border-t border-[#dbe9f1] pt-4 text-[10px] text-[#5b7285] h-8 shrink-0">
              <div>{options.showDate && <span>{new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>}</div>
              <div>{options.showPageNumbers && <span>Page {pageIndex + 1} of {flattenedPages.length}</span>}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
