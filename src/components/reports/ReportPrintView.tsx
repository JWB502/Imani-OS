import * as React from "react";

import { RichTextRenderer } from "@/components/editor/RichTextRenderer";
import { cn } from "@/lib/utils";
import { ensureRichTextDoc, replaceTextInRichDoc } from "@/lib/richText";
import type { AppSettings, Client, Report, SectionBlock } from "@/types/imani";

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

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-[#e6f0f0] overflow-hidden">
      <div
        className="h-2 rounded-full bg-[#26bbc0]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BlockPrint({
  block,
  report,
  client,
}: {
  block: SectionBlock;
  report: Report;
  client: Client;
}) {
  if (block.type === "richText") {
    const doc = replaceTextInRichDoc(ensureRichTextDoc(block.content), (t) =>
      replacePlaceholders(t, report, client.name),
    );

    return <RichTextRenderer doc={doc} className="text-[13px]" />;
  }

  if (block.type === "checklist") {
    return (
      <div className="space-y-1.5 text-sm leading-6">
        {block.items.map((i) => (
          <div key={i.id} className="flex items-start gap-2">
            <div
              className={cn(
                "mt-0.5 h-4 w-4 rounded-[6px] border",
                i.checked ? "border-[#26bbc0] bg-[#26bbc0]" : "border-[#cfe3e3] bg-white",
              )}
            />
            <div className={cn("flex-1", i.checked && "text-[#031111]/80")}>
              {i.text || "—"}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "select") {
    return (
      <div className="text-sm">
        <div className="inline-flex items-center rounded-full bg-[#eefcfc] px-3 py-1 text-[#185391] ring-1 ring-[#cfe3e3]">
          {block.value || "—"}
        </div>
      </div>
    );
  }

  if (block.type === "progress") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="font-medium">{Math.round(block.value)}%</div>
          <div className="text-[#031111]/60">Progress</div>
        </div>
        <ProgressBar value={block.value} max={100} />
      </div>
    );
  }

  if (block.type === "score") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="font-medium">
            {block.value} / {block.max}
          </div>
          <div className="text-[#031111]/60">Score</div>
        </div>
        <ProgressBar value={block.value} max={block.max} />
        {block.note ? (
          <div className="text-sm text-[#031111]/75">{block.note}</div>
        ) : null}
      </div>
    );
  }

  if (block.type === "kpi") {
    return (
      <div className="grid gap-2">
        {block.items.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between rounded-xl border border-[#e6f0f0] bg-white px-3 py-2"
          >
            <div className="text-sm font-medium">{i.name || "—"}</div>
            <div className="text-sm text-[#031111]/80">
              {i.value || "—"}
              {i.unit ? ` ${i.unit}` : ""}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "table") {
    const cols = (block.columns ?? []).filter(Boolean);
    const rows = block.rows ?? [];

    return (
      <div className="overflow-hidden rounded-2xl border border-[#e6f0f0]">
        <table className="w-full border-collapse text-sm">
          {cols.length ? (
            <thead className="bg-[#eefcfc]">
              <tr>
                {cols.map((c, idx) => (
                  <th
                    key={idx}
                    className="border-b border-[#e6f0f0] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#185391]"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {rows.length ? (
              rows.map((r, ridx) => (
                <tr key={ridx} className={ridx % 2 ? "bg-white" : "bg-white"}>
                  {(cols.length ? r.slice(0, cols.length) : r).map((cell, cidx) => (
                    <td
                      key={cidx}
                      className="border-b border-[#e6f0f0] px-3 py-2 align-top"
                    >
                      {cell || "—"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-3 text-[#031111]/60">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "image") {
    const pct = Math.max(30, Math.min(100, block.widthPct ?? 100));
    const fit = block.fit ?? "contain";

    return (
      <div>
        <div style={{ width: `${pct}%` }}>
          {/* External images will render if CORS allows; otherwise the URL will still appear. */}
          <img
            src={block.url}
            alt={block.caption || block.label}
            className={cn(
              "h-auto w-full rounded-xl border border-[#e6f0f0]",
              fit === "cover" ? "object-cover" : "object-contain",
            )}
          />
        </div>
        {block.caption ? (
          <div className="mt-2 text-xs text-[#031111]/60">{block.caption}</div>
        ) : null}
      </div>
    );
  }

  return <div className="text-sm text-[#031111]/60">—</div>;
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
  return (
    <div className="w-[816px] bg-white text-[#031111]">
      {/* Cover */}
      <div className="min-h-[1056px] p-12">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight text-[#185391]">
              {settings.agencyName}
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              {report.title}
            </div>
            <div className="mt-2 text-sm text-[#031111]/70">
              {client.name}
              {report.reportingPeriod ? ` • ${report.reportingPeriod}` : ""}
            </div>
          </div>
          <div className="h-12 w-12 rounded-3xl bg-[#26bbc0]" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#e6f0f0] bg-[#eefcfc] p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#185391]">
              Prepared for
            </div>
            <div className="mt-2 text-lg font-semibold">{client.name}</div>
            <div className="mt-2 text-sm text-[#031111]/75">
              {[client.city, client.state].filter(Boolean).join(", ") || "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e6f0f0] bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#185391]">
              Report details
            </div>
            <div className="mt-2 text-sm">
              <div>
                <span className="font-semibold">Type:</span> {report.reportType}
              </div>
              <div className="mt-1">
                <span className="font-semibold">Status:</span> {report.status}
              </div>
              <div className="mt-1">
                <span className="font-semibold">Analyst:</span> {report.analyst || "—"}
              </div>
              <div className="mt-1">
                <span className="font-semibold">Created:</span> {new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {report.executiveSummary ? (
          <div className="mt-10 rounded-2xl border border-[#e6f0f0] p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#185391]">
              Executive summary
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6">
              {report.executiveSummary}
            </div>
          </div>
        ) : null}

        <div className="mt-10 text-xs text-[#031111]/60">
          Generated by Imani OS • {settings.agencyName}
        </div>
      </div>

      {/* Sections */}
      {report.sections.map((s) => (
        <div key={s.id} className="min-h-[1056px] break-after-page p-12">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#185391]">
                Section
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">{s.title}</div>
            </div>
            <div className="text-xs text-[#031111]/60">{client.name}</div>
          </div>

          <div className="mt-6 space-y-4">
            {s.blocks.map((b) => (
              <div key={b.id} className="rounded-2xl border border-[#e6f0f0] p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#185391]">
                  {b.label}
                </div>
                <div className="mt-3">
                  <BlockPrint block={b} report={report} client={client} />
                </div>
              </div>
            ))}

            {s.internalNotes ? (
              <div className="rounded-2xl border border-[#e6f0f0] bg-[#eefcfc] p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#185391]">
                  Internal notes
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-6">
                  {s.internalNotes}
                </div>
              </div>
            ) : null}
          </div>

          {report.nextSteps ? (
            <div className="mt-8 rounded-2xl border border-[#e6f0f0] p-6">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#185391]">
                Optional next steps
              </div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6">
                {report.nextSteps}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
