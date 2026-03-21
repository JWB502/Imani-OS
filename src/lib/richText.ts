import type { JSONContent } from "@tiptap/react";

export function createRichTextDocFromPlainText(text: string): JSONContent {
  const normalized = (text ?? "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

export function isRichTextDoc(value: unknown): value is JSONContent {
  return !!value && typeof value === "object" && (value as any).type === "doc";
}

export function ensureRichTextDoc(value: unknown): JSONContent {
  if (isRichTextDoc(value)) return value;
  if (typeof value === "string") return createRichTextDocFromPlainText(value);
  return createRichTextDocFromPlainText("");
}

export function richTextDocToPlainText(doc: JSONContent): string {
  const out: string[] = [];

  function walk(node: any) {
    if (!node) return;
    if (typeof node.text === "string") {
      out.push(node.text);
      return;
    }
    const children = node.content;
    if (Array.isArray(children)) {
      for (const child of children) walk(child);
      if (node.type === "paragraph" || node.type === "heading") out.push("\n");
      if (node.type === "listItem") out.push("\n");
    }
  }

  walk(doc as any);

  return out
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function deepCloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function replaceTextInRichDoc(doc: JSONContent, replace: (text: string) => string): JSONContent {
  function mapNode(node: any): any {
    if (!node) return node;
    if (typeof node.text === "string") {
      return { ...node, text: replace(node.text) };
    }
    if (Array.isArray(node.content)) {
      return { ...node, content: node.content.map(mapNode) };
    }
    return { ...node };
  }

  return mapNode(doc as any) as JSONContent;
}
