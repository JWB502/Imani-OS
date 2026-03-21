import { createId } from "@/lib/id";
import { createRichTextDocFromPlainText, deepCloneJson } from "@/lib/richText";
import type {
  ChecklistItem,
  DocumentBlock,
  DocumentBlockType,
  DocumentPage,
  KPIItem,
} from "@/types/imani";

export function createDocumentBlock(type: DocumentBlockType): DocumentBlock {
  switch (type) {
    case "paragraph":
      return {
        id: createId("db"),
        type,
        label: "Paragraph",
        props: { content: createRichTextDocFromPlainText("") },
      };
    case "heading":
      return {
        id: createId("db"),
        type,
        label: "Heading",
        props: { level: 2, content: createRichTextDocFromPlainText("") },
      };
    case "toggle":
      return {
        id: createId("db"),
        type,
        label: "Toggle",
        props: { title: "Toggle title", content: createRichTextDocFromPlainText(""), open: true },
      };
    case "callout":
      return {
        id: createId("db"),
        type,
        label: "Callout",
        props: { title: "Important note", tone: "info", content: createRichTextDocFromPlainText("") },
      };
    case "checklist":
      return {
        id: createId("db"),
        type,
        label: "Checklist",
        props: { items: [{ id: createId("chk"), text: "New item", checked: false }] },
      };
    case "status":
      return {
        id: createId("db"),
        type,
        label: "Status",
        props: { value: "Planned", options: ["Planned", "In Progress", "Complete"], tone: "info" },
      };
    case "score":
      return {
        id: createId("db"),
        type,
        label: "Score",
        props: { value: 72, max: 100, note: "" },
      };
    case "progress":
      return {
        id: createId("db"),
        type,
        label: "Progress",
        props: { value: 45, max: 100 },
      };
    case "kpiGrid":
      return {
        id: createId("db"),
        type,
        label: "KPI Grid",
        props: {
          items: [
            { id: createId("kpi"), name: "Primary metric", value: "—" },
            { id: createId("kpi"), name: "Secondary metric", value: "—" },
          ] satisfies KPIItem[],
        },
      };
    case "table":
      return {
        id: createId("db"),
        type,
        label: "Table",
        props: {
          columns: ["Column 1", "Column 2", "Column 3"],
          rows: [["", "", ""]],
          database: true,
        },
      };
    case "media":
      return {
        id: createId("db"),
        type,
        label: "Media",
        props: { url: "", caption: "", widthPct: 100, fit: "contain" },
      };
    case "divider":
      return {
        id: createId("db"),
        type,
        label: "Divider",
        props: {},
      };
  }
}

export function createDocumentPage(title = "Untitled page", parentId: string | null = null, order = 0): DocumentPage {
  return {
    id: createId("pg"),
    parentId,
    title,
    order,
    blocks: [createDocumentBlock("heading"), createDocumentBlock("paragraph")],
  };
}

export function normalizePageOrders(pages: DocumentPage[]): DocumentPage[] {
  const byParent = new Map<string | null, DocumentPage[]>();

  for (const page of pages) {
    const bucket = byParent.get(page.parentId) ?? [];
    bucket.push(page);
    byParent.set(page.parentId, bucket);
  }

  const normalized: DocumentPage[] = [];
  for (const group of byParent.values()) {
    group
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((page, index) => {
        normalized.push({ ...page, order: index });
      });
  }

  return normalized;
}

export function getChildPages(pages: DocumentPage[], parentId: string | null) {
  return pages
    .filter((page) => page.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

export function flattenDocumentPages(pages: DocumentPage[], parentId: string | null = null, depth = 0): Array<DocumentPage & { depth: number }> {
  const children = getChildPages(pages, parentId);
  return children.flatMap((page) => [
    { ...page, depth },
    ...flattenDocumentPages(pages, page.id, depth + 1),
  ]);
}

export function countDocumentPages(pages: DocumentPage[]) {
  return pages.length;
}

export function duplicateDocumentPages(pages: DocumentPage[]): DocumentPage[] {
  const idMap = new Map<string, string>();
  for (const page of pages) {
    idMap.set(page.id, createId("pg"));
  }

  return pages.map((page) => ({
    ...deepCloneJson(page),
    id: idMap.get(page.id)!,
    parentId: page.parentId ? idMap.get(page.parentId) ?? null : null,
    blocks: page.blocks.map((block) => ({ ...deepCloneJson(block), id: createId("db") })),
  }));
}

export function duplicateBlocks(blocks: DocumentBlock[]): DocumentBlock[] {
  return blocks.map((block) => ({ ...deepCloneJson(block), id: createId("db") }));
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return items;
  const next = items.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function patchPage(pages: DocumentPage[], pageId: string, patch: Partial<DocumentPage>) {
  return pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page));
}

export function replacePageBlocks(pages: DocumentPage[], pageId: string, blocks: DocumentBlock[]) {
  return patchPage(pages, pageId, { blocks });
}

export function addChecklistItem(items: ChecklistItem[]) {
  return [...items, { id: createId("chk"), text: "", checked: false }];
}

export function addKpiItem(items: KPIItem[]) {
  return [...items, { id: createId("kpi"), name: "", value: "" }];
}
