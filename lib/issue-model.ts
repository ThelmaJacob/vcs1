// Domain model for the Public Affairs — Value Capture System (VCS).
// Reconstructed from the original Power Apps canvas app.

export type DivisionCode = "CO" | "PH" | "CH" | "CS";

export const DIVISIONS: { code: DivisionCode; label: string }[] = [
  { code: "CO", label: "Corporate" },
  { code: "PH", label: "Pharmaceuticals" },
  { code: "CH", label: "Consumer Health" },
  { code: "CS", label: "Crop Science" },
];

export const BUSINESS_AREAS = [
  "Compliance & Corporate Governance",
  "Finance, Tax & Accounting",
  "Geo-Political & Economical",
  "Legal & Intellectual Property",
  "Market Development",
  "Marketing, Sales & Distribution",
  "Product Safety & Stewardship",
  "Registration & Market Access",
  "Reputation Management",
  "Sustainability & Environment",
  "Trade Agreements & Tariffs",
] as const;

export const FUNNEL_STAGES = [
  "Issue Management",
  "Proactive Shaping",
  "Crisis Management",
  "Thought Leadership",
] as const;

export const ACTIONABILITIES = ["Possible", "Likely", "Very Likely"] as const;

export const UNIQUENESS = [
  "No Value Selected",
  "Industry Issue",
  "Cross-Industry Issue",
  "Bayer Owned",
  "Bayer is Frontrunner",
] as const;

export const IMPACT_LEVELS = ["None", "Low", "Medium", "High", "Very High"] as const;

export const BUSINESS_UNITS = [
  "Not Applicable",
  "Cross-Divisional",
  "Other / Several",
  "Business Unit A",
  "Business Unit B",
  "Business Unit C",
] as const;

export const FINANCIAL_IMPACT_DRIVERS = [
  "CapEx",
  "COGS",
  "Fine",
  "OpEx",
  "Price",
  "Sales",
  "Subsidy",
] as const;

export const FINANCIAL_IMPACT_DRIVER_HELP: Record<string, string> = {
  CapEx: "Capital expenditures — funds used to buy, upgrade or maintain physical assets (e.g. buildings, equipment).",
  COGS: "Cost of goods sold — direct costs of producing the goods sold, including materials and labour.",
  Fine: "Monetary penalty imposed on the company.",
  OpEx: "Operational expenditures — regular costs of running day-to-day operations (e.g. sales, rent, utilities).",
  Price: "Changes in the price level of a product or service that affect financial performance.",
  Sales: "Money earned from selling products or services.",
  Subsidy: "Financial assistance from a government or another organisation that reduces the cost of a product or service.",
};

export const IMPACT_TYPES = [
  "Value Protected",
  "Value Created",
  "Value Lost",
  "No Financial Impact",
] as const;

export type BusinessArea = (typeof BUSINESS_AREAS)[number];
export type FunnelStage = (typeof FUNNEL_STAGES)[number];
export type Actionability = (typeof ACTIONABILITIES)[number];
export type Uniqueness = (typeof UNIQUENESS)[number];
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];
export type FinancialImpactDriver = (typeof FINANCIAL_IMPACT_DRIVERS)[number];
export type ImpactType = (typeof IMPACT_TYPES)[number];

export interface DivisionAssessment {
  businessUnit: string;
  impact: ImpactLevel;
  policyPressurePoint: boolean;
}

export interface Attachment {
  name: string;
  kind: "docx" | "xlsx" | "pptx" | "pdf";
  size: string;
  addedOn: string;
}

export interface Issue {
  id: string;
  issueNo: number;

  // Definition
  title: string;
  country: string; // ISO-2
  lead: string;
  team: string[];
  description: string;

  // Categorization
  divisions: DivisionCode[];
  leadDivision: DivisionCode | null;
  businessArea: BusinessArea | "";
  actionability: Actionability | "";
  funnelStage: FunnelStage | "";
  uniqueness: Uniqueness;
  assessments: Record<DivisionCode, DivisionAssessment>;
  qualitativeImpact: ImpactLevel | "";
  financialImpactDriver: FinancialImpactDriver | "";

  // Scenarios (values in million EUR)
  worstCaseRisk: string;
  worstCaseSalesValue: number | null;
  worstCaseCashFlow: number | null;
  bestCaseOpportunity: string;
  bestCaseSalesValue: number | null;
  bestCaseCashFlow: number | null;

  // Closure
  closed: boolean;
  closureImpactType: ImpactType | "";
  closureDriver: FinancialImpactDriver | "";
  closureDate: string | null;
  closureDescription: string;
  closureSalesValue: number | null;
  closureCashFlow: number | null;

