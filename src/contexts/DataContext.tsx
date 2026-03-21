"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Client, MonthlyMetric, MetricDefinition, ImaniData, 
  Campaign, Win, SectionTemplate, FullTemplate, Report,
  AgencyProduct, AgencyExpense, ReportSection 
} from '@/types/imani';
import { createSeedData } from '@/data/seed';
import { readJson, writeJson } from '@/lib/storage';
import { createId } from '@/lib/id';
import { deepCloneJson, ensureRichTextDoc } from "@/lib/richText";

const DATA_KEY = "imani-os:data:v1";

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
  createSectionTemplate: (t: any) => any;
  updateSectionTemplate: (id: string, t: any) => void;
  duplicateSectionTemplate: (id: string) => any;
  deleteSectionTemplate: (id: string) => void;
  createFullTemplate: (t: any) => any;
  updateFullTemplate: (id: string, t: any) => void;
  duplicateFullTemplate: (id: string) => any;
  deleteFullTemplate: (id: string) => void;
  createReportFromTemplate: (cid: string, tid: string) => Report | undefined;
  updateReport: (id: string, r: any) => void;
  duplicateReport: (id: string) => any;
  deleteReport: (id: string) => void;
  updateReportSection: (rid: string, sid: string, d: any) => void;
  reorderReportSections: (rid: string, sids: string[]) => void;
  updateAgencyOverview: (d: any) => void;
  updateAgencyAnnualProfitGoal: (g: number) => void;
  upsertAgencyProduct: (p: any) => void;
  deleteAgencyProduct: (id: string) => void;
  upsertAgencyExpense: (e: any) => void;
  deleteAgencyExpense: (id: string) => void;
  resetToSeed: () => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

function migrateRichTextInSectionBlocks(blocks: any[]) {
  return (blocks ?? []).map((b) => {
    if (!b || typeof b !== "object") return b;
    if (b.type === "richText") return { ...b, content: ensureRichTextDoc(b.content) };
    return b;
  });
}

