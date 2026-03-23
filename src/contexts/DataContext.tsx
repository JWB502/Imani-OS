"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { createId } from "@/lib/id";
import { readJson, writeJson } from "@/lib/storage";
import { createSeedData } from "@/data/seed";
import { DATA_KEY_V1, DATA_KEY_V2, migrateAppData } from "@/lib/documentMigration";
import { duplicateDocumentPages } from "@/lib/documentTree";
import type {
  AgencyExpense,
  AgencyHq,
  AgencyProduct,
  DocumentReport,
  DocumentTemplate,
  ImaniData,
  KeyPerson,
} from "@/types/imani";

interface DataContextType {
  data: ImaniData;
  createClient: (c: any) => any;
  updateClient: (id: string, c: any) => void;
  deleteClient: (id: string) => void;
  createCampaign: (c: any) => void;
  updateCampaign: (id: string, c: any) => void;
  deleteCampaign: (id: string) => void;
  createWin: (w: any) => void;
  updateWin: (id: string, w: any) => void;
  deleteWin: (id: string) => void;
  createMetricDefinition: (d: any) => void;
  updateMetricDefinition: (id: string, d: any) => void;
  deleteMetricDefinition: (id: string) => void;
  ensureStandardMetricsForClient: (cid: string) => void;
  upsertMonthlyMetric: (m: any) => void;
  bulkUpsertMonthlyMetrics: (m: any[]) => void;
  deleteMonthlyMetric: (id: string) => void;
  createDocumentTemplate: (t: Partial<DocumentTemplate> & Pick<DocumentTemplate, "kind" | "name">) => DocumentTemplate;
  updateDocumentTemplate: (id: string, patch: Partial<DocumentTemplate>) => void;
  duplicateDocumentTemplate: (id: string) => DocumentTemplate | undefined;
  deleteDocumentTemplate: (id: string) => void;
  createReportFromTemplate: (clientId: string, templateId: string) => DocumentReport | undefined;
  updateReport: (id: string, patch: Partial<DocumentReport>) => void;
  duplicateReport: (id: string) => DocumentReport | undefined;
  deleteReport: (id: string) => void;
  updateAgencyOverview: (d: any) => void;
  updateAgencyAnnualProfitGoal: (g: number) => void;
  upsertAgencyProduct: (p: any) => void;
  deleteAgencyProduct: (id: string) => void;
  upsertAgencyExpense: (e: any) => void;
  deleteAgencyExpense: (id: string) => void;
  upsertKeyPerson: (p: KeyPerson) => void;
  deleteKeyPerson: (id: string) => void;
  resetToSeed: () => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

function nowIso() {
  return new Date().toISOString();
}

const defaultAgencyHq: AgencyHq = {
  overview: {
    name: "",
    description: "",
    location: { city: "", state: "", country: "" },
    websiteUrl: "",
    foundingDate: "",
    employeeCount: 0,
    annualMarketingBudget: 0,
  },
  annualProfitGoal: 0,
  products: [],
  expenses: [],
  keyPersonnel: [],
};

function loadInitialData(): ImaniData {
  const latest = readJson<any>(DATA_KEY_V2);
  if (latest) return migrateAppData(latest);

  const legacy = readJson<any>(DATA_KEY_V1);
  if (legacy) return migrateAppData(legacy);

  return createSeedData();
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ImaniData>(loadInitialData);

  useEffect(() => {
    writeJson(DATA_KEY_V2, data);
  }, [data]);

  const resetToSeed = useCallback(() => {
    setData(createSeedData());
  }, []);

  const calculateLtvForClient = useCallback((currentState: ImaniData, clientId: string) => {
    const client = currentState.clients.find((item) => item.id === clientId);
    if (!client) return 0;

    const billingType = client.billingType || "Retainer";
    if (billingType === "Project") return client.oneTimeProjectValue || 0;

    const expenseDef = currentState.metricDefinitions.find(
      (definition) => definition.clientId === clientId && definition.name === "Service Expenses",
    );
    if (!expenseDef) return 0;

    const clientMetrics = currentState.monthlyMetrics.filter((metric) => metric.clientId === clientId);
    return clientMetrics.reduce((sum, metric) => {
      const value = metric.values[expenseDef.id];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  }, []);

  const createClient = useCallback((client: any) => {
    const nextClient = {
      ...client,
      id: createId("cl"),
      billingType: client.billingType || "Retainer",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    nextClient.totalLifetimeValue = calculateLtvForClient({ ...data, clients: [nextClient, ...data.clients] }, nextClient.id);
    setData((prev) => ({ ...prev, clients: [nextClient, ...prev.clients] }));
    return nextClient;
  }, [calculateLtvForClient, data]);

  const updateClient = useCallback((id: string, patch: any) => {
    setData((prev) => {
      const nextClients = prev.clients.map((client) =>
        client.id === id ? { ...client, ...patch, updatedAt: nowIso() } : client,
      );

      return {
        ...prev,
        clients: nextClients.map((client) =>
          client.id === id
            ? { ...client, totalLifetimeValue: calculateLtvForClient({ ...prev, clients: nextClients }, id) }
            : client,
        ),
      };
    });
  }, [calculateLtvForClient]);

  const ensureStandardMetricsForClient = useCallback((clientId: string) => {
    setData((prev) => {
      const client = prev.clients.find((item) => item.id === clientId);
      if (!client) return prev;

      const standardMetrics = ["Service Expenses", "Hours Saved", "Revenue Generated"];
      const existing = prev.metricDefinitions.filter(
        (definition) => definition.clientId === clientId && standardMetrics.includes(definition.name),
      );

      if (existing.length === standardMetrics.length) return prev;

      const nextMetrics = standardMetrics
        .filter((name) => !existing.some((metric) => metric.name === name))
        .map((name) => ({
          id: createId("md"),
          clientId,
          name,
          kind: (name === "Service Expenses" ? "currency" : "number") as "currency" | "number",
          isStandard: true,
        }));

      return { ...prev, metricDefinitions: [...prev.metricDefinitions, ...nextMetrics] };
    });
  }, []);

  const bulkUpsertMonthlyMetrics = useCallback((metrics: any[]) => {
    setData((prev) => {
      const updatedMetrics = [...prev.monthlyMetrics];
      metrics.forEach((metric) => {
        const index = updatedMetrics.findIndex((item) => item.id === metric.id);
        if (index >= 0) {
          updatedMetrics[index] = { ...updatedMetrics[index], ...metric, updatedAt: nowIso() };
        } else {
          updatedMetrics.push({ ...metric, id: createId("mm"), createdAt: nowIso(), updatedAt: nowIso() });
        }
      });

      return {
        ...prev,
        monthlyMetrics: updatedMetrics,
        clients: prev.clients.map((client) => ({
          ...client,
          totalLifetimeValue: calculateLtvForClient({ ...prev, monthlyMetrics: updatedMetrics }, client.id),
        })),
      };
    });
  }, [calculateLtvForClient]);

  const createDocumentTemplate = useCallback((template: Partial<DocumentTemplate> & Pick<DocumentTemplate, "kind" | "name">) => {
    const nextTemplate: DocumentTemplate = {
      id: createId("dt"),
      kind: template.kind,
      name: template.name,
      description: template.description,
      archived: template.archived ?? false,
      pages: template.pages ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      migrationWarnings: template.migrationWarnings ?? [],
      legacySourceId: template.legacySourceId,
      legacySourceType: template.legacySourceType,
    };

    setData((prev) => ({ ...prev, documentTemplates: [nextTemplate, ...prev.documentTemplates] }));
    return nextTemplate;
  }, []);

  const updateDocumentTemplate = useCallback((id: string, patch: Partial<DocumentTemplate>) => {
    setData((prev) => ({
      ...prev,
      documentTemplates: prev.documentTemplates.map((template) =>
        template.id === id ? { ...template, ...patch, updatedAt: nowIso() } : template,
      ),
    }));
  }, []);

  const duplicateDocumentTemplate = useCallback((id: string) => {
    const template = data.documentTemplates.find((item) => item.id === id);
    if (!template) return undefined;

    const nextTemplate: DocumentTemplate = {
      ...template,
      id: createId("dt"),
      name: `${template.name} (Copy)`,
      pages: duplicateDocumentPages(template.pages),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    setData((prev) => ({ ...prev, documentTemplates: [nextTemplate, ...prev.documentTemplates] }));
    return nextTemplate;
  }, [data.documentTemplates]);

  const createReportFromTemplate = useCallback((clientId: string, templateId: string) => {
    const template = data.documentTemplates.find((item) => item.id === templateId && item.kind === "template");
    if (!template) return undefined;

    const nextReport: DocumentReport = {
      id: createId("rp"),
      clientId,
      title: `${template.name} — ${new Date().toLocaleDateString()}`,
      reportType: template.name,
      templateSourceId: template.id,
      status: "Draft",
      pages: duplicateDocumentPages(template.pages),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      migrationWarnings: [],
    };

    setData((prev) => ({ ...prev, reports: [nextReport, ...prev.reports] }));
    return nextReport;
  }, [data.documentTemplates]);

  const updateReport = useCallback((id: string, patch: Partial<DocumentReport>) => {
    setData((prev) => ({
      ...prev,
      reports: prev.reports.map((report) =>
        report.id === id ? { ...report, ...patch, updatedAt: nowIso() } : report,
      ),
    }));
  }, []);

  const duplicateReport = useCallback((id: string) => {
    const report = data.reports.find((item) => item.id === id);
    if (!report) return undefined;

    const nextReport: DocumentReport = {
      ...report,
      id: createId("rp"),
      title: `${report.title} (Copy)`,
      pages: duplicateDocumentPages(report.pages),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    setData((prev) => ({ ...prev, reports: [nextReport, ...prev.reports] }));
    return nextReport;
  }, [data.reports]);

  const value = useMemo<DataContextType>(() => ({
    data,
    createClient,
    updateClient,
    deleteClient: (id: string) => setData((prev) => ({ ...prev, clients: prev.clients.filter((item) => item.id !== id) })),
    createCampaign: (campaign: any) => setData((prev) => ({
      ...prev,
      campaigns: [...prev.campaigns, { ...campaign, id: createId("cmp"), updatedAt: nowIso() }],
    })),
    updateCampaign: (id: string, patch: any) => setData((prev) => ({
      ...prev,
      campaigns: prev.campaigns.map((campaign) =>
        campaign.id === id ? { ...campaign, ...patch, updatedAt: nowIso() } : campaign,
      ),
    })),
    deleteCampaign: (id: string) => setData((prev) => ({
      ...prev,
      campaigns: prev.campaigns.filter((campaign) => campaign.id !== id),
    })),
    createWin: (win: any) => setData((prev) => ({
      ...prev,
      wins: [...prev.wins, { ...win, id: createId("win"), createdAt: nowIso(), updatedAt: nowIso() }],
    })),
    updateWin: (id: string, patch: any) => setData((prev) => ({
      ...prev,
      wins: prev.wins.map((win) => (win.id === id ? { ...win, ...patch, updatedAt: nowIso() } : win)),
    })),
    deleteWin: (id: string) => setData((prev) => ({ ...prev, wins: prev.wins.filter((win) => win.id !== id) })),
    createMetricDefinition: (definition: any) => setData((prev) => ({
      ...prev,
      metricDefinitions: [...prev.metricDefinitions, { ...definition, id: createId("md") }],
    })),
    updateMetricDefinition: (id: string, patch: any) => setData((prev) => ({
      ...prev,
      metricDefinitions: prev.metricDefinitions.map((definition) =>
        definition.id === id ? { ...definition, ...patch } : definition,
      ),
    })),
    deleteMetricDefinition: (id: string) => setData((prev) => ({
      ...prev,
      metricDefinitions: prev.metricDefinitions.filter((definition) => definition.id !== id),
    })),
    ensureStandardMetricsForClient,
    upsertMonthlyMetric: (metric: any) => bulkUpsertMonthlyMetrics([metric]),
    bulkUpsertMonthlyMetrics,
    deleteMonthlyMetric: (id: string) => setData((prev) => {
      const metric = prev.monthlyMetrics.find((item) => item.id === id);
      const nextMetrics = prev.monthlyMetrics.filter((item) => item.id !== id);
      if (!metric) return { ...prev, monthlyMetrics: nextMetrics };

      return {
        ...prev,
        monthlyMetrics: nextMetrics,
        clients: prev.clients.map((client) =>
          client.id === metric.clientId
            ? { ...client, totalLifetimeValue: calculateLtvForClient({ ...prev, monthlyMetrics: nextMetrics }, client.id) }
            : client,
        ),
      };
    }),
    createDocumentTemplate,
    updateDocumentTemplate,
    duplicateDocumentTemplate,
    deleteDocumentTemplate: (id: string) => setData((prev) => ({
      ...prev,
      documentTemplates: prev.documentTemplates.filter((template) => template.id !== id),
    })),
    createReportFromTemplate,
    updateReport,
    duplicateReport,
    deleteReport: (id: string) => setData((prev) => ({
      ...prev,
      reports: prev.reports.filter((report) => report.id !== id),
    })),
    updateAgencyOverview: (patch: any) => setData((prev) => {
      const currentHq = prev.agencyHq || defaultAgencyHq;
      return {
        ...prev,
        agencyHq: { 
          ...currentHq, 
          overview: { ...currentHq.overview, ...patch } 
        },
      };
    }),
    updateAgencyAnnualProfitGoal: (goal: number) => setData((prev) => {
      const currentHq = prev.agencyHq || defaultAgencyHq;
      return {
        ...prev,
        agencyHq: { ...currentHq, annualProfitGoal: goal },
      };
    }),
    upsertAgencyProduct: (product: AgencyProduct) => setData((prev) => {
      const currentHq = prev.agencyHq || defaultAgencyHq;
      return {
        ...prev,
        agencyHq: {
          ...currentHq,
          products: product.id
            ? currentHq.products.map((item) => (item.id === product.id ? product : item))
            : [...currentHq.products, { ...product, id: createId("ap") }],
        },
      };
    }),
    deleteAgencyProduct: (id: string) => setData((prev) => {
      const currentHq = prev.agencyHq || defaultAgencyHq;
      return {
        ...prev,
        agencyHq: { ...currentHq, products: currentHq.products.filter((item) => item.id !== id) },
      };
    }),
    upsertAgencyExpense: (expense: AgencyExpense) => setData((prev) => {
      const currentHq = prev.agencyHq || defaultAgencyHq;
      return {
        ...prev,
        agencyHq: {
          ...currentHq,
          expenses: expense.id
            ? currentHq.expenses.map((item) => (item.id === expense.id ? expense : item))
            : [...currentHq.expenses, { ...expense, id: createId("ae") }],
        },
      };
    }),
    deleteAgencyExpense: (id: string) => setData((prev) => {
      const currentHq = prev.agencyHq || defaultAgencyHq;
      return {
        ...prev,
        agencyHq: { ...currentHq, expenses: currentHq.expenses.filter((item) => item.id !== id) },
      };
    }),
    upsertKeyPerson: (person: KeyPerson) => setData((prev) => {
      const currentHq = prev.agencyHq || defaultAgencyHq;
      return {
        ...prev,
        agencyHq: {
          ...currentHq,
          keyPersonnel: person.id
            ? (currentHq.keyPersonnel || []).map(p => p.id === person.id ? person : p)
            : [...(currentHq.keyPersonnel || []), { ...person, id: createId("kp") }]
        }
      };
    }),
    deleteKeyPerson: (id: string) => setData((prev) => {
      const currentHq = prev.agencyHq || defaultAgencyHq;
      return {
        ...prev,
        agencyHq: {
          ...currentHq,
          keyPersonnel: (currentHq.keyPersonnel || []).filter(p => p.id !== id)
        }
      };
    }),
    resetToSeed,
  }), [
    bulkUpsertMonthlyMetrics,
    calculateLtvForClient,
    createClient,
    createDocumentTemplate,
    createReportFromTemplate,
    data,
    duplicateDocumentTemplate,
    duplicateReport,
    ensureStandardMetricsForClient,
    resetToSeed,
    updateClient,
    updateDocumentTemplate,
    updateReport,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};