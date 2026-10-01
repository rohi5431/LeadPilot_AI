import BackendStatus from '../components/BackendStatus'

/**
 * HomePage — the single page for Phase 1.
 *
 * Shows the product brand, a one-liner value proposition,
 * an "AI-Powered Workflow" badge, and the live backend status.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Top navigation bar ────────────────────────────── */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Brand mark */}
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </span>
            <span className="text-base font-bold tracking-tight text-text">LeadPilot AI</span>
          </div>

          {/* Status badge */}
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            Real Estate Sales Assistant
          </span>
        </div>
      </header>

      {/* ── Hero section ──────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          {/* AI badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
            <span className="text-xs font-bold text-violet-700">AI-Powered Workflow</span>
          </div>

          {/* Headline */}
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            LeadPilot <span className="text-blue-600">AI</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-3 text-lg font-bold text-slate-800">
            AI-Powered Lead Prioritization for Real Estate
          </p>

          {/* Value proposition */}
          <p className="text-base font-medium text-slate-600">
            Turn inbound real-estate leads into clear, actionable sales opportunities — so
            you always call the right person at the right time.
          </p>
        </div>

        {/* ── Backend status card ───────────────────────────── */}
        <div className="mx-auto mt-16 max-w-md">
          <BackendStatus />
        </div>

        {/* ── Capabilities info ─────────────────────────────────── */}
        <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-700">
            Core Capabilities
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Lead Intake',
                desc: 'Capture inbound leads with a structured form.',
              },
              {
                title: 'AI Analysis',
                desc: 'Analyse intent and prioritize leads using Gemini.',
              },
              {
                title: 'Call Prep',
                desc: 'Generate tailored talking points before each call.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="mb-1 text-sm font-bold text-slate-900">{item.title}</p>
                <p className="text-xs leading-relaxed font-medium text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-6">
        <p className="text-center text-xs font-medium text-slate-600">
          LeadPilot AI · AI-powered real-estate sales assistant
        </p>
      </footer>
    </div>
  )
}
