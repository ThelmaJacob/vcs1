import type { Issue } from "./types";

/**
 * Two demo records. Every value is invented placeholder text — no real issue,
 * person or figure from the source application appears here.
 */

const LOREM_1 = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`;

const LOREM_2 = `Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.`;

const LOREM_SHORT = `At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.

Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat.`;

function ago(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export const DEMO_ISSUES: Partial<Issue>[] = [
  {
    id: "demo-issue-1001",
    issueNo: 1001,
    title: "Lorem ipsum reimbursement framework",
    country: "FR",
    lead: "Ada Lorem",
    team: ["Marius Ipsum", "Nora Dolor"],
    description: LOREM_1,
    divisions: ["PH", "CO"],
    leadDivision: "PH",
    businessArea: "Registration & Market Access",
    actionability: "Likely",
    funnelStage: "Proactive Shaping",
    uniqueness: "Industry Issue",
    assessments: {
      CO: { businessUnit: "Cross-Divisional", impact: "Medium", policyPressurePoint: true },
      PH: { businessUnit: "Other / Several", impact: "High", policyPressurePoint: true },
      CH: { businessUnit: "Not Applicable", impact: "None", policyPressurePoint: false },
      CS: { businessUnit: "Not Applicable", impact: "None", policyPressurePoint: false },
    },
    qualitativeImpact: "High",
    financialImpactDriver: "Price",
    worstCaseRisk: LOREM_2,
    worstCaseSalesValue: -12.5,
    worstCaseCashFlow: -9.8,
    bestCaseOpportunity: LOREM_SHORT,
    bestCaseSalesValue: 34.2,
    bestCaseCashFlow: 27.6,
    closed: false,
    attachments: [
      { name: "Lorem ipsum briefing note.docx", kind: "docx", size: "184 KB", addedOn: ago(21) },
      { name: "Dolor sit amet position paper.docx", kind: "docx", size: "97 KB", addedOn: ago(9) },
    ],
    locked: false,
    lastUpdate: ago(72),
    lastUpdateBy: "Ada Lorem",
  },
  {
    id: "demo-issue-1002",
    issueNo: 1002,
    title: "Dolor sit amet import tariff review",
    country: "BR",
    lead: "Tomas Amet",
    team: ["Livia Consecte"],
    description: LOREM_2,
    divisions: ["CS", "CH"],
    leadDivision: "CS",
    businessArea: "Trade Agreements & Tariffs",
    actionability: "Very Likely",
    funnelStage: "Crisis Management",
    uniqueness: "Bayer is Frontrunner",
    assessments: {
      CO: { businessUnit: "Not Applicable", impact: "None", policyPressurePoint: false },
      PH: { businessUnit: "Not Applicable", impact: "None", policyPressurePoint: false },
      CH: { businessUnit: "Other / Several", impact: "Medium", policyPressurePoint: false },
      CS: { businessUnit: "Cross-Divisional", impact: "Very High", policyPressurePoint: true },
    },
    qualitativeImpact: "Very High",
    financialImpactDriver: "COGS",
    worstCaseRisk: LOREM_SHORT,
    worstCaseSalesValue: -22.0,
    worstCaseCashFlow: -18.4,
    bestCaseOpportunity: LOREM_1,
    bestCaseSalesValue: 11.3,
    bestCaseCashFlow: 8.9,
    closed: true,
    closureImpactType: "Value Protected",
    closureDriver: "COGS",
    closureDate: ago(30),
    closureDescription: LOREM_1,
    closureSalesValue: 18.4,
    closureCashFlow: 14.2,
    attachments: [
      { name: "Consectetur closure summary.docx", kind: "docx", size: "212 KB", addedOn: ago(31) },
    ],
    locked: true,
    lastUpdate: ago(30),
    lastUpdateBy: "Tomas Amet",
  },
];
