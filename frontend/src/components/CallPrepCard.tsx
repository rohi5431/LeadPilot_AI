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
    <div className="rounded-xl border border-violet-200 bg-white shadow-sm overflow-hidden animate-fadeIn">
      {/* ── Card Header ─────────────────────────────────────────────── */}
      <div className="border-b border-violet-100 bg-violet-50/90 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm flex-shrink-0">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-violet-950">AI Call Prep Brief</h3>
            <p className="text-[11px] font-semibold text-slate-600">
              Target: <span className="font-bold text-slate-900">{leadName}</span>
            </p>
          </div>
        </div>
        <span className="rounded-full bg-violet-100 border border-violet-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-800">
          Ready
        </span>
      </div>

      {/* ── Card Body ───────────────────────────────────────────────── */}
      <div className="p-5 space-y-4 text-xs">
        {/* 1. Call Objective */}
        <section>
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-violet-800 mb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600"></span>
            Call Objective
          </h4>
          <p className="text-xs font-bold leading-relaxed text-slate-900 bg-violet-50/70 rounded-lg p-3 border border-violet-100">
            {callPrep.callObjective}
          </p>
        </section>

        {/* 2. Key Talking Points */}
        <section>
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
            Key Talking Points
          </h4>
          <ul className="space-y-1.5">
            {callPrep.keyTalkingPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-900">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-600" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3 & 4. Objections & Handling */}
        <div className="space-y-2.5">
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-3">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 mb-0.5">
              Likely Objection
            </h4>
            <p className="text-xs font-bold text-amber-950 leading-relaxed">
              {callPrep.likelyObjection}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-0.5">
              How to Handle It
            </h4>
            <p className="text-xs font-semibold text-slate-900 leading-relaxed">
              {callPrep.suggestedObjectionHandling}
            </p>
          </div>
        </div>

        {/* 5. Questions to Ask */}
        <section>
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
            Questions to Ask
          </h4>
          <ul className="space-y-1.5">
            {callPrep.questionsToAsk.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-900">
                <span className="mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-800">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Suggested Opening */}
        <section>
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
            Suggested Opening
          </h4>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold italic text-slate-900 border-l-4 border-l-violet-600">
            "{callPrep.suggestedOpening}"
          </div>
        </section>

        {/* 7. Desired Outcome */}
        <section>
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
            Desired Outcome
          </h4>
          <p className="text-xs font-bold leading-relaxed text-slate-900">
            {callPrep.desiredOutcome}
          </p>
        </section>
      </div>
    </div>
  )
}
