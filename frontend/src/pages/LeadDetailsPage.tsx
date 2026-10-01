import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLeadById, generateCallPrep } from '../services/api'
import type { Lead } from '../types/lead'
import type { CallPrep } from '../types/callPrep'
import AppHeader from '../components/AppHeader'
import LeadAnalysisCard from '../components/LeadAnalysisCard'
import LeadChat from '../components/LeadChat'
import CallPrepCard from '../components/CallPrepCard'

type LoadState = 'loading' | 'success' | 'not_found' | 'error'

/**
 * LeadDetailsPage — full detail view for one lead.
 *
 * Layout matches wireframe architecture:
 * MAIN CONTENT (Left 2 cols):
 *   - Lead Info & AI Priority Score summary
 *   - AI Analysis (2-column information grid)
 *   - AI Call Prep (7 mini cards)
 *   - Contextual AI Assistant Chat
 *
 * SALES ACTION SIDEBAR (Right 1 col):
 *   - Prominent [ Prepare Me for Call ] action trigger
 *   - AI Priority status highlight
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
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Leads
        </Link>

        {/* ── Loading ──────────────────────────────────────────── */}
        {loadState === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-24 text-sm text-text-muted">
            <svg className="h-4 w-4 animate-spin text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Loading lead details…
          </div>
        )}

        {/* ── Not found ────────────────────────────────────────── */}
        {loadState === 'not_found' && (
          <div className="rounded-xl border border-border bg-white px-6 py-12 text-center shadow-sm">
            <p className="mb-1 text-base font-semibold text-text">Lead not found</p>
            <p className="mb-6 text-xs text-text-muted">
              This lead may have been removed or the ID is invalid.
            </p>
            <Link
              to="/leads"
              className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Back to Leads
            </Link>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────── */}
        {loadState === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="mb-1 text-sm font-medium text-red-800">Unable to load lead details.</p>
            <p className="text-xs text-red-600">Ensure the FastAPI backend is running.</p>
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
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-5 mb-5">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text">{lead.name}</h1>
                    <p className="mt-1 text-sm font-medium text-text-muted">
                      📍 {lead.location} <span className="mx-1.5">•</span> ID: {lead.id.slice(0, 8)}...
                    </p>
                  </div>

                  {/* Priority Badge */}
                  {lead.aiAnalysis !== null ? (
                    <div
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 border font-bold text-sm ${
                        lead.aiAnalysis.priority === 'HOT'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : lead.aiAnalysis.priority === 'WARM'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{lead.aiAnalysis.priority} PRIORITY</span>
                      <span className="opacity-30">•</span>
                      <span>{lead.aiAnalysis.priorityScore}/100</span>
                    </div>
                  ) : (
                    <span className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800">
                      Priority Unavailable
                    </span>
                  )}
                </div>

                {/* Lead Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Mobile Number</span>
                      <p className="font-semibold text-text">{lead.mobileNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email Address</span>
                      <p className="font-semibold text-text">{lead.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Property Requirement</span>
                      <p className="font-semibold text-text">{lead.propertyRequirement}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Budget</span>
                      <p className="font-semibold text-primary">{lead.budget}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Buying Timeline</span>
                      <p className="font-semibold text-text">{lead.buyingTimeline}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Location Preference</span>
                      <p className="font-semibold text-text">{lead.location}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Message */}
                <div className="mt-5 border-t border-border pt-4">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Customer Message</span>
                  <p className="mt-1 rounded-lg bg-surface p-3.5 text-sm leading-relaxed text-text italic">
                    "{lead.customerMessage}"
                  </p>
                </div>
              </div>

              {/* ── 2. AI Analysis Card (2-column layout) ───────── */}
              {lead.aiAnalysis !== null ? (
                <LeadAnalysisCard analysis={lead.aiAnalysis} />
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <p className="text-sm font-medium text-amber-800">
                    AI analysis is currently unavailable for this lead.
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    The lead was saved successfully, but the Gemini analysis could not be completed.
                  </p>
                </div>
              )}

              {/* ── 3. AI Call Prep Brief (7 Mini Cards) ─────────── */}
              {callPrep && <CallPrepCard callPrep={callPrep} leadName={lead.name} />}

              {/* ── 4. Contextual AI Assistant Chat Widget ──────── */}
              <LeadChat leadId={lead.id} />
            </div>

            {/* ════════════════════════════════════════════════════ */}
            {/* SALES ACTION SIDEBAR (Right Column)                */}
            {/* ════════════════════════════════════════════════════ */}
            <div className="space-y-6 lg:sticky lg:top-6">

              {/* Primary Call Prep Action Box */}
              <div className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-bold text-xs">
                    ⚡
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-text">Sales Action Hub</h3>
                    <p className="text-xs text-text-muted">Instant AI Call Briefing</p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Prepare Me for Call
                    </>
                  )}
                </button>

                {callPrepError && (
                  <p className="mt-3 text-xs text-red-600 font-medium text-center">
                    {callPrepError}
                  </p>
                )}
              </div>

              {/* Direct Quick Contact Buttons */}
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Quick Contact Options
                </h4>

                {lead.mobileNumber ? (
                  <a
                    href={`tel:${lead.mobileNumber}`}
                    className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                  >
                    <span className="flex items-center gap-2">
                      <span>📞</span> Call Customer
                    </span>
                    <span className="font-mono text-[11px]">{lead.mobileNumber}</span>
                  </a>
                ) : (
                  <div className="rounded-lg border border-border bg-surface p-3 text-xs text-text-muted">
                    📞 Mobile not available
                  </div>
                )}

                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100"
                  >
                    <span className="flex items-center gap-2">
                      <span>✉</span> Send Email
                    </span>
                    <span className="truncate max-w-[140px] font-mono text-[11px]">{lead.email}</span>
                  </a>
                ) : (
                  <div className="rounded-lg border border-border bg-surface p-3 text-xs text-text-muted">
                    ✉ Email not available
                  </div>
                )}
              </div>

              {/* Next Action Highlight in Sidebar */}
              {lead.aiAnalysis?.recommendedNextAction && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-xs text-primary">⚡</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Recommended Next Step
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-text">
                    {lead.aiAnalysis.recommendedNextAction}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-text-muted">
          LeadPilot AI · AI-powered real-estate sales assistant
        </p>
      </footer>
    </div>
  )
}

