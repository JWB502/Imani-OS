import * as React from "react";
import type { PdfExportOptions } from "@/types/imani";

interface PdfPreviewMockProps {
  options: PdfExportOptions;
  agencyName: string;
  clientName: string;
  reportTitle: string;
}

export function PdfPreviewMock({
  options,
  agencyName,
  clientName,
  reportTitle,
}: PdfPreviewMockProps) {
  return (
    <div className="relative aspect-[1/1.414] w-full max-w-[300px] overflow-hidden rounded-xl border border-border bg-white shadow-lg">
      {/* Header */}
      {options.showHeader && (
        <div className="absolute left-0 right-0 top-0 flex h-12 items-center justify-between border-b border-slate-100 px-4 text-[10px] text-slate-400">
          <div className="flex flex-col">
            {options.showAgencyName && <span className="font-semibold text-slate-500 uppercase tracking-wider">{agencyName}</span>}
            {options.showClientName && <span>{clientName}</span>}
          </div>
          {options.showReportTitle && <div className="max-w-[100px] truncate">{reportTitle}</div>}
        </div>
      )}

      {/* Content Mock */}
      <div className="mt-16 space-y-4 px-6">
        <div className="h-4 w-3/4 rounded bg-slate-100" />
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-slate-50" />
          <div className="h-2 w-full rounded bg-slate-50" />
          <div className="h-2 w-5/6 rounded bg-slate-50" />
        </div>
        <div className="h-24 w-full rounded-lg bg-slate-50/50 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300">
          Workspace Content
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-slate-50" />
          <div className="h-2 w-2/3 rounded bg-slate-50" />
        </div>
      </div>

      {/* Footer */}
      {options.showFooter && (
        <div className="absolute bottom-0 left-0 right-0 flex h-10 items-center justify-between border-t border-slate-100 px-4 text-[10px] text-slate-400">
          <div>{options.showDate && <span>March 2026</span>}</div>
          <div>{options.showPageNumbers && <span>Page 1 of 12</span>}</div>
        </div>
      )}
    </div>
  );
}
