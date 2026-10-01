import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLeadById, generateCallPrep } from '../services/api'
import type { Lead } from '../types/lead'
import type { CallPrep } from '../types/callPrep'
import AppHeader from '../components/AppHeader'
import LeadAnalysisCard from '../components/LeadAnalysisCard'
import LeadChat from '../components/LeadChat'
import CallPrepCard from '../components/CallPrepCard'
import CircularScore from '../components/CircularScore'

type LoadState = 'loading' | 'success' | 'not_found' | 'error'

/**
 * LeadDetailsPage — full detail view for one lead.
 *
 * Layout matches wireframe architecture:
 * MAIN CONTENT (Left 2 cols):
 *   - Lead Info & Circular Priority Score summary
 *   - AI Analysis (2-column information grid)
 *   - AI Call Prep (7 mini cards)
 *   - Contextual AI Assistant Chat
 *
 * SALES ACTION SIDEBAR (Right 1 col):
 *   - Prominent [ Prepare Me for Call ] action trigger
 *   - Recommended Next Step callout
 *   - Quick Contact actions (Call / Email)
 */
export default function LeadDetailsPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [callPrep, setCallPrep] = useState<CallPrep | null>(null)
  const [isGeneratingCallPrep, setIsGeneratingCallPrep] = useState(false)
  const [callPrepError, setCallPrepError] = useState<string | null>(null)

  const handleGenerateCallPrep = async () => {
    if (!leadId || isGeneratingCallPrep) return
    setIsGeneratingCallPrep(true)
    setCallPrepError(null)

    try {
      const res = await generateCallPrep(leadId)
      setCallPrep(res)
    } catch (err) {
      setCallPrepError(err instanceof Error ? err.message : 'Failed to generate call preparation brief.')
    } finally {
      setIsGeneratingCallPrep(false)
    }
  }

  useEffect(() => {
    if (!leadId) return

    let cancelled = false

    getLeadById(leadId)
      .then((data) => {
        if (!cancelled) {
          setLead(data)
          setLoadState('success')
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadState(err.message === 'Lead not found' ? 'not_found' : 'error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [leadId])

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8">
        {/* ── Back link ────────────────────────────────────────── */}
        <Link
          to="/leads"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Leads
        </Link>

        {/* ── Loading ──────────────────────────────────────────── */}
        {loadState === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-slate-600">
            <svg className="h-4 w-4 animate-spin text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Loading lead details…
          </div>
        )}

        {/* ── Not found ────────────────────────────────────────── */}
        {loadState === 'not_found' && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="mb-1 text-base font-bold text-slate-900">Lead not found</p>
            <p className="mb-6 text-xs font-medium text-slate-600">
              This lead may have been removed or the ID is invalid.
            </p>
            <Link
              to="/leads"
              className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              Back to Leads
            </Link>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────── */}
        {loadState === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="mb-1 text-sm font-bold text-red-800">Unable to load lead details.</p>
            <p className="text-xs font-medium text-red-600">Ensure the FastAPI backend is running.</p>
          </div>
        )}

        {/* ── Lead Layout (Main Content + Sales Action Sidebar) ─ */}
        {loadState === 'success' && lead && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT AREA (Left 2 Columns)                 */}
            {/* ════════════════════════════════════════════════════ */}
            <div className="space-y-6 lg:col-span-2">

              {/* ── 1. Lead Info & AI Priority Header Card ──────── */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 pb-5 mb-5">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{lead.name}</h1>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                      <svg className="h-4 w-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span>{lead.location}</span>
                      <span className="text-slate-300">•</span>
                      <span>ID: {lead.id.slice(0, 8)}...</span>
                    </p>
                  </div>

                  {/* Circular Priority Score */}
                  {lead.aiAnalysis !== null ? (
                    <CircularScore
                      score={lead.aiAnalysis.priorityScore}
                      priority={lead.aiAnalysis.priority}
                      size="md"
                    />
                  ) : (
                    <span className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800">
                      Priority Unavailable
                    </span>
                  )}
                </div>

                {/* Lead Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mobile Number</span>
                      <p className="font-bold text-slate-900 font-mono mt-0.5">{lead.mobileNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</span>
                      <p className="font-bold text-slate-900 font-mono mt-0.5">{lead.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Property Requirement</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.propertyRequirement}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Budget</span>
                      <p className="font-bold text-blue-700 mt-0.5">{lead.budget}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Buying Timeline</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.buyingTimeline}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Location Preference</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.location}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Message */}
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Customer Message</span>
                  <p className="mt-1 rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-sm font-semibold leading-relaxed text-slate-900 italic">
                    "{lead.customerMessage}"
                  </p>
                </div>
              </div>

              {/* ── 2. AI Analysis Card (2-column layout) ───────── */}
              {lead.aiAnalysis !== null ? (
                <LeadAnalysisCard analysis={lead.aiAnalysis} />
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <p className="text-sm font-bold text-amber-800">
                    AI analysis is currently unavailable for this lead.
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    The lead was saved successfully, but the Gemini analysis could not be completed.
                  </p>
                </div>
              )}

              {/* ── 3. Contextual AI Assistant Chat Widget ──────── */}
              <LeadChat leadId={lead.id} />
            </div>

            {/* ════════════════════════════════════════════════════ */}
            {/* SALES ACTION SIDEBAR (Right Column)                */}
            {/* ════════════════════════════════════════════════════ */}
            <div className="space-y-6 lg:sticky lg:top-6">

              {/* Primary Call Prep Action Box */}
              <div className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Sales Action Hub</h3>
                    <p className="text-xs font-semibold text-slate-600">Instant AI Call Briefing</p>
                  </div>
                </div>

                <button
                  onClick={handleGenerateCallPrep}
                  disabled={isGeneratingCallPrep || lead.aiAnalysis === null}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all shadow-sm ${
                    isGeneratingCallPrep || lead.aiAnalysis === null
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                      : 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 hover:shadow-md'
                  }`}
                >
                  {isGeneratingCallPrep ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Preparing call…
                    </>
                  ) : callPrep ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate Call Prep
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      Prepare Me for Call
                    </>
                  )}
                </button>

                {callPrepError && (
                  <p className="text-xs text-red-600 font-bold text-center">
                    {callPrepError}
                  </p>
                )}
              </div>

              {/* ── Generated Call Prep Brief in Right Sidebar ─────── */}
              {callPrep && <CallPrepCard callPrep={callPrep} leadName={lead.name} />}

              {/* Direct Quick Contact Buttons */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Quick Contact Options
                </h4>

                {lead.mobileNumber ? (
                  <a
                    href={`tel:${lead.mobileNumber}`}
                    className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900 transition-colors hover:bg-emerald-100"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-700 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.828-1.415-5.12-3.707-6.535-6.535l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      Call Customer
                    </span>
                    <span className="font-mono text-[11px] text-emerald-950 font-bold">{lead.mobileNumber}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.828-1.415-5.12-3.707-6.535-6.535l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    Mobile not available
                  </div>
                )}

                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center justify-between rounded-lg border border-blue-300 bg-blue-50 p-3 text-xs font-bold text-blue-900 transition-colors hover:bg-blue-100"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-blue-700 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Send Email
                    </span>
                    <span className="truncate max-w-[140px] font-mono text-[11px] text-blue-950 font-bold">{lead.email}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    Email not available
                  </div>
                )}
              </div>

              {/* Next Action Highlight in Sidebar */}
              {lead.aiAnalysis?.recommendedNextAction && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800">
                      Recommended Next Step
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-relaxed text-slate-900">
                    {lead.aiAnalysis.recommendedNextAction}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6">
        <p className="text-center text-xs font-medium text-slate-600">
          LeadPilot AI · AI-powered real-estate sales assistant
        </p>
      </footer>
    </div>
  )
}