  attachments: Attachment[];

  locked: boolean;
  createdAt: string;
  lastUpdate: string;
  lastUpdateBy: string;
}

export const EMPTY_ASSESSMENTS: Record<DivisionCode, DivisionAssessment> = {
  CO: { businessUnit: "Not Applicable", impact: "None", policyPressurePoint: false },
  PH: { businessUnit: "Not Applicable", impact: "None", policyPressurePoint: false },
  CH: { businessUnit: "Not Applicable", impact: "None", policyPressurePoint: false },
  CS: { businessUnit: "Not Applicable", impact: "None", policyPressurePoint: false },
};

/** Every field a record must carry. Partial input is completed against this. */
export const BLANK_ISSUE: Omit<Issue, "id" | "issueNo" | "createdAt"> = {
  title: "",
  country: "",
  lead: "",
  team: [],
  description: "",
  divisions: [],
  leadDivision: null,
  businessArea: "",
  actionability: "",
  funnelStage: "",
  uniqueness: "No Value Selected",
  assessments: EMPTY_ASSESSMENTS,
  qualitativeImpact: "",
  financialImpactDriver: "",
  worstCaseRisk: "",
  worstCaseSalesValue: null,
  worstCaseCashFlow: null,
  bestCaseOpportunity: "",
  bestCaseSalesValue: null,
  bestCaseCashFlow: null,
  closed: false,
  closureImpactType: "",
  closureDriver: "",
  closureDate: null,
  closureDescription: "",
  closureSalesValue: null,
  closureCashFlow: null,
  attachments: [],
  locked: false,
  lastUpdate: "",
  lastUpdateBy: "",
};

/**
 * Every monetary field is a positive magnitude: the worst case holds how much is
 * at risk, the best case how much is to be gained. The value at stake is what
 * hangs on the issue in either direction, so it is their sum and never negative.
 */
export function scenarioVas(i: Issue): number | null {
  if (i.bestCaseSalesValue === null && i.worstCaseSalesValue === null) return null;
  return Math.abs(i.bestCaseSalesValue ?? 0) + Math.abs(i.worstCaseSalesValue ?? 0);
}

/** Value at Stake shown in the table: the realised value once closed, the scenario spread before. */
export function issueVas(i: Issue): number | null {
  if (i.closed && i.closureSalesValue !== null) return Math.abs(i.closureSalesValue);
  return scenarioVas(i);
}

export function daysSince(date: string): number {
  const ms = Date.now() - new Date(date + "T00:00:00Z").getTime();
  return Math.floor(ms / 86_400_000);
}

export const STALE_AFTER_DAYS = 60;

export function isStale(i: Issue): boolean {
  return !i.closed && daysSince(i.lastUpdate) > STALE_AFTER_DAYS;
}

/** Per-tab completion, driving the green check / amber marker on the tab bar. */
export function tabCompletion(i: Issue): Record<string, boolean> {
  const filled = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== "";
  return {
    Definition:
      filled(i.title) && filled(i.country) && filled(i.lead) && filled(i.description),
    Categorization:
      filled(i.businessArea) &&
      filled(i.actionability) &&
      filled(i.funnelStage) &&
      i.uniqueness !== "No Value Selected" &&
      filled(i.qualitativeImpact) &&
      filled(i.financialImpactDriver),
    Scenarios:
      filled(i.worstCaseRisk) &&
      filled(i.bestCaseOpportunity) &&
      i.worstCaseSalesValue !== null &&
      i.bestCaseSalesValue !== null,
    Closure: i.closed && filled(i.closureDescription) && filled(i.closureImpactType),
    Attachments: (i.attachments?.length ?? 0) > 0,
  };
}

/** Blocking checks for "Close & Save Issue". */
export function closureBlockers(i: Issue): string[] {
  const missing: string[] = [];
  if (!i.closureDescription?.trim()) missing.push("Description");
  if (!i.closureImpactType) missing.push("Impact Type");
  if (!i.closureDriver) missing.push("Financial Impact Driver at Closure");
  if (!i.closureDate) missing.push("Closure Date");
  return missing;
}

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CH", name: "Switzerland" },
  { code: "CN", name: "China" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "ET", name: "Ethiopia" },
  { code: "FR", name: "France" },
  { code: "GL", name: "Global" },
  { code: "IE", name: "Ireland" },
  { code: "IN", name: "India" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "PE", name: "Peru" },
  { code: "PL", name: "Poland" },
  { code: "SK", name: "Slovakia" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "UK", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "ZA", name: "South Africa" },
];

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
