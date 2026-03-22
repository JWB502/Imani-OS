import * as React from "react";
import { Copy, GripVertical, MoreHorizontal, Plus, Trash2, Upload, ChevronUp, ChevronDown } from "lucide-react";

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
import { cn, fileToBase64 } from "@/lib/utils";
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

/**
 * A user-friendly grid-based table editor.
 * Replaces the old pipe-separated textarea.
 */
function TableGridEditor({
  columns,
  rows,
  onChange,
}: {
  columns: string[];
  rows: string[][];
  onChange: (columns: string[], rows: string[][]) => void;
}) {
  const updateColumn = (index: number, value: string) => {
    const next = [...columns];
    next[index] = value;
    onChange(next, rows);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const nextRows = rows.map((row, rIndex) =>
      rIndex === rowIndex ? row.map((cell, cIndex) => (cIndex === colIndex ? value : cell)) : row
    );
    onChange(columns, nextRows);
  };

  const addColumn = () => {
    onChange([...columns, `Col ${columns.length + 1}`], rows.map(row => [...row, ""]));
  };

  const removeColumn = (index: number) => {
    if (columns.length <= 1) return;
    onChange(
      columns.filter((_, i) => i !== index),
      rows.map(row => row.filter((_, i) => i !== index))
    );
  };

  const addRow = () => {
    onChange(columns, [...rows, Array(columns.length).fill("")]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    onChange(columns, rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col, i) => (
                <th key={i} className="group/col border-b border-r border-slate-200 p-1 last:border-r-0">
                  <div className="flex items-center gap-1 px-2">
                    <Input
                      value={col}
                      onChange={(e) => updateColumn(i, e.target.value)}
                      placeholder="Header..."
                      className="h-8 border-none bg-transparent p-0 text-[11px] font-black uppercase tracking-widest text-slate-700 shadow-none focus-visible:ring-0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover/col:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-opacity"
                      onClick={() => removeColumn(i)}
                      disabled={columns.length <= 1}
                      title="Delete column"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </th>
              ))}
              <th className="w-12 border-b border-slate-200 bg-slate-100/50" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIndex) => (
              <tr key={rIndex} className="group/row hover:bg-slate-50/50">
                {row.map((cell, cIndex) => (
                  <td key={cIndex} className="border-b border-r border-slate-200 p-0 last:border-r-0">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rIndex, cIndex, e.target.value)}
                      placeholder="..."
                      className="h-10 border-none bg-transparent px-3 text-sm text-slate-800 shadow-none focus-visible:ring-0"
                    />
                  </td>
                ))}
                <td className="w-12 border-b border-slate-200 p-0 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover/row:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-opacity"
                    onClick={() => removeRow(rIndex)}
                    disabled={rows.length <= 1}
                    title="Delete row"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:ring-1 hover:ring-slate-400 shadow-sm transition-all"
          onClick={addRow}
        >
          <Plus className="mr-2 h-3.5 w-3.5 text-primary" /> Add row
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:ring-1 hover:ring-slate-400 shadow-sm transition-all"
          onClick={addColumn}
        >
          <Plus className="mr-2 h-3.5 w-3.5 text-primary" /> Add column
        </Button>
      </div>
    </div>
  );
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
        <DropdownMenuContent align="end" className="rounded-2xl border-slate-300 shadow-xl">
          <DropdownMenuItem onClick={() => onMove("up")} disabled={index === 0} className="rounded-lg">
            <ChevronUp className="mr-2 h-4 w-4" /> Move up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMove("down")} disabled={index === total - 1} className="rounded-lg">
            <ChevronDown className="mr-2 h-4 w-4" /> Move down
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} className="rounded-lg">
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive rounded-lg">
            <Trash2 className="mr-2 h-4 w-4" /> Delete block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="group relative rounded-[28px] border border-slate-200 bg-white/85 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{block.type}</Label>
          {block.type !== "divider" ? (
            <Input
              value={block.label ?? ""}
              onChange={(event) => onChange({ ...block, label: event.target.value })}
              className="mt-2 h-10 rounded-2xl border-slate-200 bg-white font-semibold text-slate-800 focus:ring-primary/20"
              placeholder={`${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Label (Internal)`}
            />
          ) : null}
        </div>
        {actionMenu}
      </div>

      {(block.type === "paragraph" || block.type === "heading") && (
        <div className="space-y-4">
          {block.type === "heading" ? (
            <Select
              value={String(block.props.level)}
              onValueChange={(value) => onChange({ ...block, props: { ...block.props, level: Number(value) as 1 | 2 | 3 } })}
            >
              <SelectTrigger className="h-10 rounded-2xl border-slate-200 bg-white font-medium text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-300 shadow-xl">
                <SelectItem value="1" className="rounded-lg">Heading 1 (Hero)</SelectItem>
                <SelectItem value="2" className="rounded-lg">Heading 2 (Section)</SelectItem>
                <SelectItem value="3" className="rounded-lg">Heading 3 (Sub-section)</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <RichTextEditor
            value={block.props.content}
            onChange={(content) => {
              onChange({ ...block, props: { ...block.props, content } } as DocumentBlock);
              maybeOpenSlash(richTextDocToPlainText(content));
            }}
            placeholder="Write something impressive..."
          />
          <div className="flex flex-wrap items-center gap-3">
            <SlashMenuButton label="Switch block type" onSelect={(type) => onConvert(type)} />
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Tip: Type "/" in an empty block to open the menu
            </div>
          </div>
          {slashOpen ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="mb-2 text-xs font-bold text-primary">Replace this block:</div>
              <SlashMenuButton
                label="Choose replacement"
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
        <div className="space-y-4">
          <Input
            value={block.props.title}
            onChange={(event) => onChange({ ...block, props: { ...block.props, title: event.target.value } })}
            className="h-10 rounded-2xl border-slate-200 bg-white font-bold text-slate-800"
            placeholder="Toggle Title (Visible in Report)"
          />
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-700">Expanded in Workspace</div>
              <div className="text-xs text-slate-500">This only affects the editor view. PDF exports always show content expanded.</div>
            </div>
            <Switch
              checked={block.props.open ?? true}
              onCheckedChange={(open) => onChange({ ...block, props: { ...block.props, open } })}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          {(block.props.open ?? true) ? (
            <RichTextEditor
              value={block.props.content}
              onChange={(content) => onChange({ ...block, props: { ...block.props, content } })}
              placeholder="Collapsible details, methodology, or supporting notes..."
            />
          ) : null}
        </div>
      )}

      {block.type === "callout" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_140px]">
            <Input
              value={block.props.title}
              onChange={(event) => onChange({ ...block, props: { ...block.props, title: event.target.value } })}
              className="h-10 rounded-2xl border-slate-200 bg-white font-bold text-slate-800"
              placeholder="Callout Headline"
            />
            <Select
              value={block.props.tone}
              onValueChange={(tone) => onChange({ ...block, props: { ...block.props, tone: tone as any } })}
            >
              <SelectTrigger className="h-10 rounded-2xl border-slate-200 bg-white font-medium capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-300 shadow-xl">
                <SelectItem value="info" className="rounded-lg">Info (Blue)</SelectItem>
                <SelectItem value="success" className="rounded-lg">Success (Green)</SelectItem>
                <SelectItem value="warning" className="rounded-lg">Warning (Amber)</SelectItem>
                <SelectItem value="danger" className="rounded-lg">Danger (Red)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <RichTextEditor
            value={block.props.content}
            onChange={(content) => onChange({ ...block, props: { ...block.props, content } })}
            placeholder="Highlight a key takeaway, insight, or important caveat..."
          />
        </div>
      )}

      {block.type === "checklist" && (
        <div className="space-y-3">
          {block.props.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-2 pr-3 transition-colors hover:bg-slate-100/50">
              <div className="pl-2">
                <Switch
                  checked={item.checked}
                  onCheckedChange={(checked) => onChange({
                    ...block,
                    props: {
                      ...block.props,
                      items: block.props.items.map((entry) => (entry.id === item.id ? { ...entry, checked } : entry)),
                    },
                  })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <Input
                value={item.text}
                onChange={(event) => onChange({
                  ...block,
                  props: {
                    ...block.props,
                    items: block.props.items.map((entry) => (entry.id === item.id ? { ...entry, text: event.target.value } : entry)),
                  },
                })}
                className="h-10 border-none bg-transparent text-sm font-medium text-slate-700 shadow-none focus-visible:ring-0"
                placeholder="Checklist task..."
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => onChange({ ...block, props: { ...block.props, items: block.props.items.filter((entry) => entry.id !== item.id) } })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="h-10 w-full rounded-2xl border-dashed border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
            onClick={() => onChange({ ...block, props: { ...block.props, items: addChecklistItem(block.props.items) } })}
          >
            <Plus className="mr-2 h-4 w-4 text-primary" /> Add Checklist Item
          </Button>
        </div>
      )}

      {block.type === "status" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Options (Comma separated)</Label>
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
              className="h-10 rounded-2xl border-slate-200 bg-white"
              placeholder="Planned, In Progress, Review, Complete"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Value</Label>
              <Select
                value={block.props.value}
                onValueChange={(value) => onChange({ ...block, props: { ...block.props, value } })}
              >
                <SelectTrigger className="h-10 rounded-2xl border-slate-200 bg-white font-bold text-slate-800">
                  <SelectValue placeholder="Pick a value" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-300 shadow-xl">
                  {block.props.options.map((option) => (
                    <SelectItem key={option} value={option} className="rounded-lg">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Color Tone</Label>
              <Select
                value={block.props.tone}
                onValueChange={(tone) => onChange({ ...block, props: { ...block.props, tone: tone as any } })}
              >
                <SelectTrigger className="h-10 rounded-2xl border-slate-200 bg-white font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-300 shadow-xl">
                  <SelectItem value="neutral" className="rounded-lg">Neutral (Gray)</SelectItem>
                  <SelectItem value="info" className="rounded-lg">Info (Blue)</SelectItem>
                  <SelectItem value="success" className="rounded-lg">Success (Green)</SelectItem>
                  <SelectItem value="warning" className="rounded-lg">Warning (Amber)</SelectItem>
                  <SelectItem value="danger" className="rounded-lg">Danger (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-center rounded-2xl bg-slate-50/50 p-4 ring-1 ring-slate-100">
            <StatusPill tone={block.props.tone}>{block.props.value || "Select a status..."}</StatusPill>
          </div>
        </div>
      )}

      {block.type === "score" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Max Score</Label>
              <Input
                type="number"
                value={block.props.max}
                onChange={(event) => onChange({ ...block, props: { ...block.props, max: Number(event.target.value) || 100 } })}
                className="h-10 rounded-2xl border-slate-200 bg-white"
                placeholder="100"
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex h-10 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/5 text-xl font-black text-primary">
                {block.props.value} <span className="mx-1 text-sm font-bold opacity-40">/</span> {block.props.max}
              </div>
            </div>
          </div>
          <div className="px-2 pt-2">
            <Slider
              value={[block.props.value]}
              min={0}
              max={block.props.max || 100}
              step={1}
              onValueChange={(value) => onChange({ ...block, props: { ...block.props, value: value[0] ?? 0 } })}
              className="py-4"
            />
          </div>
          <Textarea
            value={block.props.note ?? ""}
            onChange={(event) => onChange({ ...block, props: { ...block.props, note: event.target.value } })}
            className="min-h-24 rounded-2xl border-slate-200 bg-white font-medium text-slate-700"
            placeholder="Analysis: Explain why this score was awarded..."
          />
        </div>
      )}

      {block.type === "progress" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-black text-slate-800">{block.props.value}% Complete</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target: {block.props.max}</div>
          </div>
          <div className="px-2">
            <Slider
              value={[block.props.value]}
              min={0}
              max={block.props.max || 100}
              step={1}
              onValueChange={(value) => onChange({ ...block, props: { ...block.props, value: value[0] ?? 0 } })}
              className="py-4"
            />
          </div>
          <Progress value={(block.props.value / (block.props.max || 100)) * 100} className="h-4 rounded-full bg-slate-100 border border-slate-200" />
        </div>
      )}

      {block.type === "kpiGrid" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {block.props.items.map((item) => (
              <div key={item.id} className="group/kpi relative rounded-2xl border border-slate-200 bg-slate-50/50 p-3 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm">
                <div className="grid gap-2">
                  <Input
                    value={item.name}
                    onChange={(event) => onChange({
                      ...block,
                      props: {
                        ...block.props,
                        items: block.props.items.map((entry) => (entry.id === item.id ? { ...entry, name: event.target.value } : entry)),
                      },
                    })}
                    className="h-8 border-none bg-transparent p-0 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-none focus-visible:ring-0"
                    placeholder="Metric Name"
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
                    className="h-10 border-none bg-transparent p-0 text-2xl font-black text-slate-900 shadow-none focus-visible:ring-0"
                    placeholder="—"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-2 -top-2 h-7 w-7 rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 shadow-sm hover:bg-rose-50 hover:text-rose-600 group-hover/kpi:opacity-100 transition-all"
                  onClick={() => onChange({ ...block, props: { ...block.props, items: block.props.items.filter((entry) => entry.id !== item.id) } })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="h-10 w-full rounded-2xl border-dashed border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
            onClick={() => onChange({ ...block, props: { ...block.props, items: addKpiItem(block.props.items) } })}
          >
            <Plus className="mr-2 h-4 w-4 text-primary" /> Add KPI Metric
          </Button>
        </div>
      )}

      {block.type === "table" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-700">Compact Layout</div>
              <div className="text-xs text-slate-500">Toggle "Database" styling for denser information display in reports.</div>
            </div>
            <Switch
              checked={block.props.database}
              onCheckedChange={(database) => onChange({ ...block, props: { ...block.props, database } })}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <TableGridEditor
            columns={block.props.columns}
            rows={block.props.rows}
            onChange={(columns, rows) => onChange({ ...block, props: { ...block.props, columns, rows } })}
          />
        </div>
      )}

      {block.type === "media" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={block.props.url}
              onChange={(event) => onChange({ ...block, props: { ...block.props, url: event.target.value } })}
              className="h-11 rounded-2xl border-slate-200 bg-white text-sm"
              placeholder="Paste direct Image URL (e.g. from Google Drive or AWS)"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:ring-1 hover:ring-slate-400"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const base64 = await fileToBase64(file);
                    onChange({ ...block, props: { ...block.props, url: base64 } });
                  }
                };
                input.click();
              }}
              title="Upload from device"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          <Input
            value={block.props.caption ?? ""}
            onChange={(event) => onChange({ ...block, props: { ...block.props, caption: event.target.value } })}
            className="h-10 rounded-2xl border-slate-200 bg-white font-medium text-slate-600"
            placeholder="Image Caption (Visible in Report)"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scaling / Fit</Label>
              <Select
                value={block.props.fit ?? "contain"}
                onValueChange={(fit) => onChange({ ...block, props: { ...block.props, fit: fit as any } })}
              >
                <SelectTrigger className="h-10 rounded-2xl border-slate-200 bg-white font-bold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-300 shadow-xl">
                  <SelectItem value="contain" className="rounded-lg">Contain (Letterbox)</SelectItem>
                  <SelectItem value="cover" className="rounded-lg">Cover (Crop to Fit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Width: {Math.round(block.props.widthPct ?? 100)}%</Label>
              <div className="px-2 pt-1">
                <Slider
                  value={[block.props.widthPct ?? 100]}
                  min={30}
                  max={100}
                  step={1}
                  onValueChange={(value) => onChange({ ...block, props: { ...block.props, widthPct: value[0] ?? 100 } })}
                  className="py-4"
                />
              </div>
            </div>
          </div>
          {block.props.url ? (
            <div className="group/img relative mt-2 overflow-hidden rounded-[24px] border-2 border-slate-200 bg-slate-100 p-2 shadow-inner">
              <img
                src={block.props.url}
                alt={block.props.caption || block.label || "Media block"}
                className={cn(
                  "mx-auto rounded-[18px] transition-transform duration-500 group-hover/img:scale-[1.01]",
                  block.props.fit === "cover" ? "h-64 object-cover" : "h-auto object-contain"
                )}
                style={{ width: `${block.props.widthPct ?? 100}%` }}
              />
            </div>
          ) : (
            <div className="flex h-32 w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
              <Upload className="mb-2 h-8 w-8 opacity-20" />
              <div className="text-xs font-bold uppercase tracking-widest opacity-50">Image Preview Area</div>
            </div>
          )}
        </div>
      )}

      {block.type === "divider" && (
        <div className="py-4">
          <div className="rounded-full border-t-2 border-dashed border-slate-200" />
        </div>
      )}

      {(block.type === "callout" || block.type === "toggle") && (
        <div className="mt-6 rounded-[24px] border-2 border-slate-100 bg-slate-50/30 p-5 ring-1 ring-white">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Live Export Preview</div>
          {block.type === "callout" ? (
            <div className="space-y-2">
              <StatusPill tone={block.props.tone}>{block.props.title || "Callout Headline"}</StatusPill>
              <RichTextRenderer doc={block.props.content} className="prose-sm" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-black tracking-tight text-slate-800">{block.props.title || "Toggle Title"}</div>
              <RichTextRenderer doc={block.props.content} className="prose-sm" />
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