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

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-text">Add New Lead</h1>
          <p className="text-sm text-text-muted">
            Capture the customer information needed for AI-powered lead analysis.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <LeadForm />
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-text-muted">
          LeadPilot AI · Phase 4 · Built with FastAPI + Gemini + React
        </p>
      </footer>
    </div>
  )
}
