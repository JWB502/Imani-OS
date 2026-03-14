import * as React from "react";
import type {
  AppData,
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

function nowIso() {
  return new Date().toISOString();
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

type DataContextValue = {
  data: AppData;
  resetToSeed: () => void;

  // Clients
  createClient: (patch: Omit<Client, "id" | "createdAt" | "updatedAt">) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;

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
  updateReport: (id: string, patch: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  reorderReportSections: (reportId: string, sectionIds: string[]) => void;
  updateReportSection: (
    reportId: string,
    sectionId: string,
    patch: Partial<ReportSection>
  ) => void;

  // ROI
  createMetricDefinition: (
    patch: Omit<MetricDefinition, "id" | "createdAt" | "updatedAt">
  ) => MetricDefinition;
  updateMetricDefinition: (id: string, patch: Partial<MetricDefinition>) => void;
  deleteMetricDefinition: (id: string) => void;

  upsertMonthlyMetric: (patch: Omit<MonthlyMetric, "id" | "createdAt" | "updatedAt"> & { id?: string }) => MonthlyMetric;
  deleteMonthlyMetric: (id: string) => void;
};

const DataContext = React.createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<AppData>(() => {
    return readJson<AppData>(DATA_KEY) ?? createSeedData();
  });

  const persist = React.useCallback((next: AppData) => {
    setData(next);
    writeJson(DATA_KEY, next);
  }, []);

  const resetToSeed = React.useCallback(() => {
    const seed = createSeedData();
    persist(seed);
  }, [persist]);

  // Clients
  const createClient = React.useCallback(
    (patch: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
      const createdAt = nowIso();
      const client: Client = {
        id: createId("cl"),
        createdAt,
        updatedAt: createdAt,
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
        reports: data.reports.filter((r) => r.clientId !== id),
        wins: data.wins.filter((w) => w.clientId !== id),
        metricDefinitions: data.metricDefinitions.filter((m) => m.clientId !== id),
        monthlyMetrics: data.monthlyMetrics.filter((mm) => mm.clientId !== id),
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
      const mm: MonthlyMetric = {
        id: createId("mm"),
        createdAt,
        updatedAt: createdAt,
        clientId: patch.clientId,
        month: patch.month,
        values: patch.values,
        notes: patch.notes,
      };
      persist({ ...data, monthlyMetrics: [mm, ...data.monthlyMetrics] });
      return mm;
    },
    [data, persist],
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
        updateReport,
        deleteReport,
        reorderReportSections,
        updateReportSection,
        createMetricDefinition,
        updateMetricDefinition,
        deleteMetricDefinition,
        upsertMonthlyMetric,
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
