import { useNavigate } from 'react-router-dom'
import type { Lead, Priority } from '../types/lead'

/**
 * LeadCard
 *
 * Information-dense, prioritized lead overview card.
 * Displays:
 * 1. Lead name & AI Priority Score badge
 * 2. Location & Verified Contact indicators (Phone / Email)
 * 3. Property Requirement & Budget / Timeline pills
 * 4. AI-recommended Next Best Action (if available)
 * 5. Action CTA to view full lead details
 */
export default function LeadCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        {/* ── Header row: name + priority badge ─────────────────── */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-text">{lead.name}</h3>
          {lead.aiAnalysis !== null ? (
            <PriorityBadge
              priority={lead.aiAnalysis.priority}
              score={lead.aiAnalysis.priorityScore}
            />
          ) : (
            <span className="flex-shrink-0 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-text-muted">
              No AI
            </span>
          )}
        </div>

        {/* ── Location & Contact indicators ─────────────────────── */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span className="font-medium text-text-secondary">{lead.location}</span>

          {lead.mobileNumber && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.828-1.415-5.12-3.707-6.535-6.535l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span>{lead.mobileNumber}</span>
            </span>
          )}

          {lead.email && (
            <span className="inline-flex items-center gap-1 text-blue-700">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span>{lead.email}</span>
            </span>
          )}
        </div>

        {/* ── Requirement & Key Attributes ──────────────────────── */}
        <p className="mb-3 text-sm font-medium text-text">{lead.propertyRequirement}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          <Pill label="Budget" value={lead.budget} />
          <Pill label="Timeline" value={lead.buyingTimeline} />
        </div>

        {/* ── Next Best Action (if available) ────────────────────── */}
        {lead.aiAnalysis?.recommendedNextAction && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-primary text-xs">⚡</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Next Best Action
              </span>
            </div>
            <p className="text-xs font-medium text-text line-clamp-2 leading-relaxed">
              {lead.aiAnalysis.recommendedNextAction}
            </p>
          </div>
        )}
      </div>

      {/* ── Footer row: AI status + View button ───────────────── */}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
        <AiStatusBadge available={lead.aiAnalysis !== null} />
        <button
          onClick={() => navigate(`/leads/${lead.id}`)}
          className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        >
          View Lead →
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PriorityBadge({ priority, score }: { priority: Priority; score: number }) {
  const styles: Record<Priority, string> = {
    HOT:  'bg-red-50 border-red-200 text-red-700',
    WARM: 'bg-amber-50 border-amber-200 text-amber-700',
    COLD: 'bg-slate-50 border-slate-200 text-slate-600',
  }
  return (
    <span
      className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[priority]}`}
    >
      {priority} · {score}/100
    </span>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-0.5 text-xs text-text-secondary">
      <span className="font-medium text-text-muted">{label}:</span>
      {value}
    </span>
  )
}

function AiStatusBadge({ available }: { available: boolean }) {
  return available ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      AI Analysis available
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      AI Analysis unavailable
    </span>
  )
}

