export type UserRole = 'Admin' | 'Analyst' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AppSettings {
  agencyName: string;
  agencyLogo?: string;
  primaryColor: string;
  redactionStyle: 'block' | 'blur' | 'none';
  pdfPageNumbers: boolean;
  aiEnabled: boolean;
}

export type ClientStatus = 'active' | 'inactive' | 'Lead' | 'Paused';

export interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive'; // Kept for logic, but UI uses more
  organizationType?: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  tags: string[];
  serviceTypes: string[];
  crmUsed?: string;
  startDate?: string;
  endDate?: string;
  dashboardUrl?: string;
  pmUrl?: string;
  notes?: string;
  internalContext?: string;
  monthlyRetainer?: number;
  oneTimeProjectValue?: number;
  totalLifetimeValue: number;
  privacyId?: string;
  includeInAgencyImpact?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ManagementType = 'DFY' | 'DWY' | 'Consulting';

export interface CampaignResult {
  id: string;
  name: string;
  value: number;
  label?: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  title: string;
  channel: string;
  managementType: ManagementType;
  status: 'planned' | 'active' | 'completed';
  startDate: string;
  endDate?: string;
  budget: number;
  adSpend: number;
  income: number;
  notes?: string;
  results: CampaignResult[];
  updatedAt: string;
}

export interface Win {
  id: string;
  clientId: string;
  title: string;
  description: string;
  date: string;
  category: string;
  measurableResult?: string;
  beforeAfter?: string;
  tags: string[];
  caseStudyPotential?: boolean;
  linkedReportId?: string;
}

export interface SectionBlock {
  id: string;
  type: 'text' | 'kpis' | 'checklist' | 'image' | 'chart';
  content: any;
}

export interface KPIItem {
  id: string;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface SectionTemplate {
  id: string;
  name: string;
  description?: string;
  blocks: SectionBlock[];
  archived?: boolean;
  updatedAt: string;
}

export interface FullTemplate {
  id: string;
  name: string;
  description?: string;
  sectionTemplateIds: string[];
  archived?: boolean;
  updatedAt: string;
}

export interface Report {
  id: string;
  clientId: string;
  title: string;
  reportType: string;
  reportingPeriod: string;
  status: 'draft' | 'published';
  analyst?: string;
  executiveSummary?: string;
  nextSteps?: string;
  internalNotes?: string;
  pdfPageNumbers?: boolean;
  sections: any[];
  createdAt: string;
  updatedAt: string;
}

export type ProductType = 'service' | 'product';
export type PricingModel = 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'one-time';
export type BillingCycle = 'monthly' | 'quarterly' | 'semi-annually' | 'annually';
export type ExpenseCategory = 'Software/SaaS' | 'Contractors' | 'Ad Spend' | 'Operations' | 'Other';

export interface AgencyProduct {
  id: string;
  name: string;
  description?: string;
  type: ProductType;
  pricingModel: PricingModel;
  price: number;
  activeClients: number;
  projectedSales: number;
}

export interface AgencyExpense {
  id: string;
  name: string;
  description?: string;
  category: ExpenseCategory;
  billingCycle: BillingCycle;
  cost: number;
}

export interface AgencyHq {
  overview?: {
    name: string;
    description: string;
    location: { city: string; state: string };
    websiteUrl: string;
    foundingDate: string;
    employeeCount: number;
    annualMarketingBudget: number;
  };
  annualProfitGoal: number;
  products: AgencyProduct[];
  expenses: AgencyExpense[];
}

export interface ImaniData {
  clients: Client[];
  metricDefinitions: MetricDefinition[];
  monthlyMetrics: MonthlyMetric[];
  campaigns: Campaign[];
  wins: Win[];
  sectionTemplates: SectionTemplate[];
  fullTemplates: FullTemplate[];
  reports: Report[];
  agencyHq: AgencyHq;
}

export type AppData = ImaniData; // Alias for legacy usage