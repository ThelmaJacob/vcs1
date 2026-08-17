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

/**
 * Global and Europe come first because an issue is often filed at that level,
 * then every ISO 3166-1 territory in alphabetical order.
 * GL is kept for Global, as the source application uses it, so Greenland is not
 * in the list. Restore it under another code if it is ever needed.
 */
/**
 * Global and Europe first, then sovereign states in alphabetical order.
 * Dependencies and territories with no market of their own are left out.
 * Hong Kong, Macao, Taiwan and Puerto Rico are kept: they are markets.
 * GL is Global, as the source application uses it, so Greenland is absent.
 */
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "GL", name: "Global" },
  { code: "EU", name: "Europe" },
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua & Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia & Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CV", name: "Cape Verde" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo - Brazzaville" },
  { code: "CD", name: "Congo - Kinshasa" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d’Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong SAR China" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macao SAR China" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar (Burma)" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "KP", name: "North Korea" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestinian Territories" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "São Tomé & Príncipe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "KN", name: "St. Kitts & Nevis" },
  { code: "LC", name: "St. Lucia" },
  { code: "VC", name: "St. Vincent & Grenadines" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad & Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Türkiye" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