function migrateData(saved: ImaniData): ImaniData {
  return {
    ...saved,
    sectionTemplates: (saved.sectionTemplates ?? []).map((st: any) => ({
      ...st,
      blocks: migrateRichTextInSectionBlocks(st.blocks),
    })),
    reports: (saved.reports ?? []).map((r: any) => ({
      ...r,
      sections: (r.sections ?? []).map((s: any) => ({
        ...s,
        blocks: migrateRichTextInSectionBlocks(s.blocks),
      })),
    })),
  };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ImaniData>(() => {
    const saved = readJson<ImaniData>(DATA_KEY);
    return saved ? migrateData(saved) : createSeedData();
  });

  useEffect(() => {
    writeJson(DATA_KEY, data);
  }, [data]);

  const resetToSeed = useCallback(() => {
    const seed = createSeedData();
    setData(seed);
  }, []);

  const calculateLtvForClient = (currentState: ImaniData, clientId: string) => {
    const client = currentState.clients.find(c => c.id === clientId);
    if (!client) return 0;

    const billingType = client.billingType || "Retainer";

    if (billingType === "Project") {
      return client.oneTimeProjectValue || 0;
    }

    const expenseDef = currentState.metricDefinitions.find(
      d => d.clientId === clientId && d.name === "Service Expenses"
    );

    if (!expenseDef) return 0;

    const clientMetrics = currentState.monthlyMetrics.filter(m => m.clientId === clientId);
    return clientMetrics.reduce((sum, m) => {
      const val = m.values[expenseDef.id];
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
  };

  const createClient = (c: any) => {
    const nc = {
      ...c,
      id: createId("cl"),
      billingType: c.billingType || "Retainer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    nc.totalLifetimeValue = calculateLtvForClient({ ...data, clients: [nc, ...data.clients] }, nc.id);
    
    setData(p => ({ ...p, clients: [nc, ...p.clients] }));
    return nc;
  };

  const updateClient = (id: string, c: any) => setData(p => {
    const nextClients = p.clients.map(x => x.id === id ? { ...x, ...c, updatedAt: new Date().toISOString() } : x);
    const updatedClients = nextClients.map(client => {
      if (client.id === id) {
        return {
          ...client,
          totalLifetimeValue: calculateLtvForClient({ ...p, clients: nextClients }, id)
        };
      }
      return client;
    });

    return { ...p, clients: updatedClients };
  });

  const deleteClient = (id: string) => setData(p => ({ ...p, clients: p.clients.filter(x => x.id !== id) }));

  const ensureStandardMetricsForClient = (clientId: string) => {
    setData(prev => {
      const client = prev.clients.find(c => c.id === clientId);
      if (!client) return prev;

      const standardMetrics = ["Service Expenses", "Hours Saved", "Revenue Generated"];
      const existingStandardMetrics = prev.metricDefinitions.filter(
        d => d.clientId === clientId && standardMetrics.includes(d.name)
      );

      if (existingStandardMetrics.length === standardMetrics.length) {
        return prev;
      }

      const newMetrics = standardMetrics
        .filter(name => !existingStandardMetrics.some(m => m.name === name))
        .map(name => ({
          id: createId("md"),
          clientId,
          name,
          kind: (name === "Service Expenses" ? "currency" : "number") as "currency" | "number",
          isStandard: true
        }));

      return {
        ...prev,
        metricDefinitions: [...prev.metricDefinitions, ...newMetrics]
      };
    });
  };

  const bulkUpsertMonthlyMetrics = (metrics: any[]) => {
    setData(prev => {
      const updatedMetrics = [...prev.monthlyMetrics];
      metrics.forEach(metric => {
        const index = updatedMetrics.findIndex(m => m.id === metric.id);
        if (index !== -1) {
          updatedMetrics[index] = { ...updatedMetrics[index], ...metric, updatedAt: new Date().toISOString() };
        } else {
          updatedMetrics.push({ ...metric, id: createId("mm"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
      });

      const finalClients = prev.clients.map(client => ({
        ...client,
        totalLifetimeValue: calculateLtvForClient({ ...prev, monthlyMetrics: updatedMetrics }, client.id)
      }));

      return { ...prev, monthlyMetrics: updatedMetrics, clients: finalClients };
    });
  };

  const value: DataContextType = {
    data,
    createClient,
    updateClient,
    deleteClient,
    resetToSeed,
    bulkUpsertMonthlyMetrics,
    ensureStandardMetricsForClient,
    createCampaign: (c: any) => setData(p => ({ ...p, campaigns: [...p.campaigns, { ...c, id: createId("cmp"), updatedAt: new Date().toISOString() }] })),
    updateCampaign: (id: string, c: any) => setData(p => ({ ...p, campaigns: p.campaigns.map(x => x.id === id ? { ...x, ...c, updatedAt: new Date().toISOString() } : x) })),
    deleteCampaign: (id: string) => setData(p => ({ ...p, campaigns: p.campaigns.filter(x => x.id !== id) })),
    createWin: (w: any) => setData(p => ({ ...p, wins: [...p.wins, { ...w, id: createId("win"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] })),
    updateWin: (id: string, w: any) => setData(p => ({ ...p, wins: p.wins.map(x => x.id === id ? { ...x, ...w, updatedAt: new Date().toISOString() } : x) })),
    deleteWin: (id: string) => setData(p => ({ ...p, wins: p.wins.filter(x => x.id !== id) })),
    createMetricDefinition: (d: any) => setData(p => ({ ...p, metricDefinitions: [...p.metricDefinitions, { ...d, id: createId("md") }] })),
    updateMetricDefinition: (id: string, d: any) => setData(p => ({ ...p, metricDefinitions: p.metricDefinitions.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteMetricDefinition: (id: string) => setData(p => ({ ...p, metricDefinitions: p.metricDefinitions.filter(x => x.id !== id) })),
    upsertMonthlyMetric: (m: any) => bulkUpsertMonthlyMetrics([m]),
    deleteMonthlyMetric: (id: string) => setData(p => {
      const metric = p.monthlyMetrics.find(m => m.id === id);
      const nextMetrics = p.monthlyMetrics.filter(x => x.id !== id);
      if (metric) {
        const nextClients = p.clients.map(c => {
          if (c.id === metric.clientId) {
            return {
              ...c,
              totalLifetimeValue: calculateLtvForClient({ ...p, monthlyMetrics: nextMetrics }, c.id)
            };
          }
          return c;
        });
        return { ...p, monthlyMetrics: nextMetrics, clients: nextClients };
      }
      return { ...p, monthlyMetrics: nextMetrics };
    }),
    createSectionTemplate: (t: any) => { const nt = { ...t, id: createId("st"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, sectionTemplates: [...p.sectionTemplates, nt] })); return nt; },
    updateSectionTemplate: (id: string, t: any) => setData(p => ({ ...p, sectionTemplates: p.sectionTemplates.map(x => x.id === id ? { ...x, ...t, updatedAt: new Date().toISOString() } : x) })),
    duplicateSectionTemplate: (id: string) => { const t = data.sectionTemplates.find(x => x.id === id); if (!t) return; return value.createSectionTemplate({ ...t, name: `${t.name} (Copy)` }); },
    deleteSectionTemplate: (id: string) => setData(p => ({ ...p, sectionTemplates: p.sectionTemplates.filter(x => x.id !== id) })),
    createFullTemplate: (t: any) => { const nt = { ...t, id: createId("ft"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, fullTemplates: [...p.fullTemplates, nt] })); return nt; },
    updateFullTemplate: (id: string, t: any) => setData(p => ({ ...p, fullTemplates: p.fullTemplates.map(x => x.id === id ? { ...x, ...t, updatedAt: new Date().toISOString() } : x) })),
    duplicateFullTemplate: (id: string) => { const t = data.fullTemplates.find(x => x.id === id); if (!t) return; return value.createFullTemplate({ ...t, name: `${t.name} (Copy)` }); },
    deleteFullTemplate: (id: string) => setData(p => ({ ...p, fullTemplates: p.fullTemplates.filter(x => x.id !== id) })),
    createReportFromTemplate: (cid: string, tid: string) => {
      const template = data.fullTemplates.find(t => t.id === tid);
      if (!template) return undefined;
      
      const sections: ReportSection[] = template.sectionTemplateIds.map(sid => {
        const st = data.sectionTemplates.find(s => s.id === sid);
        if (!st) return null;
        return {
          id: createId("rs"),
          title: st.name,
          blocks: st.blocks.map(b => {
            if (b.type === "richText") {
              return { ...b, id: createId("blk"), content: deepCloneJson(ensureRichTextDoc((b as any).content)) };
            }
            return { ...b, id: createId("blk") };
          }),
        };
      }).filter(Boolean) as ReportSection[];

      const nr: Report = {
        id: createId("rp"),
        clientId: cid,
        title: `${template.name} - ${new Date().toLocaleDateString()}`,
        reportType: template.name,
        status: "Draft",
        sections,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setData(prev => ({ ...prev, reports: [nr, ...prev.reports] }));
      return nr;
    },
    updateReport: (id: string, r: any) => setData(p => ({ ...p, reports: p.reports.map(x => x.id === id ? { ...x, ...r, updatedAt: new Date().toISOString() } : x) })),
    duplicateReport: (id: string) => { const r = data.reports.find(x => x.id === id); if (!r) return; const nr = { ...r, id: createId("rp"), title: `${r.title} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, reports: [nr, ...p.reports] })); return nr; },
    deleteReport: (id: string) => setData(p => ({ ...p, reports: p.reports.filter(x => x.id !== id) })),
    updateReportSection: (rid: string, sid: string, d: any) => setData(p => ({ ...p, reports: p.reports.map(r => r.id === rid ? { ...r, sections: r.sections.map(s => s.id === sid ? { ...s, ...d } : s) } : r) })),
    reorderReportSections: (rid: string, sids: string[]) => setData(p => ({ ...p, reports: p.reports.map(r => r.id === rid ? { ...r, sections: sids.map(id => r.sections.find(s => s.id === id)!) } : r) })),
    updateAgencyOverview: (d: any) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq!, overview: { ...p.agencyHq!.overview, ...d } } })),
    updateAgencyAnnualProfitGoal: (g: number) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq!, annualProfitGoal: g } })),
    upsertAgencyProduct: (prod: any) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq!, products: prod.id ? p.agencyHq!.products.map(x => x.id === prod.id ? prod : x) : [...p.agencyHq!.products, { ...prod, id: createId("ap") }] } })),
    deleteAgencyProduct: (id: string) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq!, products: p.agencyHq!.products.filter(x => x.id !== id) } })),
    upsertAgencyExpense: (exp: any) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq!, expenses: exp.id ? p.agencyHq!.expenses.map(x => x.id === exp.id ? exp : x) : [...p.agencyHq!.expenses, { ...exp, id: createId("ae") }] } })),
    deleteAgencyExpense: (id: string) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq!, expenses: p.agencyHq!.expenses.filter(x => x.id !== id) } })),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};