"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Client, MonthlyMetric, MetricDefinition, ImaniData, 
  Campaign, Win, SectionTemplate, FullTemplate, Report,
  AgencyProduct, AgencyExpense 
} from '@/types/imani';
import { createSeedData } from '@/data/seed';
import { readJson, writeJson } from '@/lib/storage';
import { createId } from '@/lib/id';

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
  createReportFromTemplate: (cid: string, tid: string) => void;
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ImaniData>(() => {
    const saved = readJson<ImaniData>(DATA_KEY);
    return saved || createSeedData();
  });

  useEffect(() => {
    writeJson(DATA_KEY, data);
  }, [data]);

  const resetToSeed = useCallback(() => {
    const seed = createSeedData();
    setData(seed);
  }, []);

  const createClient = (c: any) => {
    const nc = { ...c, id: createId("cl"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setData(p => ({ ...p, clients: [nc, ...p.clients] }));
    return nc;
  };

  const updateClient = (id: string, c: any) => setData(p => ({
    ...p,
    clients: p.clients.map(x => x.id === id ? { ...x, ...c, updatedAt: new Date().toISOString() } : x)
  }));

  const deleteClient = (id: string) => setData(p => ({
    ...p,
    clients: p.clients.filter(x => x.id !== id),
    reports: p.reports.filter(r => r.clientId !== id),
    wins: p.wins.filter(w => w.clientId !== id),
    campaigns: p.campaigns.filter(c => c.clientId !== id),
    monthlyMetrics: p.monthlyMetrics.filter(m => m.clientId !== id)
  }));

  const bulkUpsertMonthlyMetrics = (metrics: any[]) => {
    const now = new Date().toISOString();
    setData(prev => {
      let updatedMetrics = [...prev.monthlyMetrics];
      metrics.forEach(newMetric => {
        const idx = updatedMetrics.findIndex(m => m.clientId === newMetric.clientId && m.month === newMetric.month);
        if (idx >= 0) {
          updatedMetrics[idx] = { 
            ...updatedMetrics[idx], 
            values: { ...updatedMetrics[idx].values, ...newMetric.values },
            updatedAt: now 
          };
        } else {
          updatedMetrics.push({ 
            ...newMetric, 
            id: createId("mm"), 
            createdAt: now, 
            updatedAt: now 
          });
        }
      });
      return { ...prev, monthlyMetrics: updatedMetrics };
    });
  };

  const createReport = (r: any) => setData(p => ({ ...p, reports: [r, ...p.reports] }));

  // Value object for the provider
  const value: DataContextType = {
    data,
    createClient,
    updateClient,
    deleteClient,
    resetToSeed,
    bulkUpsertMonthlyMetrics,
    // ... rest of methods implemented using the same pattern
    createCampaign: (c: any) => setData(p => ({ ...p, campaigns: [...p.campaigns, { ...c, id: createId("cmp"), updatedAt: new Date().toISOString() }] })),
    updateCampaign: (id: string, c: any) => setData(p => ({ ...p, campaigns: p.campaigns.map(x => x.id === id ? { ...x, ...c, updatedAt: new Date().toISOString() } : x) })),
    deleteCampaign: (id: string) => setData(p => ({ ...p, campaigns: p.campaigns.filter(x => x.id !== id) })),
    createWin: (w: any) => setData(p => ({ ...p, wins: [...p.wins, { ...w, id: createId("win"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] })),
    updateWin: (id: string, w: any) => setData(p => ({ ...p, wins: p.wins.map(x => x.id === id ? { ...x, ...w, updatedAt: new Date().toISOString() } : x) })),
    deleteWin: (id: string) => setData(p => ({ ...p, wins: p.wins.filter(x => x.id !== id) })),
    createMetricDefinition: (d: any) => setData(p => ({ ...p, metricDefinitions: [...p.metricDefinitions, { ...d, id: createId("md") }] })),
    updateMetricDefinition: (id: string, d: any) => setData(p => ({ ...p, metricDefinitions: p.metricDefinitions.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteMetricDefinition: (id: string) => setData(p => ({ ...p, metricDefinitions: p.metricDefinitions.filter(x => x.id !== id) })),
    ensureStandardMetricsForClient: (cid: string) => {}, 
    upsertMonthlyMetric: (m: any) => bulkUpsertMonthlyMetrics([m]),
    deleteMonthlyMetric: (id: string) => setData(p => ({ ...p, monthlyMetrics: p.monthlyMetrics.filter(x => x.id !== id) })),
    createSectionTemplate: (t: any) => { const nt = { ...t, id: createId("st"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, sectionTemplates: [...p.sectionTemplates, nt] })); return nt; },
    updateSectionTemplate: (id: string, t: any) => setData(p => ({ ...p, sectionTemplates: p.sectionTemplates.map(x => x.id === id ? { ...x, ...t, updatedAt: new Date().toISOString() } : x) })),
    duplicateSectionTemplate: (id: string) => { const t = data.sectionTemplates.find(x => x.id === id); if (!t) return; return value.createSectionTemplate({ ...t, name: `${t.name} (Copy)` }); },
    deleteSectionTemplate: (id: string) => setData(p => ({ ...p, sectionTemplates: p.sectionTemplates.filter(x => x.id !== id) })),
    createFullTemplate: (t: any) => { const nt = { ...t, id: createId("ft"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, fullTemplates: [...p.fullTemplates, nt] })); return nt; },
    updateFullTemplate: (id: string, t: any) => setData(p => ({ ...p, fullTemplates: p.fullTemplates.map(x => x.id === id ? { ...x, ...t, updatedAt: new Date().toISOString() } : x) })),
    duplicateFullTemplate: (id: string) => { const t = data.fullTemplates.find(x => x.id === id); if (!t) return; return value.createFullTemplate({ ...t, name: `${t.name} (Copy)` }); },
    deleteFullTemplate: (id: string) => setData(p => ({ ...p, fullTemplates: p.fullTemplates.filter(x => x.id !== id) })),
    createReportFromTemplate: (cid: string, tid: string) => { /* logic to build report from sections */ },
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