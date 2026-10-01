/**
 * TypeScript types for lead data.
 *
 * Frontend uses camelCase; the API service handles
 * the mapping to/from backend snake_case.
 */

/** Payload sent to POST /api/leads */
export interface LeadCreate {
  name: string;
  mobileNumber: string;
  email?: string;
  location: string;
  propertyRequirement: string;
  budget: string;
  buyingTimeline: string;
  customerMessage: string;
}

/** Priority category — matches backend Literal["HOT", "WARM", "COLD"] */
export type Priority = 'HOT' | 'WARM' | 'COLD';

/** Structured AI analysis returned inside a Lead */
export interface LeadAnalysis {
  // ── Original six fields (Phase 3) ────────────────────────────────────
  leadSummary: string;
  customerIntent: string;
  keyRequirements: string[];
  objectionsConcerns: string[];
  recommendedNextAction: string;
  suggestedResponse: string;
  // ── Phase 5: priority fields ──────────────────────────────────────────
  /** 0–100; higher means higher urgency / better quality lead */
  priorityScore: number;
  /** HOT = 80–100, WARM = 50–79, COLD = 0–49 */
  priority: Priority;
}

/** Lead returned from GET /api/leads or POST /api/leads */
export interface Lead {
  id: string;
  name: string;
  mobileNumber?: string | null;
  email?: string | null;
  location: string;
  propertyRequirement: string;
  budget: string;
  buyingTimeline: string;
  customerMessage: string;
  /** null when AI analysis failed but the lead was saved successfully */
  aiAnalysis: LeadAnalysis | null;
}
