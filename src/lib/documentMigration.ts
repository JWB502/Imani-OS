import { createRichTextDocFromPlainText, deepCloneJson, ensureRichTextDoc } from "@/lib/richText";
import { createId } from "@/lib/id";
import type {
  AppData,
  DocumentBlock,
  DocumentPage,
  DocumentReport,
  DocumentTemplate,
  FullTemplate,
  KPIItem,
  ReportSection,
  SectionBlock,
  SectionTemplate,
} from "@/types/imani";

export const DATA_SCHEMA_VERSION = 2;
export const DATA_KEY_V1 = "imani-os:data:v1";
export const DATA_KEY_V2 = "imani-os:data:v2";

function nowIso() {
  return new Date().toISOString();
}

function makeWarningBlock(text: string): DocumentBlock {
  return {
    id: createId("db"),
    type: "callout",
    label: "Migration note",
    props: {
      title: "Review migrated content",
      tone: "warning",
      content: createRichTextDocFromPlainText(text),
    },
  };
}

export function migrateLegacySectionBlock(block: SectionBlock): DocumentBlock {
  switch (block.type) {
    case "richText":
      return {
        id: createId("db"),
        type: "paragraph",
        label: block.label,
        props: { content: deepCloneJson(ensureRichTextDoc(block.content)) },
      };
    case "checklist":
      return {
        id: createId("db"),
        type: "checklist",
        label: block.label,
        props: { items: deepCloneJson(block.items) },
      };
    case "score":
      return {
        id: createId("db"),
        type: "score",
        label: block.label,
        props: { value: block.value, max: block.max, note: block.note },
      };
    case "kpi":
      return {
        id: createId("db"),
        type: "kpiGrid",
        label: block.label,
        props: { items: deepCloneJson(block.items as KPIItem[]) },
      };
    case "table":
      return {
        id: createId("db"),
        type: "table",
        label: block.label,
        props: { columns: deepCloneJson(block.columns), rows: deepCloneJson(block.rows), database: true },
      };
    case "image":
      return {
        id: createId("db"),
        type: "media",
        label: block.label,
        props: {
          url: block.url,
          caption: block.caption,
          widthPct: block.widthPct,
          fit: block.fit,
        },
      };
    case "select":
      return {
        id: createId("db"),
        type: "status",
        label: block.label,
        props: {
          value: block.value ?? block.options[0] ?? "",
          options: deepCloneJson(block.options),
          tone: "info",
        },
      };
    case "progress":
      return {
        id: createId("db"),
        type: "progress",
        label: block.label,
        props: { value: block.value, max: 100 },
      };
    default:
      return makeWarningBlock(`This block could not be mapped cleanly from the legacy schema.`);
  }
}

function pageFromLegacySection(title: string, blocks: SectionBlock[], warnings: string[] = []): DocumentPage {
  const mapped = blocks.map(migrateLegacySectionBlock);
  const warningBlocks = warnings.length
    ? [makeWarningBlock(warnings.join("\n"))]
    : [];

  return {
    id: createId("pg"),
    parentId: null,
    title,
    order: 0,
    blocks: [...warningBlocks, ...mapped],
  };
}

export function migrateLegacySectionTemplate(sectionTemplate: SectionTemplate): DocumentTemplate {
  return {
    id: createId("dt"),
    kind: "fragment",
    name: sectionTemplate.name,
    description: sectionTemplate.description,
    archived: sectionTemplate.archived,
    pages: [pageFromLegacySection(sectionTemplate.name, sectionTemplate.blocks)],
    createdAt: sectionTemplate.createdAt,
    updatedAt: sectionTemplate.updatedAt,
    legacySourceType: "sectionTemplate",
    legacySourceId: sectionTemplate.id,
  };
}

export function migrateLegacyFullTemplate(fullTemplate: FullTemplate, sectionTemplates: SectionTemplate[]): DocumentTemplate {
  const warnings: string[] = [];
  const pages = fullTemplate.sectionTemplateIds.map((sectionTemplateId, index) => {
    const sectionTemplate = sectionTemplates.find((item) => item.id === sectionTemplateId);
    if (!sectionTemplate) {
      warnings.push(`Missing section template ${sectionTemplateId} was replaced with a warning page.`);
      return {
        id: createId("pg"),
        parentId: null,
        title: `Missing section ${index + 1}`,
        order: index,
        blocks: [makeWarningBlock(`Legacy section template ${sectionTemplateId} could not be found during migration.`)],
      } satisfies DocumentPage;
    }

    return {
      ...pageFromLegacySection(sectionTemplate.name, sectionTemplate.blocks),
      order: index,
    };
  });

  return {
    id: createId("dt"),
    kind: "template",
    name: fullTemplate.name,
    description: fullTemplate.description,
    archived: fullTemplate.archived,
    pages,
    createdAt: fullTemplate.createdAt,
    updatedAt: fullTemplate.updatedAt,
    migrationWarnings: warnings,
    legacySourceType: "fullTemplate",
    legacySourceId: fullTemplate.id,
  };
}

