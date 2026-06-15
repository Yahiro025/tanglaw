/**
 * Canonical type for a scholarship opportunity displayed in the browser UI.
 * Used by ScholarshipBrowser, ScholarshipCard, and related components.
 */
export interface ScholarshipOpportunity {
  name: string;
  provider: string;
  coverageType: string;
  classification: string;
  strand: string;
  overview: string;
  coverageDetails: string;
  eligibility: Record<string, string | undefined>;
  priorityPrograms: string[];
  requirements: string[];
  examInformation: { type: string };
  deadline: string;
  links: string[];
}
