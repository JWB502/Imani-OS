import * as React from "react";
import { Copy, GripVertical, MoreHorizontal, Trash2 } from "lucide-react";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { RichTextRenderer } from "@/components/editor/RichTextRenderer";
import { SlashMenuButton } from "@/components/documents/SlashMenu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addChecklistItem, addKpiItem, createDocumentBlock } from "@/lib/documentTree";
import { richTextDocToPlainText } from "@/lib/richText";
import type { DocumentBlock, DocumentBlockType } from "@/types/imani";

function StatusPill({ tone, children }: { tone: string; children: React.ReactNode }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-900"
      : tone === "warning"
        ? "bg-amber-100 text-amber-900"
        : tone === "danger"
          ? "bg-rose-100 text-rose-900"
          : tone === "info"
            ? "bg-sky-100 text-sky-900"
            : "bg-slate-100 text-slate-900";

  return <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>{children}</div>;
}

export function BlockRenderer({
  block,
  index,
  total,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
  onConvert,
}: {
  block: DocumentBlock;
  index: number;
  total: number;
  onChange: (next: DocumentBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: "up" | "down") => void;
  onConvert: (type: DocumentBlockType) => void;
}) {
  const [slashOpen, setSlashOpen] = React.useState(false);

  const maybeOpenSlash = React.useCallback(
    (value: string) => {
      if (value.trim() === "/") setSlashOpen(true);
    },
    [],
  );

  const actionMenu = (
    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-white/90 text-muted-foreground shadow-sm">
        <GripVertical className="h-4 w-4" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-2xl bg-white/90 shadow-sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          <DropdownMenuItem onClick={() => onMove("up")} disabled={index === 0}>Move up</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMove("down")} disabled={index === total - 1}>Move down</DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="group rounded-[28px] border border-border/70 bg-white/85 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{block.type}</Label>
          {block.type !== "divider" ? (
            <Input
              value={block.label ?? ""}
              onChange={(event) => onChange({ ...block, label: event.target.value })}
              className="mt-2 h-10 rounded-2xl bg-white"
              placeholder="Block label"
            />
          ) : null}
        </div>
        {actionMenu}
      </div>

      {(block.type === "paragraph" || block.type === "heading") && (
        <div className="space-y-3">
          {block.type === "heading" ? (
            <Select
              value={String(block.props.level)}
              onValueChange={(value) => onChange({ ...block, props: { ...block.props, level: Number(value) as 1 | 2 | 3 } })}
            >
              <SelectTrigger className="h-10 rounded-2xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="1">Heading 1</SelectItem>
                <SelectItem value="2">Heading 2</SelectItem>
                <SelectItem value="3">Heading 3</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <RichTextEditor
            value={block.props.content}
            onChange={(content) => {
              onChange({ ...block, props: { ...block.props, content } } as DocumentBlock);
              maybeOpenSlash(richTextDocToPlainText(content));
            }}

            placeholder="Type your content or use / to switch block type"
          />
          <div className="flex flex-wrap gap-2">
            <SlashMenuButton label="switch block" onSelect={(type) => onConvert(type)} />
            <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Typing a single / in an empty text block opens block commands.
            </div>
          </div>
          {slashOpen ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
              <SlashMenuButton
                label="replace this block"
                onSelect={(type) => {
                  setSlashOpen(false);
                  onConvert(type);
                }}
              />
            </div>
          ) : null}
        </div>
      )}

      {block.type === "toggle" && (
        <div className="space-y-3">
          <Input
            value={block.props.title}
            onChange={(event) => onChange({ ...block, props: { ...block.props, title: event.target.value } })}
            className="h-10 rounded-2xl bg-white"
            placeholder="Toggle title"
          />
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
            <div>
              <div className="text-sm font-medium">Expanded in editor</div>
              <div className="text-xs text-muted-foreground">The export always prints toggle content fully expanded.</div>
            </div>
            <Switch
              checked={block.props.open ?? true}
              onCheckedChange={(open) => onChange({ ...block, props: { ...block.props, open } })}
            />
          </div>
          {(block.props.open ?? true) ? (
            <RichTextEditor
              value={block.props.content}
              onChange={(content) => onChange({ ...block, props: { ...block.props, content } })}
              placeholder="Hidden details, methodology, supporting notes…"
            />
          ) : null}
        </div>
      )}

      {block.type === "callout" && (
        <div className="space-y-3">
          <Input
            value={block.props.title}
            onChange={(event) => onChange({ ...block, props: { ...block.props, title: event.target.value } })}
            className="h-10 rounded-2xl bg-white"
            placeholder="Callout title"
          />
          <Select
            value={block.props.tone}
            onValueChange={(tone) => onChange({ ...block, props: { ...block.props, tone: tone as any } })}
          >
            <SelectTrigger className="h-10 rounded-2xl bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="danger">Danger</SelectItem>
            </SelectContent>
          </Select>
          <RichTextEditor
            value={block.props.content}
            onChange={(content) => onChange({ ...block, props: { ...block.props, content } })}
            placeholder="Highlight a caveat, insight, or migration note…"
          />
        </div>
      )}

      {block.type === "checklist" && (
        <div className="space-y-2">
          {block.props.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-2xl bg-muted/30 p-2">
              <Switch
                checked={item.checked}
                onCheckedChange={(checked) => onChange({
                  ...block,
                  props: {
                    ...block.props,
                    items: block.props.items.map((entry) => (entry.id === item.id ? { ...entry, checked } : entry)),
                  },
                })}
              />
              <Input
                value={item.text}
                onChange={(event) => onChange({
                  ...block,
                  props: {
                    ...block.props,
                    items: block.props.items.map((entry) => (entry.id === item.id ? { ...entry, text: event.target.value } : entry)),
                  },
                })}
                className="h-10 rounded-2xl bg-white"
                placeholder="Checklist item"
              />
              <Button
                variant="destructive"
                size="icon"
                className="h-10 w-10 rounded-2xl"
                onClick={() => onChange({ ...block, props: { ...block.props, items: block.props.items.filter((entry) => entry.id !== item.id) } })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" className="rounded-2xl" onClick={() => onChange({ ...block, props: { ...block.props, items: addChecklistItem(block.props.items) } })}>
            Add item
          </Button>
        </div>
      )}

      {block.type === "status" && (
        <div className="space-y-3">
          <Input
            value={block.props.options.join(", ")}
            onChange={(event) => {
              const options = event.target.value.split(",").map((item) => item.trim()).filter(Boolean);
              onChange({
                ...block,
                props: {
                  ...block.props,
                  options,
                  value: options.includes(block.props.value) ? block.props.value : options[0] ?? "",
                },
              });
            }}
            className="h-10 rounded-2xl bg-white"
            placeholder="Options, comma separated"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              value={block.props.value}
              onValueChange={(value) => onChange({ ...block, props: { ...block.props, value } })}
            >
              <SelectTrigger className="h-10 rounded-2xl bg-white">
                <SelectValue placeholder="Pick a value" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {block.props.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={block.props.tone}
              onValueChange={(tone) => onChange({ ...block, props: { ...block.props, tone: tone as any } })}
            >
              <SelectTrigger className="h-10 rounded-2xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="danger">Danger</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <StatusPill tone={block.props.tone}>{block.props.value || "No status selected"}</StatusPill>
        </div>
      )}

      {block.type === "score" && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              value={block.props.max}
              onChange={(event) => onChange({ ...block, props: { ...block.props, max: Number(event.target.value) || 100 } })}
              className="h-10 rounded-2xl bg-white"
              placeholder="Maximum score"
            />
            <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm font-medium">
              {block.props.value} / {block.props.max}
            </div>
          </div>
          <Slider
            value={[block.props.value]}
            min={0}
            max={block.props.max || 100}
            step={1}
            onValueChange={(value) => onChange({ ...block, props: { ...block.props, value: value[0] ?? 0 } })}
          />
          <Textarea
            value={block.props.note ?? ""}
            onChange={(event) => onChange({ ...block, props: { ...block.props, note: event.target.value } })}
            className="min-h-24 rounded-2xl bg-white"
            placeholder="Interpret what the score means…"
          />
        </div>
      )}

      {block.type === "progress" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>{block.props.value}% complete</span>
            <span className="text-muted-foreground">Target {block.props.max}</span>
          </div>
          <Slider
            value={[block.props.value]}
            min={0}
            max={block.props.max || 100}
            step={1}
            onValueChange={(value) => onChange({ ...block, props: { ...block.props, value: value[0] ?? 0 } })}
          />
          <Progress value={(block.props.value / (block.props.max || 100)) * 100} className="h-3 rounded-full" />
        </div>
      )}

      {block.type === "kpiGrid" && (
        <div className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            {block.props.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/25 p-3">
                <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_auto]">
                  <Input
                    value={item.name}
                    onChange={(event) => onChange({
                      ...block,
                      props: {
                        ...block.props,
                        items: block.props.items.map((entry) => (entry.id === item.id ? { ...entry, name: event.target.value } : entry)),
                      },
                    })}
                    className="h-10 rounded-2xl bg-white"
                    placeholder="Metric"
                  />
                  <Input
                    value={item.value}
                    onChange={(event) => onChange({
                      ...block,
                      props: {
                        ...block.props,
                        items: block.props.items.map((entry) => (entry.id === item.id ? { ...entry, value: event.target.value } : entry)),
                      },
                    })}
                    className="h-10 rounded-2xl bg-white"
                    placeholder="Value"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-2xl bg-white"
                    onClick={() => onChange({ ...block, props: { ...block.props, items: block.props.items.filter((entry) => entry.id !== item.id) } })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="rounded-2xl" onClick={() => onChange({ ...block, props: { ...block.props, items: addKpiItem(block.props.items) } })}>
            Add KPI
          </Button>
        </div>
      )}

      {block.type === "table" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <span>Render as database-like table</span>
            <Switch
              checked={block.props.database}
              onCheckedChange={(database) => onChange({ ...block, props: { ...block.props, database } })}
            />
          </div>
          <Input
            value={block.props.columns.join(", ")}
            onChange={(event) => onChange({
              ...block,
              props: {
                ...block.props,
                columns: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
              },
            })}
            className="h-10 rounded-2xl bg-white"
            placeholder="Column 1, Column 2, Column 3"
          />
          <Textarea
            value={block.props.rows.map((row) => row.join(" | ")).join("\n")}
            onChange={(event) => onChange({
              ...block,
              props: {
                ...block.props,
                rows: event.target.value
                  .split("\n")
                  .map((line) => line.split("|").map((item) => item.trim()))
                  .filter((row) => row.some(Boolean)),
              },
            })}
            className="min-h-28 rounded-2xl bg-white"
            placeholder="Row 1 col 1 | Row 1 col 2 | Row 1 col 3"
          />
        </div>
      )}

      {block.type === "media" && (
        <div className="space-y-3">
          <Input
            value={block.props.url}
            onChange={(event) => onChange({ ...block, props: { ...block.props, url: event.target.value } })}
            className="h-10 rounded-2xl bg-white"
            placeholder="Paste image URL"
          />
          <Input
            value={block.props.caption ?? ""}
            onChange={(event) => onChange({ ...block, props: { ...block.props, caption: event.target.value } })}
            className="h-10 rounded-2xl bg-white"
            placeholder="Caption"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              value={block.props.fit ?? "contain"}
              onValueChange={(fit) => onChange({ ...block, props: { ...block.props, fit: fit as any } })}
            >
              <SelectTrigger className="h-10 rounded-2xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
              Width {Math.round(block.props.widthPct ?? 100)}%
            </div>
          </div>
          <Slider
            value={[block.props.widthPct ?? 100]}
            min={30}
            max={100}
            step={1}
            onValueChange={(value) => onChange({ ...block, props: { ...block.props, widthPct: value[0] ?? 100 } })}
          />
          {block.props.url ? (
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-muted/20 p-2">
              <img
                src={block.props.url}
                alt={block.props.caption || block.label || "Media block"}
                className={`w-full rounded-[20px] ${block.props.fit === "cover" ? "object-cover" : "object-contain"}`}
                style={{ width: `${block.props.widthPct ?? 100}%` }}
              />
            </div>
          ) : null}
        </div>
      )}

      {block.type === "divider" && <div className="rounded-full border-t border-dashed border-border/80" />}

      {(block.type === "callout" || block.type === "toggle") && (
        <div className="mt-4 rounded-3xl border border-border/60 bg-muted/20 p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Preview</div>
          {block.type === "callout" ? (
            <div className="space-y-2">
              <StatusPill tone={block.props.tone}>{block.props.title}</StatusPill>
              <RichTextRenderer doc={block.props.content} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold">{block.props.title}</div>
              <RichTextRenderer doc={block.props.content} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function convertBlockType(current: DocumentBlock, type: DocumentBlockType): DocumentBlock {
  if (current.type === type) return current;
  const next = createDocumentBlock(type);

  if ((current.type === "paragraph" || current.type === "heading") && (type === "paragraph" || type === "heading")) {
    return {
      ...next,
      label: current.label,
      props: {
        ...next.props,
        content: current.props.content,
      } as any,
    };
  }

  return { ...next, label: current.label || next.label };
}
