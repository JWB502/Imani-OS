import { createRichTextDocFromPlainText, ensureRichTextDoc, replaceTextInRichDoc } from "@/lib/richText";
import { flattenDocumentPages } from "@/lib/documentTree";
import type { Client, DocumentBlock, DocumentPage, Report } from "@/types/imani";

function replaceToken(input: string, token: string, value: string) {
  return input.split(token).join(value);
}

export function replaceDocumentPlaceholders(text: string, report: Report, client: Client) {
  let output = text;
  output = replaceToken(output, "{{Client Name}}", client.name);
  output = replaceToken(output, "{{Report Title}}", report.title);
  output = replaceToken(output, "{{Report Period}}", report.reportingPeriod ?? "");
  output = replaceToken(output, "{{Date}}", new Date().toLocaleDateString());
  output = replaceToken(output, "{{Analyst Name}}", report.analyst ?? "");
  output = replaceToken(output, "{{City}}", client.city ?? "");
  output = replaceToken(output, "{{State}}", client.state ?? "");
  return output;
}

export function replaceDocumentBlockPlaceholders(block: DocumentBlock, report: Report, client: Client): DocumentBlock {
  if (block.type === "paragraph" || block.type === "heading" || block.type === "toggle" || block.type === "callout") {
    const content = "content" in block.props ? block.props.content : createRichTextDocFromPlainText("");
    return {
      ...block,
      props: {
        ...block.props,
        content: replaceTextInRichDoc(ensureRichTextDoc(content), (text) => replaceDocumentPlaceholders(text, report, client)),
      } as any,
    };
  }

  return block;
}

export function flattenReportPagesForExport(pages: DocumentPage[]) {
  return flattenDocumentPages(pages).map(({ depth, ...page }) => ({
    ...page,
    depth,
  }));
}