import { useNavigate } from 'react-router-dom'
import type { Lead } from '../types/lead'
import CircularScore from './CircularScore'

/**
 * LeadCard
 *
 * Information-dense, prioritized lead overview card.
 * High-readability structure:
 * 1. Name & Circular Priority Score
 * 2. Location & Contact indicators (Phone / Email)
 * 3. Property Requirement & Budget / Timeline pills
 * 4. AI-recommended Next Best Action
 * 5. Completion Status (✓ AI Analysis completed) & View Lead button
 */
export default function LeadCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate()
  const isAnalysisAvailable = lead.aiAnalysis !== null

  return (
    <div
      onClick={() => navigate(`/leads/${lead.id}`)}
      className="group cursor-pointer flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div>
        {/* ── Header row: Name + Circular Score ───────────────── */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {lead.name}
            </h3>

            {/* Location & Contact row */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-700">
              <span className="text-slate-800">{lead.location}</span>

              {lead.mobileNumber && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-mono font-bold">
                    <svg className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.828-1.415-5.12-3.707-6.535-6.535l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <span>{lead.mobileNumber}</span>
                  </span>
                </>
              )}

              {lead.email && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-blue-800 font-mono font-bold truncate max-w-[160px]">
                    <svg className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span>{lead.email}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Circular Score or Fallback */}
          {lead.aiAnalysis !== null ? (
            <CircularScore
              score={lead.aiAnalysis.priorityScore}
              priority={lead.aiAnalysis.priority}
              size="sm"
            />
          ) : (
            <span className="flex-shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
              No AI Score
            </span>
          )}
        </div>

        {/* ── Requirement & Key Attributes ──────────────────────── */}
        <p className="mb-2.5 text-sm font-bold text-slate-900">{lead.propertyRequirement}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          <Pill label="Budget" value={lead.budget} />
          <Pill label="Timeline" value={lead.buyingTimeline} />
        </div>

        {/* ── Next Best Action (if available) ────────────────────── */}
        {lead.aiAnalysis?.recommendedNextAction && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/70 p-3.5">
            <div className="mb-1 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
                Next Best Action
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 leading-relaxed line-clamp-2">
              {lead.aiAnalysis.recommendedNextAction}
            </p>
          </div>
        )}
      </div>

      {/* ── Footer row: Completion Status + View Button ────────── */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
        <AiStatusBadge completed={isAnalysisAvailable} />
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/leads/${lead.id}`)
          }}
          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 group-hover:bg-blue-700"
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

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
      <span className="font-bold text-slate-600">{label}:</span>
      <span>{value}</span>
    </span>
  )
}

function AiStatusBadge({ completed }: { completed: boolean }) {
  return completed ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
      <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      AI Analysis completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
      <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      Analysis pending
    </span>
  )
}


