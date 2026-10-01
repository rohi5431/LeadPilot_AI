import type { HealthResponse } from '../types/api'
import type { LeadCreate, Lead, LeadAnalysis } from '../types/lead'
import type { ChatMessage, ChatHistoryResponse, ChatResponse } from '../types/chat'
import type { CallPrep } from '../types/callPrep'

/**
 * Base URL is read from the Vite environment variable.
 * Never hardcode http://localhost:8000 here.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

// ---------------------------------------------------------------------------
// Internal mappers — snake_case ↔ camelCase conversion lives here only
// ---------------------------------------------------------------------------

function mapAnalysis(raw: Record<string, unknown> | null | undefined): LeadAnalysis | null {
  if (!raw) return null
  return {
    leadSummary: raw.lead_summary as string,
    customerIntent: raw.customer_intent as string,
    keyRequirements: raw.key_requirements as string[],
    objectionsConcerns: raw.objections_concerns as string[],
    recommendedNextAction: raw.recommended_next_action as string,
    suggestedResponse: raw.suggested_response as string,
    priorityScore: raw.priority_score as number,
    priority: raw.priority as LeadAnalysis['priority'],
  }
}

function mapLead(data: Record<string, unknown>): Lead {
  return {
    id: data.id as string,
    name: data.name as string,
    mobileNumber: (data.mobile_number as string) || null,
    email: (data.email as string) || null,
    location: data.location as string,
    propertyRequirement: data.property_requirement as string,
    budget: data.budget as string,
    buyingTimeline: data.buying_timeline as string,
    customerMessage: data.customer_message as string,
    aiAnalysis: mapAnalysis(data.ai_analysis as Record<string, unknown> | null),
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function getHealthStatus(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`)
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
  return response.json() as Promise<HealthResponse>
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function createLead(lead: LeadCreate): Promise<Lead> {
  const response = await fetch(`${API_BASE_URL}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: lead.name,
      mobile_number: lead.mobileNumber,
      email: lead.email || null,
      location: lead.location,
      property_requirement: lead.propertyRequirement,
      budget: lead.budget,
      buying_timeline: lead.buyingTimeline,
      customer_message: lead.customerMessage,
    }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create lead (HTTP ${response.status})`)
  }
  const data = await response.json()
  return mapLead(data)
}

export async function getLeads(): Promise<Lead[]> {
  const response = await fetch(`${API_BASE_URL}/api/leads`)
  if (!response.ok) {
    throw new Error(`Failed to fetch leads (HTTP ${response.status})`)
  }
  const data = await response.json() as Record<string, unknown>[]
  return data.map(mapLead)
}

export async function getLeadById(leadId: string): Promise<Lead> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`)
  if (response.status === 404) throw new Error('Lead not found')
  if (!response.ok) throw new Error(`Failed to fetch lead (HTTP ${response.status})`)
  const data = await response.json()
  return mapLead(data)
}

export async function retryLeadAnalysis(leadId: string): Promise<Lead> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (response.status === 404) throw new Error('Lead not found')
  if (!response.ok) throw new Error(`Failed to retry lead analysis (HTTP ${response.status})`)
  const data = await response.json()
  return mapLead(data)
}


// ---------------------------------------------------------------------------
// Chat — Phase 6
// ---------------------------------------------------------------------------

/**
 * GET /api/leads/{leadId}/chat
 * Returns the full conversation history for a lead.
 * Returns { messages: [] } when no conversation has started.
 */
export async function getChatHistory(leadId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/chat`)
  if (response.status === 404) throw new Error('Lead not found')
  if (!response.ok) {
    throw new Error(`Failed to fetch chat history (HTTP ${response.status})`)
  }
  const data = await response.json() as ChatHistoryResponse
  return data.messages
}

/**
 * POST /api/leads/{leadId}/chat
 * Sends a user message and returns the AI assistant's reply.
 * Throws an error if the AI is unavailable (503) or another HTTP error occurs.
 */
export async function sendChatMessage(
  leadId: string,
  message: string,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

  if (response.status === 404) throw new Error('Lead not found')

  if (response.status === 503) {
    throw new Error('AI assistant is temporarily unavailable. Please try again.')
  }

  if (!response.ok) {
    throw new Error(`Chat request failed (HTTP ${response.status})`)
  }

  const data = await response.json() as ChatResponse
  return data.message
}

// ---------------------------------------------------------------------------
// Call Prep — Phase 7
// ---------------------------------------------------------------------------

/**
 * POST /api/leads/{leadId}/call-prep
 * Generates a structured call preparation brief for a lead.
 * Maps snake_case backend response to camelCase CallPrep interface.
 */
export async function generateCallPrep(leadId: string): Promise<CallPrep> {
  const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/call-prep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.status === 404) throw new Error('Lead not found')

  if (response.status === 422) {
    const errorData = await response.json().catch(() => ({})) as { detail?: string }
    throw new Error(errorData.detail || 'AI analysis is required before generating call preparation.')
  }

  if (response.status === 503) {
    throw new Error('AI call preparation is temporarily unavailable. Please try again.')
  }

  if (!response.ok) {
    throw new Error(`Call prep request failed (HTTP ${response.status})`)
  }

  const raw = await response.json() as Record<string, unknown>
  return {
    callObjective: raw.call_objective as string,
    keyTalkingPoints: raw.key_talking_points as string[],
    likelyObjection: raw.likely_objection as string,
    suggestedObjectionHandling: raw.suggested_objection_handling as string,
    questionsToAsk: raw.questions_to_ask as string[],
    suggestedOpening: raw.suggested_opening as string,
    desiredOutcome: raw.desired_outcome as string,
  }
}

