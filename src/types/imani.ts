export type UserRole = "admin" | "editor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AppSettings {
  agencyName: string;
  openAiApiKey?: string;
  openRouterApiKey?: string;
  openAiModel: string;
  aiProvider: "openai" | "openrouter";
  redactionStyle: "iaid" | "initial";
  analysts: string[];
  pdfPageNumbers: boolean;
}

export type ClientStatus = "Lead" | "Active" | "Paused" | "Former";

export const INDUSTRIES = [
  "Nonprofit",
  "Technology",
  "Healthcare",
  "Education",
  "Real Estate",
  "Finance",
  "Retail",
  "Manufacturing",
  "Legal",
  "Hospitality",
  "E-commerce",
  "Marketing/Media",
  "Local Service Business",
  "Other"
] as const;

export interface Client {
  id: string;
  name: string;
  organizationType?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  dashboardUrl?: string;
  pmUrl?: string;
  crmUsed?: string;
  status: ClientStatus;
  startDate?: string;
  endDate?: string;
  tags: string[];
  serviceTypes: string[];
  industry?: string;
  city?: string;
  state?: string;
  monthlyRetainer?: number;
  oneTimeProjectValue?: number;
  totalLifetimeValue: number;
  includeInAgencyImpact?: boolean;

  // Time-Cost Analysis
  enableTimeCostAnalysis?: boolean;
  avgHoursSavedPerMonth?: number;
  hourlyValue?: number;

  notes?: string;
  internalContext?: string;
  privacyId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ManagementType = "DIY" | "DWY" | "DFY";

export interface CampaignResult {
  id: string;
  name: string;
  value: number;
  unit?: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  title: string;
  channel: string;
  managementType: ManagementType;
  startDate?: string;
  endDate?: string;
  budget?: number;
  adSpend?: number;
  income?: number;
  notes?: string;
  results: CampaignResult[];
  createdAt: string;
  updatedAt: string;
}

export type WinCategory =
  | "Visibility"
  | "Operations"
  | "Automation"
  | "Revenue"
  | "Donations"
  | "Reviews"
  | "Other";

export interface Win {
  id: string;
  clientId: string;
  title: string;
  description: string;
  date: string;
  category: WinCategory;
  beforeAfter?: string;
  measurableResult?: string;
  tags: string[];
  caseStudyPotential: boolean;
  linkedReportId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface KPIItem {
  id: string;
  name: string;
  value: string;
  unit?: string;
}

export type SectionBlock =
  | { id: string; type: "richText"; label: string; content: string }
  | { id: string; type: "checklist"; label: string; items: ChecklistItem[] }
  | { id: string; type: "score"; label: string; value: number; max: number; note?: string }
  | { id: string; type: "kpi"; label: string; items: KPIItem[] }
  | { id: string; type: "table"; label: string; columns: string[]; rows: string[][] }
  | { id: string; type: "image"; label: string; url: string; caption?: string };

export interface SectionTemplate {
  id: string;
  name: string;
  description?: string;
  blocks: SectionBlock[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FullTemplate {
  id: string;
  name: string;
  description?: string;
  sectionTemplateIds: string[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSection {
  id: string;
  title: string;
  blocks: SectionBlock[];
  internalNotes?: string;
}

export type ReportStatus = "Draft" | "Complete";

export interface Report {
  id: string;
  clientId: string;
  title: string;
  reportType: string;
  reportingPeriod?: string;
  status: ReportStatus;
  analyst?: string;
  executiveSummary?: string;
  nextSteps?: string;
  internalNotes?: string;
  pdfPageNumbers?: boolean;
  sections: ReportSection[];
  createdAt: string;
  updatedAt: string;
}

export interface MetricDefinition {
  id: string;
  clientId: string;
  name: string;
  kind: "currency" | "percent" | "number";
  isStandard?: boolean;
}

export interface MonthlyMetric {
  id: string;
  clientId: string;
  month: string;
  values: Record<string, number | undefined>;
  notes?: string;
  includeInAgencyImpact?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductType = "service" | "product";
export type PricingModel = "monthly" | "quarterly" | "semi-annually" | "annually" | "one-time";
export type BillingCycle = "monthly" | "quarterly" | "semi-annually" | "annually";
export type ExpenseCategory =
  | "Software/SaaS"
  | "Payroll"
  | "Marketing"
  | "Rent/Office"
  | "Taxes"
  | "Legal/Professional"
  | "Other";

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
  overview: {
    name: string;
    description: string;
    location: { city: string; state: string; country: string };
    websiteUrl: string;
    foundingDate: string;
    employeeCount: number;
    annualMarketingBudget: number;
  };
  annualProfitGoal: number;
  products: AgencyProduct[];
  expenses: AgencyExpense[];
}

export interface AppData {
  clients: Client[];
  wins: Win[];
  campaigns: Campaign[];
  sectionTemplates: SectionTemplate[];
  fullTemplates: FullTemplate[];
  reports: Report[];
  metricDefinitions: MetricDefinition[];
  monthlyMetrics: MonthlyMetric[];
  agencyHq?: AgencyHq;
}

export type ImaniData = AppData;