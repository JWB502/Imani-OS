import * as React from "react";
import { Blocks, CopyPlus, FileStack, FileText, Plus } from "lucide-react";

import { BlockInserter } from "@/components/documents/BlockInserter";
import { BlockRenderer, convertBlockType } from "@/components/documents/BlockRenderer";
import { PdfPageViewer } from "@/components/documents/PdfPageViewer";
import { RichTextRenderer } from "@/components/editor/RichTextRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDocumentBlock, duplicateBlocks, moveItem } from "@/lib/documentTree";
import { fileToBase64 } from "@/lib/utils";
import type { DocumentPage, DocumentTemplate } from "@/types/imani";

const FOCAL_POINTS = [
  { label: "Center", value: "center" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
  { label: "Top Left", value: "top left" },
  { label: "Top Right", value: "top right" },
  { label: "Bottom Left", value: "bottom left" },
  { label: "Bottom Right", value: "bottom right" },
];

export function DocumentPageEditor({
  page,
  onChange,
  reusableFragments,
}: {
  page: DocumentPage | undefined;
  onChange: (page: DocumentPage) => void;
  reusableFragments: DocumentTemplate[];
}) {

  const [inserterIndex, setInserterIndex] = React.useState<number | null>(null);
  const [selectedFragmentId, setSelectedFragmentId] = React.useState<string>("");
  const [draggedBlockId, setDraggedBlockId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedFragmentId && reusableFragments[0]) {
      setSelectedFragmentId(reusableFragments[0].id);
    }
  }, [reusableFragments, selectedFragmentId]);

  if (!page) {
    return (
      <div className="flex min-h-[480px] items-center justify-center rounded-[32px] border border-dashed border-border/80 bg-white/60 p-10 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Blocks className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold">Choose a page to begin editing</div>
          <div className="mt-2 max-w-md text-sm text-muted-foreground">
            Your document workspace is page-first: select a page from the left rail, then shape the content with flexible blocks.
          </div>
        </div>
      </div>
    );
  }

  function updateBlocks(nextBlocks: DocumentPage["blocks"]) {
    onChange({ ...page, blocks: nextBlocks });
  }

  function insertBlock(index: number, type: Parameters<typeof createDocumentBlock>[0]) {
    const next = page.blocks.slice();
    next.splice(index, 0, createDocumentBlock(type));
    updateBlocks(next);
    setInserterIndex(null);
  }

  function insertFragment() {
    const fragment = reusableFragments.find((item) => item.id === selectedFragmentId);
    if (!fragment) return;
    const sourcePage = fragment.pages[0];
    if (!sourcePage) return;
    updateBlocks([...page.blocks, ...duplicateBlocks(sourcePage.blocks)]);
  }

  return (
    <div className="space-y-5 rounded-[32px] border border-border/70 bg-white/75 p-4 shadow-sm sm:p-6">
      <div className="space-y-4 rounded-[28px] border border-border/70 bg-muted/25 p-4">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-2">
            <Label>Page title</Label>
            <Input
              value={page.title}
              onChange={(event) => onChange({ ...page, title: event.target.value })}
              className="h-12 rounded-2xl bg-white"
              placeholder="Untitled page"
            />
          </div>
          <div className="space-y-2">
            <Label>Page icon</Label>
            <Input
              value={page.icon ?? ""}
              onChange={(event) => onChange({ ...page, icon: event.target.value })}
              className="h-12 rounded-2xl bg-white"
              placeholder="e.g. 📈"
            />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-2">
            <Label>Cover image URL</Label>
            <Input
              value={page.coverUrl ?? ""}
              onChange={(event) => onChange({ ...page, coverUrl: event.target.value })}
              className="h-12 rounded-2xl bg-white"
              placeholder="Optional cover image URL"
            />
          </div>
          <div className="space-y-2">
            <Label>Focal Point</Label>
            <Select
              value={page.coverImagePosition || "center"}
              onValueChange={(val) => onChange({ ...page, coverImagePosition: val })}
            >
              <SelectTrigger className="h-12 rounded-2xl bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl">
                {FOCAL_POINTS.map((fp) => (
                  <SelectItem key={fp.value} value={fp.value} className="rounded-lg">
                    {fp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {page.coverUrl ? (
          <img 
            src={page.coverUrl} 
            alt={page.title} 
            className="h-44 w-full rounded-[24px] object-cover" 
            style={{ objectPosition: page.coverImagePosition || 'center' }}
          />
        ) : null}
      </div>

      {page.isPdf && page.pdfData ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold">PDF Import Preview</div>
              <div className="text-sm text-muted-foreground">
                This page contains an imported PDF document. It will be rendered in full in the export.
              </div>
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-2xl"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/pdf";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const base64 = await fileToBase64(file);
                    onChange({ ...page, pdfData: base64, title: file.name.replace(".pdf", "") });
                  }
                };
                input.click();
              }}
            >
              <FileText className="mr-2 h-4 w-4" /> Replace PDF
            </Button>
          </div>
          <PdfPageViewer pdfData={page.pdfData} />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold">Flexible block canvas</div>
              <div className="text-sm text-muted-foreground">
                Add content between blocks, drag sections into a better order, or drop in a reusable fragment.
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] lg:w-[440px]">
              <Select value={selectedFragmentId} onValueChange={setSelectedFragmentId}>
                <SelectTrigger className="h-11 rounded-2xl bg-white">
                  <SelectValue placeholder="Insert reusable fragment" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {reusableFragments.map((fragment) => (
                    <SelectItem key={fragment.id} value={fragment.id}>
                      {fragment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-11 rounded-2xl" onClick={insertFragment} disabled={!reusableFragments.length}>
                <CopyPlus className="mr-2 h-4 w-4" /> Insert fragment
              </Button>
            </div>
          </div>

          {page.blocks.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-border/80 bg-muted/20 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <FileStack className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold">This page is empty</div>
              <div className="mt-2 text-sm text-muted-foreground">Use the insert control to start writing on the canvas.</div>
              <div className="mt-4 flex justify-center">
                <BlockInserter open={inserterIndex === 0} onOpenChange={(open) => setInserterIndex(open ? 0 : null)} onSelect={(type) => insertBlock(0, type)} />
              </div>
            </div>
          ) : null}

          {page.blocks.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => setDraggedBlockId(block.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggedBlockId || draggedBlockId === block.id) return;
                const from = page.blocks.findIndex((entry) => entry.id === draggedBlockId);
                const to = page.blocks.findIndex((entry) => entry.id === block.id);
                if (from < 0 || to < 0) return;
                updateBlocks(moveItem(page.blocks, from, to));
                setDraggedBlockId(null);
              }}
              className="space-y-3"
            >
              <BlockInserter
                open={inserterIndex === index}
                onOpenChange={(open) => setInserterIndex(open ? index : null)}
                onSelect={(type) => insertBlock(index, type)}
              />

              <BlockRenderer
                block={block}
                index={index}
                total={page.blocks.length}
                onChange={(next) => updateBlocks(page.blocks.map((entry) => (entry.id === block.id ? next : entry)))}
                onDelete={() => updateBlocks(page.blocks.filter((entry) => entry.id !== block.id))}
                onDuplicate={() => updateBlocks([
                  ...page.blocks.slice(0, index + 1),
                  ...duplicateBlocks([block]),
                  ...page.blocks.slice(index + 1),
                ])}
                onMove={(direction) => {
                  const to = direction === "up" ? Math.max(0, index - 1) : Math.min(page.blocks.length - 1, index + 1);
                  updateBlocks(moveItem(page.blocks, index, to));
                }}
                onConvert={(type) => updateBlocks(page.blocks.map((entry) => (entry.id === block.id ? convertBlockType(block, type) : entry)))}
              />
            </div>
          ))}

          {page.blocks.length > 0 ? (
            <BlockInserter
              open={inserterIndex === page.blocks.length}
              onOpenChange={(open) => setInserterIndex(open ? page.blocks.length : null)}
              onSelect={(type) => insertBlock(page.blocks.length, type)}
            />
          ) : null}

          <div className="rounded-[28px] border border-border/70 bg-muted/20 p-4">
            <div className="mb-2 text-sm font-semibold">Print readability snapshot</div>
            <div className="mb-4 text-sm text-muted-foreground">
              Export flattens the page tree in reading order, so every page should read clearly on its own.
            </div>
            <div className="rounded-[24px] border border-border/70 bg-white p-4">
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">Preview excerpt</div>
              <div className="text-xl font-semibold tracking-tight">{page.title || "Untitled page"}</div>
              {page.blocks.slice(0, 2).map((block) => (
                <div key={block.id} className="mt-3">
                  {block.type === "paragraph" || block.type === "heading" ? (
                    <RichTextRenderer doc={block.props.content} />
                  ) : (
                    <div className="rounded-2xl bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                      {block.label || block.type}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}