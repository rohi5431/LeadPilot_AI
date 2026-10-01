import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import LeadForm from '../components/LeadForm'

/**
 * AddLeadPage — lead intake form page (Phase 2+).
 *
 * Uses the shared AppHeader for consistent navigation.
 * All form logic and Gemini AI state are handled inside LeadForm.
 */
export default function AddLeadPage() {
  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/leads"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Leads
          </Link>
        </div>

        <div className="mx-auto max-w-2xl">
          <LeadForm />
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6">
        <p className="text-center text-xs font-medium text-slate-600">
          LeadPilot AI · AI-powered real-estate sales assistant
        </p>
      </footer>
    </div>
  )
}