export function migrateLegacyReportSections(sections: ReportSection[]): DocumentPage[] {
  return sections.map((section, index) => ({
    id: createId("pg"),
    parentId: null,
    title: section.title,
    order: index,
    blocks: [
      ...section.blocks.map(migrateLegacySectionBlock),
      ...(section.internalNotes
        ? [
            {
              id: createId("db"),
              type: "callout",
              label: "Internal notes",
              props: {
                title: "Internal notes",
                tone: "warning",
                content: createRichTextDocFromPlainText(section.internalNotes),
              },
            } as DocumentBlock,
          ]
        : []),
    ],
  }));
}

export function migrateLegacyReport(report: {
  id: string;
  clientId: string;
  title: string;
  reportType: string;
  reportingPeriod?: string;
  status: "Draft" | "Complete";
  analyst?: string;
  executiveSummary?: string;
  nextSteps?: string;
  internalNotes?: string;
  pdfPageNumbers?: boolean;
  sections: ReportSection[];
  createdAt: string;
  updatedAt: string;
}): DocumentReport {
  return {
    id: createId("rp"),
    clientId: report.clientId,
    title: report.title,
    reportType: report.reportType,
    reportingPeriod: report.reportingPeriod,
    status: report.status,
    analyst: report.analyst,
    executiveSummary: report.executiveSummary,
    nextSteps: report.nextSteps,
    internalNotes: report.internalNotes,
    pdfPageNumbers: report.pdfPageNumbers,
    pages: migrateLegacyReportSections(report.sections),
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    legacySourceType: "report",
    legacySourceId: report.id,
  };
}

export function isDocumentData(value: any): value is AppData {
  return value?.schemaVersion === DATA_SCHEMA_VERSION && Array.isArray(value?.documentTemplates) && Array.isArray(value?.reports);
}

export function migrateAppData(raw: any): AppData {
  if (isDocumentData(raw)) {
    return {
      ...raw,
      schemaVersion: DATA_SCHEMA_VERSION,
      documentTemplates: (raw.documentTemplates ?? []).map(normalizeTemplate),
      reports: (raw.reports ?? []).map(normalizeReport),
      legacy: raw.legacy,
    };
  }

  const base = raw ?? {};
  const sectionTemplates = (base.sectionTemplates ?? []) as SectionTemplate[];
  const fullTemplates = (base.fullTemplates ?? []) as FullTemplate[];
  const reports = (base.reports ?? []) as Array<{
    id: string;
    clientId: string;
    title: string;
    reportType: string;
    reportingPeriod?: string;
    status: "Draft" | "Complete";
    analyst?: string;
    executiveSummary?: string;
    nextSteps?: string;
    internalNotes?: string;
    pdfPageNumbers?: boolean;
    sections: ReportSection[];
    createdAt: string;
    updatedAt: string;
  }>;

  const fragments = sectionTemplates.map(migrateLegacySectionTemplate);
  const templates = fullTemplates.map((template) => migrateLegacyFullTemplate(template, sectionTemplates));

  return {
    schemaVersion: DATA_SCHEMA_VERSION,
    clients: base.clients ?? [],
    wins: base.wins ?? [],
    campaigns: base.campaigns ?? [],
    documentTemplates: [...templates, ...fragments].map(normalizeTemplate),
    reports: reports.map(migrateLegacyReport).map(normalizeReport),
    metricDefinitions: base.metricDefinitions ?? [],
    monthlyMetrics: base.monthlyMetrics ?? [],
    agencyHq: base.agencyHq,
    legacy: {
      sectionTemplates,
      fullTemplates,
      reports,
    },
  };
}

function normalizeBlocks(blocks: DocumentBlock[]): DocumentBlock[] {
  return blocks.map((block) => {
    if (block.type === "paragraph") {
      return { ...block, props: { ...block.props, content: ensureRichTextDoc(block.props.content) } };
    }
    if (block.type === "heading") {
      return { ...block, props: { ...block.props, content: ensureRichTextDoc(block.props.content) } };
    }
    if (block.type === "toggle") {
      return { ...block, props: { ...block.props, content: ensureRichTextDoc(block.props.content) } };
    }
    if (block.type === "callout") {
      return { ...block, props: { ...block.props, content: ensureRichTextDoc(block.props.content) } };
    }
    return block;
  });
}

function normalizeTemplate(template: DocumentTemplate): DocumentTemplate {
  return {
    ...template,
    pages: (template.pages ?? [])
      .map((page) => ({ ...page, blocks: normalizeBlocks(page.blocks ?? []) }))
      .sort((a, b) => a.order - b.order),
    migrationWarnings: template.migrationWarnings ?? [],
  };
}

function normalizeReport(report: DocumentReport): DocumentReport {
  return {
    ...report,
    pages: (report.pages ?? [])
      .map((page) => ({ ...page, blocks: normalizeBlocks(page.blocks ?? []) }))
      .sort((a, b) => a.order - b.order),
    createdAt: report.createdAt ?? nowIso(),
    updatedAt: report.updatedAt ?? nowIso(),
    migrationWarnings: report.migrationWarnings ?? [],
  };
}
