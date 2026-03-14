import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { SoftButton, SoftIconButton } from "@/components/app/SoftButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { clamp } from "@/lib/format";
import { createId } from "@/lib/id";
import type { KPIItem, SectionBlock, SectionTemplate } from "@/types/imani";

function buildBlock(type: SectionBlock["type"]): SectionBlock {
  switch (type) {
    case "richText":
      return { id: createId("blk"), type, label: "Notes", content: "" };
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
      return { id: createId("blk"), type, label: "Image", url: "" };
  }
}

function BlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: SectionBlock;
  onChange: (next: SectionBlock) => void;
  onRemove: () => void;
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
        <Textarea
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value } as any)}
          className="mt-3 min-h-28 rounded-2xl bg-white/70"
          placeholder="Template default content…"
        />
      ) : null}

      {block.type === "checklist" ? (
        <div className="mt-3 space-y-2">
          {block.items.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <Switch
                checked={it.checked}
                onCheckedChange={(checked) => {
                  onChange({
                    ...block,
                    items: block.items.map((x) =>
                      x.id === it.id ? { ...x, checked } : x,
                    ),
                  } as any);
                }}
              />
              <Input
                value={it.text}
                onChange={(e) => {
                  onChange({
                    ...block,
                    items: block.items.map((x) =>
                      x.id === it.id ? { ...x, text: e.target.value } : x,
                    ),
                  } as any);
                }}
                className="h-10 rounded-2xl bg-white/70"
              />
              <SoftIconButton
                size="icon"
                className="h-10 w-10 rounded-2xl bg-white"
                onClick={() =>
                  onChange({
                    ...block,
                    items: block.items.filter((x) => x.id !== it.id),
                  } as any)
                }
                aria-label="Remove checklist item"
              >
                <Trash2 className="h-4 w-4" />
              </SoftIconButton>
            </div>
          ))}
          <SoftButton
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
          </SoftButton>
        </div>
      ) : null}

      {block.type === "score" ? (
        <div className="mt-3">
          <div className="flex items-end justify-between">
            <div className="text-sm font-medium">Default score</div>
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
            placeholder="Optional score note…"
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
                className="col-span-6 h-10 rounded-2xl bg-white/70"
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
                className="col-span-5 h-10 rounded-2xl bg-white/70"
                placeholder="Default"
              />
              <SoftIconButton
                size="icon"
                className="col-span-1 h-10 w-10 rounded-2xl bg-white"
                onClick={() =>
                  onChange({
                    ...block,
                    items: block.items.filter((x) => x.id !== it.id),
                  } as any)
                }
                aria-label="Remove KPI"
              >
                <Trash2 className="h-4 w-4" />
              </SoftIconButton>
            </div>
          ))}
          <SoftButton
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
          </SoftButton>
        </div>
      ) : null}

      {block.type === "image" ? (
        <div className="mt-3 space-y-2">
          <Input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value } as any)}
            className="h-10 rounded-2xl bg-white/70"
            placeholder="Default image URL (optional)"
          />
          <Input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value } as any)}
            className="h-10 rounded-2xl bg-white/70"
            placeholder="Caption (optional)"
          />
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
        </div>
      ) : null}
    </div>
  );
}

export default function SectionTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, updateSectionTemplate, deleteSectionTemplate } = useData();

  const template = data.sectionTemplates.find((t) => t.id === id);

  if (!template) {
    return (
      <div className="rounded-3xl border border-border/70 bg-white/70 p-8">
        <div className="text-lg font-semibold">Template not found</div>
        <Button asChild className="mt-4 rounded-2xl">
          <Link to="/templates">Back to Templates</Link>
        </Button>
      </div>
    );
  }

  function patch(p: Partial<SectionTemplate>) {
    updateSectionTemplate(template.id, p);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <SoftButton
            className="mb-3 rounded-2xl"
            onClick={() => navigate("/templates")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </SoftButton>
          <div className="text-sm font-medium text-muted-foreground">
            Section template editor
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{template.name}</h1>
        </div>
        <Button
          variant="destructive"
          className="rounded-2xl"
          onClick={() => {
            if (!confirm(`Delete section template "${template.name}"?`)) return;
            deleteSectionTemplate(template.id);
            toast({ title: "Template deleted." });
            navigate("/templates");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Template details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={template.name}
                onChange={(e) => patch({ name: e.target.value })}
                className="h-11 rounded-2xl bg-white/70"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={template.description ?? ""}
                onChange={(e) => patch({ description: e.target.value })}
                className="min-h-20 rounded-2xl bg-white/70"
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 ring-1 ring-border/60">
              <div>
                <div className="text-sm font-medium">Archived</div>
                <div className="text-xs text-muted-foreground">
                  Hide from report creation.
                </div>
              </div>
              <Switch checked={template.archived} onCheckedChange={(v) => patch({ archived: v })} />
            </div>
            <div className="text-xs text-muted-foreground">Autosaved.</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-white/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Blocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {template.blocks.map((b) => (
              <BlockEditor
                key={b.id}
                block={b}
                onChange={(next) =>
                  patch({ blocks: template.blocks.map((x) => (x.id === b.id ? next : x)) })
                }
                onRemove={() => patch({ blocks: template.blocks.filter((x) => x.id !== b.id) })}
              />
            ))}

            <div className="flex flex-wrap gap-2">
              {([
                "richText",
                "checklist",
                "kpi",
                "score",
                "image",
                "table",
              ] as const).map((t) => (
                <SoftButton
                  key={t}
                  className="rounded-2xl bg-white"
                  onClick={() => patch({ blocks: [...template.blocks, buildBlock(t)] })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add {t}
                </SoftButton>
              ))}
            </div>

            <Separator />
            <div className="text-xs text-muted-foreground">
              Placeholders you can use:{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">{"{{Client Name}}"}</code>,{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">{"{{Date}}"}</code>,{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">{"{{Analyst Name}}"}</code>,{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">{"{{Primary Keyword}}"}</code>,{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">{"{{City / State}}"}</code>,{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">{"{{Report Period}}"}</code>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}