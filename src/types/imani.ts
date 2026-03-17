export type ID = string;

export type UserRole = "admin" | "editor";

export type User = {
  id: ID;
  name: string;
  email: string;
  role: UserRole;
};

export type ClientStatus = "Lead" | "Active" | "Paused" | "Former";

export type Client = {
  id: ID;
  name: string;
  privacyId?: string;
  organizationType?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  crmUsed?: string;
  status: ClientStatus;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  notes?: string;
  tags: string[];
  serviceTypes: string[];
  industry?: string;
  city?: string;
  state?: string;
  monthlyRetainer?: number;
  oneTimeProjectValue?: number;
  totalLifetimeValue?: number;
  internalContext?: string;
  includeInAgencyImpact?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WinCategory =
  | "Visibility"
  | "Operations"
  | "Automation"
  | "Revenue"
  | "Donations"
  | "Reviews"
  | "Other";

export type Win = {
  id: ID;
  clientId: ID;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  category: WinCategory;
  beforeAfter?: string;
  measurableResult?: string;
  tags: string[];
  caseStudyPotential: boolean;
  linkedReportId?: ID;
  linkedMetricMonth?: string; // YYYY-MM
  createdAt: string;
  updatedAt: string;
};

export type ReportStatus = "Draft" | "Complete";

export type ChecklistItem = { id: ID; text: string; checked: boolean };
export type KPIItem = { id: ID; name: string; value: string; unit?: string };

export type SectionBlock =
  | {
      id: ID;
      type: "richText";
      label: string;
      content: string;
    }
  | {
      id: ID;
      type: "checklist";
      label: string;
      items: ChecklistItem[];
    }
  | {
      id: ID;
      type: "score";
      label: string;
      value: number;
      max: number;
      note?: string;
    }
  | {
      id: ID;
      type: "kpi";
      label: string;
      items: KPIItem[];
    }
  | {
      id: ID;
      type: "table";
      label: string;
      columns: string[];
      rows: string[][];
    }
  | {
      id: ID;
      type: "image";
      label: string;
      url: string;
      caption?: string;
    };

export type SectionTemplate = {
  id: ID;
  name: string;
  description?: string;
  blocks: SectionBlock[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FullTemplate = {
  id: ID;
  name: string;
  description?: string;
  sectionTemplateIds: ID[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReportSection = {
  id: ID;
  title: string;
  sectionTemplateId?: ID;
  blocks: SectionBlock[];
  internalNotes?: string;
};

export type Report = {
  id: ID;
  clientId: ID;
  fullTemplateId?: ID;
  title: string;
  reportType: string;
  createdAt: string;
  reportingPeriod?: string; // e.g. 2026-02
  status: ReportStatus;
  analyst?: string;
  internalNotes?: string;
  executiveSummary?: string;
  nextSteps?: string;
  sections: ReportSection[];
  updatedAt: string;
};

export type MetricDefinition = {
  id: ID;
  clientId: ID;
  name: string;
  unit?: string;
  kind: "number" | "currency" | "percent";
  locked?: boolean;
  isStandard?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MonthlyMetric = {
  id: ID;
  clientId: ID;
  month: string; // YYYY-MM
  values: Record<ID, number>; // metricDefinitionId -> value
  includeInAgencyImpact?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignResult = { id: ID; name: string; value: number; unit?: string };

export type ManagementType = "DIY" | "DWY" | "DFY";

export type Campaign = {
  id: ID;
  clientId: ID;
  title?: string;
  channel: string;
  managementType: ManagementType;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  budget?: number;
  adSpend?: number;
  income?: number;
  results: CampaignResult[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  agencyName: string;
  openAiApiKey?: string;
  openAiModel: string;
  redactionStyle: "initial" | "iaid";
  analysts: string[];
  pdfPageNumbers: boolean;
};

export type AppData = {
  clients: Client[];
  wins: Win[];
  campaigns: Campaign[];
  sectionTemplates: SectionTemplate[];
  fullTemplates: FullTemplate[];
  reports: Report[];
  metricDefinitions: MetricDefinition[];
  monthlyMetrics: MonthlyMetric[];
  agencyHq?: AgencyHq;
};

export type AgencyHq = {
  overview: AgencyOverview;
  products: AgencyProduct[];
  expenses: AgencyExpense[];
  annualProfitGoal?: number;
};

export type AgencyOverview = {
  name: string;
  description: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  websiteUrl: string;
  foundingDate: string;
  employeeCount: number;
  annualMarketingBudget: number;
};

export type PricingModel = "one-time" | "monthly" | "quarterly" | "semi-annually" | "annually";
export type ProductType = "product" | "service";

export type AgencyProduct = {
  id: ID;
  name: string;
  description: string;
  type: ProductType;
  pricingModel: PricingModel;
  price: number;
  activeClients: number; // For recurring revenue tracking
  projectedSales: number; // For Goal & Projections
};

export type ExpenseCategory =
  | "Software/SaaS"
  | "Payroll"
  | "Marketing"
  | "Rent/Office"
  | "Taxes"
  | "Legal/Professional"
  | "Other";

export type BillingCycle = "monthly" | "quarterly" | "semi-annually" | "annually";

export type AgencyExpense = {
  id: ID;
  name: string;
  description: string;
  category: ExpenseCategory;
  billingCycle: BillingCycle;
  cost: number;
};
