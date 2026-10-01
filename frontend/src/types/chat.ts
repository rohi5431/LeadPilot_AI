/**
 * TypeScript types for the contextual lead chat — Phase 6.
 *
 * Kept separate from lead.ts to maintain clean module boundaries.
 * All types match their Pydantic counterparts in backend/app/schemas/chat.py.
 */

/** Message role — matches backend Literal["user", "assistant"] */
export type ChatRole = 'user' | 'assistant'

/** A single message in a conversation */
export interface ChatMessage {
  role: ChatRole
  content: string
}

/** Payload sent to POST /api/leads/{leadId}/chat */
export interface ChatRequest {
  message: string
}

/** Response from POST /api/leads/{leadId}/chat */
export interface ChatResponse {
  message: string
}

/** Response from GET /api/leads/{leadId}/chat */
export interface ChatHistoryResponse {
  messages: ChatMessage[]
}
