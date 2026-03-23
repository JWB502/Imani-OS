export type UserRole = "admin" | "editor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PdfExportOptions {
  showHeader: boolean;
  showFooter: boolean;
  showPageNumbers: boolean;
  showDate: boolean;
  showAgencyName: boolean;
  showClientName: boolean;
  showReportTitle: boolean;
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
  pdfExportOptions?: PdfExportOptions;
}

export type ClientStatus = "Lead" | "Active" | "Paused" | "Former";
export type BillingType = "Retainer" | "Project" | "Other";

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
  "Other",
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
  billingType?: BillingType;
  status: ClientStatus;
  rating?: number;
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
  | { id: string; type: "richText"; label: string; content: any }
  | { id: string; type: "checklist"; label: string; items: ChecklistItem[] }
  | { id: string; type: "score"; label: string; value: number; max: number; note?: string }
  | { id: string; type: "kpi"; label: string; items: KPIItem[] }
  | { id: string; type: "table"; label: string; columns: string[]; rows: string[][] }
  | {
      id: string;
      type: "image";
      label: string;
      url: string;
      caption?: string;
      widthPct?: number;
      fit?: "contain" | "cover";
    }
  | { id: string; type: "select"; label: string; options: string[]; value?: string }
  | { id: string; type: "progress"; label: string; value: number };

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
export type DocumentTemplateKind = "template" | "fragment";
export type DocumentStatusTone = "neutral" | "info" | "success" | "warning" | "danger";
export type DocumentCalloutTone = "info" | "success" | "warning" | "danger";
export type DocumentBlockType =
  | "paragraph"
  | "heading"
  | "toggle"
  | "callout"
  | "checklist"
  | "status"
  | "score"
  | "progress"
  | "kpiGrid"
  | "table"
  | "media"
  | "divider";

interface DocumentBlockBase<T extends DocumentBlockType, P> {
  id: string;
  type: T;
  label?: string;
  props: P;
}

export type ParagraphBlock = DocumentBlockBase<"paragraph", { content: any }>;
export type HeadingBlock = DocumentBlockBase<"heading", { level: 1 | 2 | 3; content: any }>;
export type ToggleBlock = DocumentBlockBase<"toggle", { title: string; content: any; open?: boolean }>;
export type CalloutBlock = DocumentBlockBase<"callout", { title: string; tone: DocumentCalloutTone; content: any }>;
export type ChecklistBlock = DocumentBlockBase<"checklist", { items: ChecklistItem[] }>;
export type StatusBlock = DocumentBlockBase<"status", { value: string; options: string[]; tone: DocumentStatusTone }>;
export type ScoreBlock = DocumentBlockBase<"score", { value: number; max: number; note?: string }>;
export type ProgressBlock = DocumentBlockBase<"progress", { value: number; max: number }>;
export type KpiGridBlock = DocumentBlockBase<"kpiGrid", { items: KPIItem[] }>;
export type TableBlock = DocumentBlockBase<"table", { columns: string[]; rows: string[][]; database: boolean }>;
export type MediaBlock = DocumentBlockBase<"media", { url: string; caption?: string; widthPct?: number; fit?: "contain" | "cover" }>;
export type DividerBlock = DocumentBlockBase<"divider", Record<string, never>>;

export type DocumentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ToggleBlock
  | CalloutBlock
  | ChecklistBlock
  | StatusBlock
  | ScoreBlock
  | ProgressBlock
  | KpiGridBlock
  | TableBlock
  | MediaBlock
  | DividerBlock;

export interface DocumentPage {
  id: string;
  parentId: string | null;
  title: string;
  icon?: string;
  coverUrl?: string;
  coverImagePosition?: string;
  order: number;
  blocks: DocumentBlock[];
  isPdf?: boolean;
  pdfData?: string; // base64
}

export interface MigrationMeta {
  legacySourceType?: "sectionTemplate" | "fullTemplate" | "report";
  legacySourceId?: string;
  migrationWarnings?: string[];
}

export interface DocumentTemplate extends MigrationMeta {
  id: string;
  kind: DocumentTemplateKind;
  name: string;
  description?: string;
  archived: boolean;
  pages: DocumentPage[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentReport extends MigrationMeta {
  id: string;
  clientId: string;
  title: string;
  reportType: string;
  templateSourceId?: string;
  reportingPeriod?: string;
  status: ReportStatus;
  analyst?: string;
  executiveSummary?: string;
  nextSteps?: string;
  internalNotes?: string;
  pdfPageNumbers?: boolean;
  pdfExportOptions?: PdfExportOptions;
  pages: DocumentPage[];
  createdAt: string;
  updatedAt: string;
}

export type Report = DocumentReport;

export interface LegacyDataBucket {
  sectionTemplates: SectionTemplate[];
  fullTemplates: FullTemplate[];
  reports: Array<{
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
  }>;
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

export interface KeyPerson {
  id: string;
  name: string;
  role: string;
  bio: string;
  education?: string;
  certifications?: string;
  resumeData?: string; // base64
  resumeFileName?: string;
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
  keyPersonnel: KeyPerson[];
}

export interface AppData {
  schemaVersion: 2;
  clients: Client[];
  wins: Win[];
  campaigns: Campaign[];
  documentTemplates: DocumentTemplate[];
  reports: DocumentReport[];
  metricDefinitions: MetricDefinition[];
  monthlyMetrics: MonthlyMetric[];
  agencyHq?: AgencyHq;
  legacy?: LegacyDataBucket;
  sectionTemplates?: SectionTemplate[];
  fullTemplates?: FullTemplate[];
}

export type ImaniData = AppData;