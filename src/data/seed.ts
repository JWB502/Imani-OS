import { createId } from "@/lib/id";
import type {
  AppData,
  FullTemplate,
  SectionBlock,
  SectionTemplate,
} from "@/types/imani";

function nowIso() {
  return new Date().toISOString();
}

function rich(label: string, content: string): SectionBlock {
  return { id: createId("blk"), type: "richText", label, content };
}

function checklist(label: string, items: string[]): SectionBlock {
  return {
    id: createId("blk"),
    type: "checklist",
    label,
    items: items.map((t) => ({ id: createId("chk"), text: t, checked: false })),
  };
}

function kpi(label: string, items: { name: string; value: string; unit?: string }[]): SectionBlock {
  return {
    id: createId("blk"),
    type: "kpi",
    label,
    items: items.map((i) => ({ id: createId("kpi"), ...i })),
  };
}

function score(label: string, value = 72): SectionBlock {
  return { id: createId("blk"), type: "score", label, value, max: 100 };
}

export function createSeedData(): AppData {
  const createdAt = nowIso();

  const sectionTemplates: SectionTemplate[] = [
    {
      id: createId("st"),
      name: "Cover Page",
      description: "A clean opener with context and report metadata.",
      blocks: [
        rich(
          "Cover Narrative",
          "Client: {{Client Name}}\nReport: {{Report Title}}\nPeriod: {{Report Period}}\nPrepared by: {{Analyst Name}}\nDate: {{Date}}",
        ),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Executive Summary",
      description: "High-level outcomes, key findings, and recommended next moves.",
      blocks: [
        rich(
          "Summary",
          "Write a crisp, decision-ready summary. Focus on impact, risks, and quick wins.",
        ),
        checklist("What leadership cares about", [
          "What changed this period",
          "Where we see leverage",
          "Biggest risks to address",
          "Next 30–90 day recommendations",
        ]),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Market Snapshot",
      description: "Market context, demand signals, and positioning notes.",
      blocks: [
        rich(
          "Snapshot Notes",
          "Primary Keyword: {{Primary Keyword}}\nLocation: {{City / State}}\n\nAdd quick market context and competitor notes.",
        ),
        kpi("Signals", [
          { name: "Search Demand", value: "—" },
          { name: "Competitive Density", value: "—" },
          { name: "Brand Advantage", value: "—" },
        ]),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Geo Grid Ranking",
      description: "Coverage + proximity-based visibility insights.",
      blocks: [
        score("Visibility Health Score", 68),
        rich(
          "Findings",
          "Summarize grid hotspots, weak zones, and recommended focus areas.",
        ),
        checklist("Quick checks", [
          "Primary category fit",
          "Service area settings",
          "Content relevance",
          "Review velocity",
        ]),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Google Business Profile",
      description: "Profile completeness, trust signals, and conversion setup.",
      blocks: [
        score("Profile Quality Score", 74),
        checklist("Profile checklist", [
          "Accurate categories",
          "Services / products updated",
          "UTM links in place",
          "Photos current",
          "Messaging configured",
        ]),
        rich(
          "Notes",
          "Document issues, opportunities, and recommended changes.",
        ),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Local Competitors",
      description: "Who outranks us and why — with practical takeaways.",
      blocks: [
        rich(
          "Competitor Notes",
          "List 3–5 competitors, their strengths, and the angle to win.",
        ),
        checklist("Leverage angles", [
          "Category positioning",
          "Review strategy",
          "On-site content gaps",
          "Offer clarity",
        ]),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Quick Wins",
      description: "High-impact, low-friction actions.",
      blocks: [
        checklist("Top quick wins", [
          "Fix critical profile issues",
          "Add missing service pages",
          "Improve follow-up speed",
          "Increase review requests",
        ]),
        rich(
          "Owner Notes",
          "Capture context, priority, and who owns each win.",
        ),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Workflow / Follow-Up Review",
      description: "Process friction, handoffs, and leakage points.",
      blocks: [
        score("Operations Readiness Score", 63),
        rich(
          "Findings",
          "Document intake, response time, follow-up cadence, and bottlenecks.",
        ),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "CRM Review",
      description: "Pipeline hygiene and tracking reliability.",
      blocks: [
        checklist("CRM essentials", [
          "Stage definitions clear",
          "Lead source captured",
          "Automations in place",
          "Owner assigned",
        ]),
        rich(
          "Notes",
          "What would make reporting and attribution more reliable?",
        ),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Automation Opportunities",
      description: "Practical automations to reduce lag and increase conversions.",
      blocks: [
        checklist("Opportunities", [
          "Instant lead routing",
          "SMS follow-up sequences",
          "Missed-call text-back",
          "Appointment reminders",
        ]),
        rich(
          "Implementation Notes",
          "Tools, ownership, and estimated time-to-value.",
        ),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "ROI Summary",
      description: "Month performance narrative and value framing.",
      blocks: [
        kpi("Headline KPIs", [
          { name: "Leads", value: "—" },
          { name: "Revenue", value: "—" },
          { name: "Estimated Value Created", value: "—" },
        ]),
        rich(
          "Narrative",
          "Explain what moved, why it matters, and what we’ll do next.",
        ),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("st"),
      name: "Recommendations",
      description: "Clear next steps with priority and rationale.",
      blocks: [
        checklist("Next 30–90 days", [
          "Stabilize tracking",
          "Improve conversion points",
          "Scale high-performing channels",
          "Operationalize follow-up",
        ]),
        rich(
          "Notes",
          "Write recommendations in a practical, strategic tone.",
        ),
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const stByName = new Map(sectionTemplates.map((s) => [s.name, s.id]));

  const fullTemplates: FullTemplate[] = [
    {
      id: createId("ft"),
      name: "Local Visibility Snapshot",
      description: "A fast visibility + opportunity report built from reusable sections.",
      sectionTemplateIds: [
        stByName.get("Cover Page")!,
        stByName.get("Executive Summary")!,
        stByName.get("Market Snapshot")!,
        stByName.get("Geo Grid Ranking")!,
        stByName.get("Google Business Profile")!,
        stByName.get("Local Competitors")!,
        stByName.get("Quick Wins")!,
        stByName.get("Recommendations")!,
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("ft"),
      name: "Operations Opportunity Report",
      description: "Workflow friction, automation opportunities, and ROI framing.",
      sectionTemplateIds: [
        stByName.get("Cover Page")!,
        stByName.get("Executive Summary")!,
        stByName.get("Workflow / Follow-Up Review")!,
        stByName.get("CRM Review")!,
        stByName.get("Automation Opportunities")!,
        stByName.get("ROI Summary")!,
        stByName.get("Recommendations")!,
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("ft"),
      name: "Google Business Profile Review",
      description: "Deep dive into profile quality, trust signals, and quick wins.",
      sectionTemplateIds: [
        stByName.get("Cover Page")!,
        stByName.get("Executive Summary")!,
        stByName.get("Google Business Profile")!,
        stByName.get("Quick Wins")!,
        stByName.get("Recommendations")!,
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("ft"),
      name: "Executive Dashboard Review",
      description: "Leadership-focused insights with ROI + operational highlights.",
      sectionTemplateIds: [
        stByName.get("Cover Page")!,
        stByName.get("Executive Summary")!,
        stByName.get("ROI Summary")!,
        stByName.get("Workflow / Follow-Up Review")!,
        stByName.get("Recommendations")!,
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: createId("ft"),
      name: "Monthly Insights Summary",
      description: "A compact monthly narrative with ROI + wins.",
      sectionTemplateIds: [
        stByName.get("Cover Page")!,
        stByName.get("ROI Summary")!,
        stByName.get("Quick Wins")!,
        stByName.get("Recommendations")!,
      ],
      archived: false,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  return {
    clients: [
      {
        id: createId("cl"),
        name: "Sample Client — North Star Nonprofit",
        organizationType: "Nonprofit",
        contactName: "Jordan Rivera",
        contactEmail: "jordan@nstar.org",
        contactPhone: "(555) 212-3939",
        website: "https://northstar.example",
        crmUsed: "HubSpot",
        status: "Active",
        startDate: new Date().toISOString().slice(0, 10),
        tags: ["retainer", "local"],
        serviceTypes: ["Local SEO", "Operations"],
        industry: "Community Services",
        city: "Indianapolis",
        state: "IN",
        monthlyRetainer: 3500,
        oneTimeProjectValue: 0,
        totalLifetimeValue: 17500,
        notes: "Internal sample client used to demonstrate Imani OS.",
        internalContext:
          "Leadership cares about impact reporting and donor conversion. Follow-up speed is a known bottleneck.",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    wins: [],
    sectionTemplates,
    fullTemplates,
    reports: [],
    metricDefinitions: [],
    monthlyMetrics: [],
  };
}
