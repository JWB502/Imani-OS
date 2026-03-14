import * as React from "react";
import type {
  AppData,
  Campaign,
  Client,
  FullTemplate,
  MetricDefinition,
  MonthlyMetric,
  Report,
  ReportSection,
  SectionTemplate,
  Win,
} from "@/types/imani";
import { createSeedData } from "@/data/seed";
import { createId } from "@/lib/id";
import { readJson, writeJson } from "@/lib/storage";

const DATA_KEY = "imani-os:data:v1";

const STANDARD_REVENUE_NAME = "Revenue";
const STANDARD_EXPENSES_NAME = "Service Expenses";

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

function isRevenueName(name: string) {
  return normalizeName(name) === "revenue";
}

function isServiceExpensesName(name: string) {
  const n = normalizeName(name);
  return n === "service expenses" || n === "service expense";
}

function nowIso() {
  return new Date().toISOString();
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

type BulkUpsertMonthlyMetricsParams = {
  clientId: string;
  months: string[]; // YYYY-MM
  skipExisting?: boolean;
  prefillServiceExpenses?: boolean;
};

type BulkUpsertMonthlyMetricsResult = {
  created: number;
  updated: number;
  skipped: number;
};

type DataContextValue = {
  data: AppData;
  resetToSeed: () => void;

  // Clients
  createClient: (patch: Omit<Client, "id" | "createdAt" | "updatedAt">) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Campaigns
  createCampaign: (
    patch: Omit<Campaign, "id" | "createdAt" | "updatedAt">
  ) => Campaign;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  // Wins
  createWin: (patch: Omit<Win, "id" | "createdAt" | "updatedAt">) => Win;
  updateWin: (id: string, patch: Partial<Win>) => void;
  deleteWin: (id: string) => void;

  // Templates
  createSectionTemplate: (
    patch: Omit<SectionTemplate, "id" | "createdAt" | "updatedAt">
  ) => SectionTemplate;
  updateSectionTemplate: (id: string, patch: Partial<SectionTemplate>) => void;
  duplicateSectionTemplate: (id: string) => SectionTemplate | undefined;
  deleteSectionTemplate: (id: string) => void;

  createFullTemplate: (
    patch: Omit<FullTemplate, "id" | "createdAt" | "updatedAt">
  ) => FullTemplate;
  updateFullTemplate: (id: string, patch: Partial<FullTemplate>) => void;
  duplicateFullTemplate: (id: string) => FullTemplate | undefined;
  deleteFullTemplate: (id: string) => void;

  // Reports
  createReportFromTemplate: (params: {
    clientId: string;
    fullTemplateId: string;
    title?: string;
    reportingPeriod?: string;
    analyst?: string;
  }) => Report;
  duplicateReport: (id: string) => Report | undefined;
  updateReport: (id: string, patch: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  reorderReportSections: (reportId: string, sectionIds: string[]) => void;
  updateReportSection: (
    reportId: string,
    sectionId: string,
    patch: Partial<ReportSection>
  ) => void;

  // ROI
  ensureStandardMetricsForClient: (clientId: string) =>
    | { revenueId: string; serviceExpensesId: string }
    | undefined;

  createMetricDefinition: (
    patch: Omit<MetricDefinition, "id" | "createdAt" | "updatedAt">
  ) => MetricDefinition;
  updateMetricDefinition: (id: string, patch: Partial<MetricDefinition>) => void;
  deleteMetricDefinition: (id: string) => void;

  upsertMonthlyMetric: (
    patch: Omit<MonthlyMetric, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ) => MonthlyMetric;
  bulkUpsertMonthlyMetrics: (
    params: BulkUpsertMonthlyMetricsParams,
  ) => BulkUpsertMonthlyMetricsResult;
  deleteMonthlyMetric: (id: string) => void;
};

const DataContext = React.createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<AppData>(() => {
    const raw = readJson<any>(DATA_KEY);
    if (!raw) return createSeedData();
    return {
      ...raw,
      campaigns: Array.isArray(raw.campaigns) ? raw.campaigns : [],
    } as AppData;
  });

  const persist = React.useCallback((next: AppData) => {
    setData(next);
    writeJson(DATA_KEY, next);
  }, []);

  const resetToSeed = React.useCallback(() => {
    const seed = createSeedData();
    persist(seed);
  }, [persist]);

  const ensureStandardMetricsInData = React.useCallback(
    (base: AppData, clientId: string) => {
      const defs = base.metricDefinitions.filter((m) => m.clientId === clientId);

      const revenue =
        defs.find((m) => m.isStandard && isRevenueName(m.name)) ??
        defs.find((m) => isRevenueName(m.name));

      const expenses =
        defs.find((m) => m.isStandard && isServiceExpensesName(m.name)) ??
        defs.find((m) => isServiceExpensesName(m.name));

      let metricDefinitions = base.metricDefinitions;
      let changed = false;

      const touch = (id: string, patch: Partial<MetricDefinition>) => {
        changed = true;
        metricDefinitions = metricDefinitions.map((m) =>
          m.id === id ? { ...m, ...patch, updatedAt: nowIso() } : m,
        );
      };

      let revenueId = revenue?.id;
      let serviceExpensesId = expenses?.id;

      if (revenue) {
        const needsPatch =
          revenue.name !== STANDARD_REVENUE_NAME ||
          revenue.kind !== "currency" ||
          !revenue.locked ||
          !revenue.isStandard;
        if (needsPatch) {
          touch(revenue.id, {
            name: STANDARD_REVENUE_NAME,
            kind: "currency",
            locked: true,
            isStandard: true,
          });
        }
      } else {
        const createdAt = nowIso();
        const md: MetricDefinition = {
          id: createId("md"),
          clientId,
          name: STANDARD_REVENUE_NAME,
          kind: "currency",
          locked: true,
          isStandard: true,
          createdAt,
          updatedAt: createdAt,
        };
        revenueId = md.id;
        metricDefinitions = [md, ...metricDefinitions];
        changed = true;
      }

      if (expenses) {
        const needsPatch =
          expenses.name !== STANDARD_EXPENSES_NAME ||
          expenses.kind !== "currency" ||
          !expenses.locked ||
          !expenses.isStandard;
        if (needsPatch) {
          touch(expenses.id, {
            name: STANDARD_EXPENSES_NAME,
            kind: "currency",
            locked: true,
            isStandard: true,
          });
        }
      } else {
        const createdAt = nowIso();
        const md: MetricDefinition = {
          id: createId("md"),
          clientId,
          name: STANDARD_EXPENSES_NAME,
          kind: "currency",
          locked: true,
          isStandard: true,
          createdAt,
          updatedAt: createdAt,
        };
        serviceExpensesId = md.id;
        metricDefinitions = [md, ...metricDefinitions];
        changed = true;
      }

      return {
        next: changed ? { ...base, metricDefinitions } : base,
        changed,
        revenueId,
        serviceExpensesId,
      };
    },
    [],
  );

  React.useEffect(() => {
    let next = data;
    let changed = false;

    for (const c of data.clients) {
      const res = ensureStandardMetricsInData(next, c.id);
      if (res.changed) {
        changed = true;
        next = res.next;
      }
    }

    if (changed) persist(next);
  }, [data, ensureStandardMetricsInData, persist]);

  const ensureStandardMetricsForClient = React.useCallback(
    (clientId: string) => {
      const res = ensureStandardMetricsInData(data, clientId);
      if (res.changed) persist(res.next);
      if (!res.revenueId || !res.serviceExpensesId) return undefined;
      return { revenueId: res.revenueId, serviceExpensesId: res.serviceExpensesId };
    },
    [data, ensureStandardMetricsInData, persist],
  );

  // Clients
  const createClient = React.useCallback(
    (patch: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
      const createdAt = nowIso();
      const client: Client = {
        id: createId("cl"),
        createdAt,
        updatedAt: createdAt,
        includeInAgencyImpact: patch.includeInAgencyImpact ?? true,
        ...patch,
      };
      persist({ ...data, clients: [client, ...data.clients] });
      return client;
    },
    [data, persist],
  );

  const updateClient = React.useCallback(
    (id: string, patch: Partial<Client>) => {
      persist({
        ...data,
        clients: data.clients.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: nowIso() } : c,
        ),
      });
    },
    [data, persist],
  );

  const deleteClient = React.useCallback(
    (id: string) => {
      persist({
        ...data,
        clients: data.clients.filter((c) => c.id !== id),
        campaigns: data.campaigns.filter((c) => c.clientId !== id),
        reports: data.reports.filter((r) => r.clientId !== id),
        wins: data.wins.filter((w) => w.clientId !== id),
        metricDefinitions: data.metricDefinitions.filter((m) => m.clientId !== id),
        monthlyMetrics: data.monthlyMetrics.filter((mm) => mm.clientId !== id),
      });
    },
    [data, persist],
  );

  // Campaigns
  const createCampaign = React.useCallback(
    (patch: Omit<Campaign, "id" | "createdAt" | "updatedAt">) => {
      const createdAt = nowIso();
      const campaign: Campaign = {
        id: createId("cmp"),
        createdAt,
        updatedAt: createdAt,
        results: patch.results ?? [],
        ...patch,
      };
      persist({ ...data, campaigns: [campaign, ...(data.campaigns ?? [])] });
      return campaign;
    },
    [data, persist],
  );

  const updateCampaign = React.useCallback(
    (id: string, patch: Partial<Campaign>) => {
      persist({
        ...data,
        campaigns: (data.campaigns ?? []).map((c) =>
          c.id === id ? { ...c, ...patch, id: c.id, updatedAt: nowIso() } : c,
        ),
      });
    },
    [data, persist],
  );

  const deleteCampaign = React.useCallback(
    (id: string) => {
      persist({
        ...data,
        campaigns: (data.campaigns ?? []).filter((c) => c.id !== id),
      });
    },
    [data, persist],
  );

  // Wins
  const createWin = React.useCallback(
    (patch: Omit<Win, "id" | "createdAt" | "updatedAt">) => {
      const createdAt = nowIso();
      const win: Win = { id: createId("win"), createdAt, updatedAt: createdAt, ...patch };
      persist({ ...data, wins: [win, ...data.wins] });
      return win;
    },
    [data, persist],
  );

  const updateWin = React.useCallback(
    (id: string, patch: Partial<Win>) => {
      persist({
        ...data,
        wins: data.wins.map((w) =>
          w.id === id ? { ...w, ...patch, updatedAt: nowIso() } : w,
        ),
      });
    },
    [data, persist],
  );

  const deleteWin = React.useCallback(
    (id: string) => {
      persist({ ...data, wins: data.wins.filter((w) => w.id !== id) });
    },
    [data, persist],
  );

  // Templates
  const createSectionTemplate = React.useCallback(
    (patch: Omit<SectionTemplate, "id" | "createdAt" | "updatedAt">) => {
      const createdAt = nowIso();
      const t: SectionTemplate = {
        id: createId("st"),
        createdAt,
        updatedAt: createdAt,
        ...patch,
      };
      persist({ ...data, sectionTemplates: [t, ...data.sectionTemplates] });
      return t;
    },
    [data, persist],
  );

  const updateSectionTemplate = React.useCallback(
    (id: string, patch: Partial<SectionTemplate>) => {
      persist({
        ...data,
        sectionTemplates: data.sectionTemplates.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t,
        ),
      });
    },
    [data, persist],
  );

  const duplicateSectionTemplate = React.useCallback(
    (id: string) => {
      const src = data.sectionTemplates.find((t) => t.id === id);
      if (!src) return undefined;
      const createdAt = nowIso();
      const dupe: SectionTemplate = {
        ...deepClone(src),
        id: createId("st"),
        name: `${src.name} (Copy)`,
        archived: false,
        createdAt,
        updatedAt: createdAt,
      };
      persist({ ...data, sectionTemplates: [dupe, ...data.sectionTemplates] });
      return dupe;
    },
    [data, persist],
  );

  const deleteSectionTemplate = React.useCallback(
    (id: string) => {
      persist({
        ...data,
        sectionTemplates: data.sectionTemplates.filter((t) => t.id !== id),
        fullTemplates: data.fullTemplates.map((ft) => ({
          ...ft,
          sectionTemplateIds: ft.sectionTemplateIds.filter((sid) => sid !== id),
          updatedAt: nowIso(),
        })),
      });
    },
    [data, persist],
  );

  const createFullTemplate = React.useCallback(
    (patch: Omit<FullTemplate, "id" | "createdAt" | "updatedAt">) => {
      const createdAt = nowIso();
      const t: FullTemplate = {
        id: createId("ft"),
        createdAt,
        updatedAt: createdAt,
        ...patch,
      };
      persist({ ...data, fullTemplates: [t, ...data.fullTemplates] });
      return t;
    },
    [data, persist],
  );

  const updateFullTemplate = React.useCallback(
    (id: string, patch: Partial<FullTemplate>) => {
      persist({
        ...data,
        fullTemplates: data.fullTemplates.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t,
        ),
      });
    },
    [data, persist],
  );

  const duplicateFullTemplate = React.useCallback(
    (id: string) => {
      const src = data.fullTemplates.find((t) => t.id === id);
      if (!src) return undefined;
      const createdAt = nowIso();
      const dupe: FullTemplate = {
        ...deepClone(src),
        id: createId("ft"),
        name: `${src.name} (Copy)`,
        archived: false,
        createdAt,
        updatedAt: createdAt,
      };
      persist({ ...data, fullTemplates: [dupe, ...data.fullTemplates] });
      return dupe;
    },
    [data, persist],
  );

  const deleteFullTemplate = React.useCallback(
    (id: string) => {
      persist({ ...data, fullTemplates: data.fullTemplates.filter((t) => t.id !== id) });
    },
    [data, persist],
  );

  // Reports
  const createReportFromTemplate = React.useCallback(
    (params: {
      clientId: string;
      fullTemplateId: string;
      title?: string;
      reportingPeriod?: string;
      analyst?: string;
    }) => {
      const ft = data.fullTemplates.find((t) => t.id === params.fullTemplateId);
      const stMap = new Map(data.sectionTemplates.map((s) => [s.id, s]));
      const createdAt = nowIso();

      const sections: ReportSection[] = (ft?.sectionTemplateIds ?? []).map(
        (sid) => {
          const st = stMap.get(sid);
          return {
            id: createId("rs"),
            title: st?.name ?? "Section",
            sectionTemplateId: sid,
            blocks: deepClone(st?.blocks ?? []),
          };
        },
      );

      const report: Report = {
        id: createId("rp"),
        clientId: params.clientId,
        fullTemplateId: params.fullTemplateId,
        title: params.title?.trim() || ft?.name || "New Report",
        reportType: ft?.name || "Report",
        createdAt,
        reportingPeriod: params.reportingPeriod,
        status: "Draft",
        analyst: params.analyst,
        sections,
        updatedAt: createdAt,
      };

      persist({ ...data, reports: [report, ...data.reports] });
      return report;
    },
    [data, persist],
  );

  const duplicateReport = React.useCallback(
    (id: string) => {
      const src = data.reports.find((r) => r.id === id);
      if (!src) return undefined;

      const createdAt = nowIso();

      const sections: ReportSection[] = src.sections.map((s) => ({
        ...deepClone(s),
        id: createId("rs"),
        blocks: deepClone(s.blocks).map((b: any) => {
          const base = { ...b, id: createId("blk") };
          if (b.type === "checklist") {
            return {
              ...base,
              items: (b.items ?? []).map((it: any) => ({
                ...it,
                id: createId("chk"),
              })),
            };
          }
          if (b.type === "kpi") {
            return {
              ...base,
              items: (b.items ?? []).map((it: any) => ({
                ...it,
                id: createId("kpi"),
              })),
            };
          }
          return base;
        }),
      }));

      const dupe: Report = {
        ...deepClone(src),
        id: createId("rp"),
        title: `${src.title} (Copy)`,
        status: "Draft",
        createdAt,
        updatedAt: createdAt,
        sections,
      };

      persist({ ...data, reports: [dupe, ...data.reports] });
      return dupe;
    },
    [data, persist],
  );

  const updateReport = React.useCallback(
    (id: string, patch: Partial<Report>) => {
      persist({
        ...data,
        reports: data.reports.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
        ),
      });
    },
    [data, persist],
  );

  const deleteReport = React.useCallback(
    (id: string) => {
      persist({ ...data, reports: data.reports.filter((r) => r.id !== id) });
    },
    [data, persist],
  );

  const reorderReportSections = React.useCallback(
    (reportId: string, sectionIds: string[]) => {
      const report = data.reports.find((r) => r.id === reportId);
      if (!report) return;
      const byId = new Map(report.sections.map((s) => [s.id, s]));
      const nextSections = sectionIds.map((id) => byId.get(id)).filter(Boolean) as ReportSection[];
      updateReport(reportId, { sections: nextSections });
    },
    [data.reports, updateReport],
  );

  const updateReportSection = React.useCallback(
    (reportId: string, sectionId: string, patch: Partial<ReportSection>) => {
      const report = data.reports.find((r) => r.id === reportId);
      if (!report) return;
      updateReport(reportId, {
        sections: report.sections.map((s) =>
          s.id === sectionId ? { ...s, ...patch } : s,
        ),
      });
    },
    [data.reports, updateReport],
  );

  // ROI
  const createMetricDefinition = React.useCallback(
    (patch: Omit<MetricDefinition, "id" | "createdAt" | "updatedAt">) => {
      const createdAt = nowIso();
      const md: MetricDefinition = {
        id: createId("md"),
        createdAt,
        updatedAt: createdAt,
        ...patch,
      };
      persist({ ...data, metricDefinitions: [md, ...data.metricDefinitions] });
      return md;
    },
    [data, persist],
  );

  const updateMetricDefinition = React.useCallback(
    (id: string, patch: Partial<MetricDefinition>) => {
      const existing = data.metricDefinitions.find((m) => m.id === id);
      if (!existing) return;

      if (existing.locked) {
        const safePatch: Partial<MetricDefinition> = {
          ...(patch.locked ? { locked: true } : {}),
          ...(patch.isStandard ? { isStandard: true } : {}),
        };
        if (Object.keys(safePatch).length === 0) return;
        persist({
          ...data,
          metricDefinitions: data.metricDefinitions.map((m) =>
            m.id === id ? { ...m, ...safePatch, updatedAt: nowIso() } : m,
          ),
        });
        return;
      }

      persist({
        ...data,
        metricDefinitions: data.metricDefinitions.map((m) =>
          m.id === id ? { ...m, ...patch, updatedAt: nowIso() } : m,
        ),
      });
    },
    [data, persist],
  );

  const deleteMetricDefinition = React.useCallback(
    (id: string) => {
      const existing = data.metricDefinitions.find((m) => m.id === id);
      if (existing?.locked) return;

      persist({
        ...data,
        metricDefinitions: data.metricDefinitions.filter((m) => m.id !== id),
        monthlyMetrics: data.monthlyMetrics.map((mm) => {
          const next = { ...mm, values: { ...mm.values } };
          delete next.values[id];
          return next;
        }),
      });
    },
    [data, persist],
  );

  const upsertMonthlyMetric = React.useCallback(
    (
      patch: Omit<MonthlyMetric, "id" | "createdAt" | "updatedAt"> & { id?: string },
    ) => {
      const existing = patch.id
        ? data.monthlyMetrics.find((m) => m.id === patch.id)
        : data.monthlyMetrics.find(
            (m) => m.clientId === patch.clientId && m.month === patch.month,
          );

      if (existing) {
        const updated: MonthlyMetric = {
          ...existing,
          ...patch,
          values: { ...existing.values, ...patch.values },
          includeInAgencyImpact:
            patch.includeInAgencyImpact ?? existing.includeInAgencyImpact,
          updatedAt: nowIso(),
        };
        persist({
          ...data,
          monthlyMetrics: data.monthlyMetrics.map((m) =>
            m.id === existing.id ? updated : m,
          ),
        });
        return updated;
      }

      const createdAt = nowIso();
      const client = data.clients.find((c) => c.id === patch.clientId);
      const mm: MonthlyMetric = {
        id: createId("mm"),
        createdAt,
        updatedAt: createdAt,
        clientId: patch.clientId,
        month: patch.month,
        values: patch.values,
        includeInAgencyImpact:
          patch.includeInAgencyImpact ?? client?.includeInAgencyImpact ?? true,
        notes: patch.notes,
      };
      persist({ ...data, monthlyMetrics: [mm, ...data.monthlyMetrics] });
      return mm;
    },
    [data, persist],
  );

  const bulkUpsertMonthlyMetrics = React.useCallback(
    (params: BulkUpsertMonthlyMetricsParams): BulkUpsertMonthlyMetricsResult => {
      const client = data.clients.find((c) => c.id === params.clientId);
      if (!client) return { created: 0, updated: 0, skipped: 0 };

      const ensureRes = ensureStandardMetricsInData(data, params.clientId);
      const base = ensureRes.next;

      const defs = base.metricDefinitions.filter((m) => m.clientId === params.clientId);
      const expensesMd =
        defs.find((m) => m.isStandard && isServiceExpensesName(m.name)) ??
        defs.find((m) => isServiceExpensesName(m.name));

      const expensesId = expensesMd?.id;
      const shouldPrefill =
        params.prefillServiceExpenses &&
        expensesId &&
        typeof client.monthlyRetainer === "number" &&
        Number.isFinite(client.monthlyRetainer);

      const byMonth = new Map(
        base.monthlyMetrics
          .filter((mm) => mm.clientId === params.clientId)
          .map((mm) => [mm.month, mm] as const),
      );

      let monthlyMetrics = base.monthlyMetrics;
      let created = 0;
      let updated = 0;
      let skipped = 0;

      const defaultInclude = client.includeInAgencyImpact ?? true;

      for (const month of params.months) {
        const existing = byMonth.get(month);
        if (existing) {
          if (params.skipExisting !== false) {
            skipped++;
            continue;
          }

          const valuesPatch: Record<string, number> = {};
          if (shouldPrefill && expensesId && existing.values[expensesId] === undefined) {
            valuesPatch[expensesId] = client.monthlyRetainer as number;
          }

          const includePatch: Partial<MonthlyMetric> = {};
          if (existing.includeInAgencyImpact === undefined) {
            includePatch.includeInAgencyImpact = defaultInclude;
          }

          if (
            Object.keys(valuesPatch).length === 0 &&
            includePatch.includeInAgencyImpact === undefined
          ) {
            skipped++;
            continue;
          }

          const nextMm: MonthlyMetric = {
            ...existing,
            ...includePatch,
            values: { ...existing.values, ...valuesPatch },
            updatedAt: nowIso(),
          };

          monthlyMetrics = monthlyMetrics.map((m) => (m.id === existing.id ? nextMm : m));
          updated++;
          continue;
        }

        const createdAt = nowIso();
        const values: Record<string, number> = {};
        if (shouldPrefill && expensesId) {
          values[expensesId] = client.monthlyRetainer as number;
        }

        const mm: MonthlyMetric = {
          id: createId("mm"),
          createdAt,
          updatedAt: createdAt,
          clientId: params.clientId,
          month,
          values,
          includeInAgencyImpact: defaultInclude,
        };

        monthlyMetrics = [mm, ...monthlyMetrics];
        created++;
      }

      const didChange =
        ensureRes.changed || created > 0 || updated > 0 || monthlyMetrics !== base.monthlyMetrics;

      if (didChange) {
        persist({ ...base, monthlyMetrics });
      }

      return { created, updated, skipped };
    },
    [data, ensureStandardMetricsInData, persist],
  );

  const deleteMonthlyMetric = React.useCallback(
    (id: string) => {
      persist({
        ...data,
        monthlyMetrics: data.monthlyMetrics.filter((m) => m.id !== id),
      });
    },
    [data, persist],
  );

  return (
    <DataContext.Provider
      value={{
        data,
        resetToSeed,
        createClient,
        updateClient,
        deleteClient,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        createWin,
        updateWin,
        deleteWin,
        createSectionTemplate,
        updateSectionTemplate,
        duplicateSectionTemplate,
        deleteSectionTemplate,
        createFullTemplate,
        updateFullTemplate,
        duplicateFullTemplate,
        deleteFullTemplate,
        createReportFromTemplate,
        duplicateReport,
        updateReport,
        deleteReport,
        reorderReportSections,
        updateReportSection,
        ensureStandardMetricsForClient,
        createMetricDefinition,
        updateMetricDefinition,
        deleteMetricDefinition,
        upsertMonthlyMetric,
        bulkUpsertMonthlyMetrics,
        deleteMonthlyMetric,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}