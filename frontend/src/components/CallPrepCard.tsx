import type { CallPrep } from '../types/callPrep'

interface CallPrepCardProps {
  callPrep: CallPrep
  leadName: string
}

/**
  CallPrepCard — Phase 7.
 *
 * Displays a structured, actionable call preparation brief for a specific lead.
 * Styled with LeadPilot's clean violet AI accent, white background, and slate borders.
 */
export default function CallPrepCard({ callPrep, leadName }: CallPrepCardProps) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* ── Card Header ─────────────────────────────────────────────── */}
      <div className="border-b border-border bg-violet-50/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-text">AI Call Prep</h3>
            <p className="text-xs text-text-muted">
              Prepared for <span className="font-medium text-text">{leadName}</span>
            </p>
          </div>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
          Ready for Call
        </span>
      </div>

      {/* ── Card Body ───────────────────────────────────────────────── */}
      <div className="p-6 space-y-6">
        {/* 1. Call Objective */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
            Call Objective
          </h4>
          <p className="text-sm font-medium leading-relaxed text-text bg-violet-50/40 rounded-lg p-3 border border-violet-100">
            {callPrep.callObjective}
          </p>
        </section>

        {/* 2. Key Talking Points */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Key Talking Points
          </h4>
          <ul className="space-y-2">
            {callPrep.keyTalkingPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-text">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3 & 4. Objections & Handling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">
              Likely Objection
            </h4>
            <p className="text-sm text-amber-900 leading-relaxed">
              {callPrep.likelyObjection}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
              How to Handle It
            </h4>
            <p className="text-sm text-text leading-relaxed">
              {callPrep.suggestedObjectionHandling}
            </p>
          </div>
        </div>

        {/* 5. Questions to Ask */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Questions to Ask
          </h4>
          <ul className="space-y-2">
            {callPrep.questionsToAsk.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-text">
                <span className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Suggested Opening */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Suggested Opening
          </h4>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm italic text-text border-l-4 border-l-violet-600">
            "{callPrep.suggestedOpening}"
          </div>
        </section>

        {/* 7. Desired Outcome */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
            Desired Outcome
          </h4>
          <p className="text-sm font-medium leading-relaxed text-text">
            {callPrep.desiredOutcome}
          </p>
        </section>
      </div>
    </div>
  )
}
