"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Client, MonthlyMetric, MetricDefinition, ImaniData, 
  Campaign, Win, SectionTemplate, FullTemplate, Report,
  AgencyProduct, AgencyExpense 
} from '@/types/imani';

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
  const [data, setData] = useState<ImaniData>({
    clients: [], metricDefinitions: [], monthlyMetrics: [], campaigns: [],
    wins: [], sectionTemplates: [], fullTemplates: [], reports: [],
    agencyHq: { 
      overview: { 
        name: "", 
        description: "", 
        location: { city: "", state: "", country: "" }, 
        websiteUrl: "", 
        foundingDate: "", 
        employeeCount: 0, 
        annualMarketingBudget: 0 
      },
      annualProfitGoal: 0, 
      products: [], 
      expenses: [] 
    }
  });

  const h = {
    data,
    createClient: (c: any) => { const nc = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, clients: [...p.clients, nc] })); return nc; },
    updateClient: (id: string, c: any) => setData(p => ({ ...p, clients: p.clients.map(x => x.id === id ? { ...x, ...c, updatedAt: new Date().toISOString() } : x) })),
    deleteClient: (id: string) => setData(p => ({ ...p, clients: p.clients.filter(x => x.id !== id) })),
    createCampaign: (c: any) => setData(p => ({ ...p, campaigns: [...p.campaigns, { ...c, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }] })),
    updateCampaign: (id: string, c: any) => setData(p => ({ ...p, campaigns: p.campaigns.map(x => x.id === id ? { ...x, ...c, updatedAt: new Date().toISOString() } : x) })),
    deleteCampaign: (id: string) => setData(p => ({ ...p, campaigns: p.campaigns.filter(x => x.id !== id) })),
    createWin: (w: any) => setData(p => ({ ...p, wins: [...p.wins, { ...w, id: crypto.randomUUID() }] })),
    updateWin: (id: string, w: any) => setData(p => ({ ...p, wins: p.wins.map(x => x.id === id ? { ...x, ...w } : x) })),
    deleteWin: (id: string) => setData(p => ({ ...p, wins: p.wins.filter(x => x.id !== id) })),
    createMetricDefinition: (d: any) => setData(p => ({ ...p, metricDefinitions: [...p.metricDefinitions, { ...d, id: crypto.randomUUID() }] })),
    updateMetricDefinition: (id: string, d: any) => setData(p => ({ ...p, metricDefinitions: p.metricDefinitions.map(x => x.id === id ? { ...x, ...d } : x) })),
    deleteMetricDefinition: (id: string) => setData(p => ({ ...p, metricDefinitions: p.metricDefinitions.filter(x => x.id !== id) })),
    ensureStandardMetricsForClient: (cid: string) => {},
    upsertMonthlyMetric: (m: any) => {},
    bulkUpsertMonthlyMetrics: (m: any[]) => {},
    deleteMonthlyMetric: (id: string) => {},
    createSectionTemplate: (t: any) => { const nt = { ...t, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, sectionTemplates: [...p.sectionTemplates, nt] })); return nt; },
    updateSectionTemplate: (id: string, t: any) => setData(p => ({ ...p, sectionTemplates: p.sectionTemplates.map(x => x.id === id ? { ...x, ...t, updatedAt: new Date().toISOString() } : x) })),
    duplicateSectionTemplate: (id: string) => {},
    deleteSectionTemplate: (id: string) => {},
    createFullTemplate: (t: any) => { const nt = { ...t, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, fullTemplates: [...p.fullTemplates, nt] })); return nt; },
    updateFullTemplate: (id: string, t: any) => setData(p => ({ ...p, fullTemplates: p.fullTemplates.map(x => x.id === id ? { ...x, ...t, updatedAt: new Date().toISOString() } : x) })),
    duplicateFullTemplate: (id: string) => {},
    deleteFullTemplate: (id: string) => {},
    createReportFromTemplate: (cid: string, tid: string) => {},
    updateReport: (id: string, r: any) => setData(p => ({ ...p, reports: p.reports.map(x => x.id === id ? { ...x, ...r, updatedAt: new Date().toISOString() } : x) })),
    duplicateReport: (id: string) => { const r = data.reports.find(x => x.id === id); if (!r) return; const nr = { ...r, id: crypto.randomUUID(), title: `${r.title} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setData(p => ({ ...p, reports: [...p.reports, nr] })); return nr; },
    deleteReport: (id: string) => setData(p => ({ ...p, reports: p.reports.filter(x => x.id !== id) })),
    updateReportSection: (rid: string, sid: string, d: any) => {},
    reorderReportSections: (rid: string, sids: string[]) => {},
    updateAgencyOverview: (d: any) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq, overview: { ...p.agencyHq.overview!, ...d } } })),
    updateAgencyAnnualProfitGoal: (g: number) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq, annualProfitGoal: g } })),
    upsertAgencyProduct: (prod: any) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq, products: prod.id ? p.agencyHq.products.map(x => x.id === prod.id ? prod : x) : [...p.agencyHq.products, { ...prod, id: crypto.randomUUID() }] } })),
    deleteAgencyProduct: (id: string) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq, products: p.agencyHq.products.filter(x => x.id !== id) } })),
    upsertAgencyExpense: (exp: any) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq, expenses: exp.id ? p.agencyHq.expenses.map(x => x.id === exp.id ? exp : x) : [...p.agencyHq.expenses, { ...exp, id: crypto.randomUUID() }] } })),
    deleteAgencyExpense: (id: string) => setData(p => ({ ...p, agencyHq: { ...p.agencyHq, expenses: p.agencyHq.expenses.filter(x => x.id !== id) } })),
    resetToSeed: () => {}
  };

  return <DataContext.Provider value={h}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};