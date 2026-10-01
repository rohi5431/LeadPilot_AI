import { Link, useLocation } from 'react-router-dom'

/**
 * AppHeader — shared navigation bar used across all pages.
 *
 * Highlights the active nav link based on the current URL.
 */
export default function AppHeader() {
  const { pathname } = useLocation()

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <Link to="/leads" className="flex items-center gap-2">
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
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1">
          <NavLink to="/leads" active={pathname === '/leads' || pathname.startsWith('/leads/')}>
            Leads
          </NavLink>
          <NavLink to="/add-lead" active={pathname === '/add-lead'}>
            + Add Lead
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function NavLink({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={[
        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-white'
          : 'text-text-secondary hover:bg-surface hover:text-text',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}
