import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeads } from '../services/api'
import type { Lead, Priority } from '../types/lead'
import AppHeader from '../components/AppHeader'
import LeadCard from '../components/LeadCard'

type LoadState = 'loading' | 'success' | 'error'
type PriorityFilter = 'ALL' | Priority
type SortOption = 'score_desc' | 'score_asc' | 'name_asc' | 'name_desc'

/**
 * LeadsPage — the main page for viewing, searching, filtering, and sorting all saved leads.
 *
 * Displays:
 * 1. Compact dynamic summary cards (All, HOT, WARM, COLD) with 1-click filtering.
 * 2. Multi-field client-side search (Name, Location, Requirement, Budget, Email, Phone).
 * 3. Priority filter dropdown.
 * 4. Multi-criteria sort dropdown (AI Score High/Low, Name A-Z/Z-A).
 * 5. Dynamic result counts and empty state handling.
 */
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')

  // Filter & Search & Sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL')
  const [sortBy, setSortBy] = useState<SortOption>('score_desc')

  useEffect(() => {
    let cancelled = false

    getLeads()
      .then((data) => {
        if (!cancelled) {
          setLeads(data)
          setLoadState('success')
        }
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // ── Dynamic Summary Counts ─────────────────────────────────────────
  const totalCount = leads.length
  const hotCount = leads.filter((l) => l.aiAnalysis?.priority === 'HOT').length
  const warmCount = leads.filter((l) => l.aiAnalysis?.priority === 'WARM').length
  const coldCount = leads.filter((l) => l.aiAnalysis?.priority === 'COLD').length

  // ── Client-side Filter & Search logic ──────────────────────────────
  const filteredLeads = leads.filter((lead) => {
    // 1. Priority filter
    if (priorityFilter !== 'ALL' && lead.aiAnalysis?.priority !== priorityFilter) {
      return false
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const nameMatch = lead.name.toLowerCase().includes(q)
      const locationMatch = lead.location.toLowerCase().includes(q)
      const reqMatch = lead.propertyRequirement.toLowerCase().includes(q)
      const budgetMatch = lead.budget.toLowerCase().includes(q)
      const emailMatch = lead.email ? lead.email.toLowerCase().includes(q) : false
      const mobileMatch = lead.mobileNumber ? lead.mobileNumber.toLowerCase().includes(q) : false

      if (!nameMatch && !locationMatch && !reqMatch && !budgetMatch && !emailMatch && !mobileMatch) {
        return false
      }
    }

    return true
  })

  // ── Sorting derived leads ──────────────────────────────────────────
  const displayedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'score_desc') {
      const scoreA = a.aiAnalysis?.priorityScore ?? -1
      const scoreB = b.aiAnalysis?.priorityScore ?? -1
      return scoreB - scoreA
    }
    if (sortBy === 'score_asc') {
      const scoreA = a.aiAnalysis?.priorityScore ?? -1
      const scoreB = b.aiAnalysis?.priorityScore ?? -1
      return scoreA - scoreB
    }
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'name_desc') {
      return b.name.localeCompare(a.name)
    }
    return 0
  })

  const isFilteredOrSearched = priorityFilter !== 'ALL' || searchQuery.trim().length > 0

  const clearFilters = () => {
    setSearchQuery('')
    setPriorityFilter('ALL')
    setSortBy('score_desc')
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-10">
        {/* ── Page heading ────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Leads</h1>
            <p className="mt-0.5 text-sm text-text-muted">
              Manage, search, and review your prioritized real-estate leads.
            </p>
          </div>

          <Link
            to="/add-lead"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          >
            + Add Lead
          </Link>
        </div>

        {/* ── Summary Cards ────────────────────────────────────── */}
        {loadState === 'success' && leads.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Card 1: All Leads */}
            <button
              type="button"
              onClick={() => setPriorityFilter('ALL')}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                priorityFilter === 'ALL'
                  ? 'border-primary bg-blue-50/70 shadow-sm ring-1 ring-primary'
                  : 'border-border bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                All Leads
              </span>
              <span className="mt-2 text-2xl font-bold text-text">{totalCount}</span>
            </button>

            {/* Card 2: HOT */}
            <button
              type="button"
              onClick={() => setPriorityFilter('HOT')}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-red-400 ${
                priorityFilter === 'HOT'
                  ? 'border-red-300 bg-red-50/70 shadow-sm ring-1 ring-red-400'
                  : 'border-border bg-white hover:border-red-200 hover:bg-red-50/40'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                HOT
              </span>
              <span className="mt-2 text-2xl font-bold text-red-700">{hotCount}</span>
            </button>

            {/* Card 3: WARM */}
            <button
              type="button"
              onClick={() => setPriorityFilter('WARM')}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                priorityFilter === 'WARM'
                  ? 'border-amber-300 bg-amber-50/70 shadow-sm ring-1 ring-amber-400'
                  : 'border-border bg-white hover:border-amber-200 hover:bg-amber-50/40'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                WARM
              </span>
              <span className="mt-2 text-2xl font-bold text-amber-700">{warmCount}</span>
            </button>

            {/* Card 4: COLD */}
            <button
              type="button"
              onClick={() => setPriorityFilter('COLD')}
              className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                priorityFilter === 'COLD'
                  ? 'border-slate-400 bg-slate-100 shadow-sm ring-1 ring-slate-400'
                  : 'border-border bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                COLD
              </span>
              <span className="mt-2 text-2xl font-bold text-slate-700">{coldCount}</span>
            </button>
          </div>
        )}

        {/* ── Toolbar (Search, Filter, Sort) ────────────────────── */}
        {loadState === 'success' && leads.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads by name, location, requirements..."
                aria-label="Search leads"
                className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm text-text placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-text-muted hover:text-text"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Priority Dropdown */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                aria-label="Filter by priority"
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All priorities</option>
                <option value="HOT">HOT priority</option>
                <option value="WARM">WARM priority</option>
                <option value="COLD">COLD priority</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort leads"
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="score_desc">AI Score: High → Low</option>
                <option value="score_asc">AI Score: Low → High</option>
                <option value="name_asc">Name: A → Z</option>
                <option value="name_desc">Name: Z → A</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Dynamic Result Count & Reset ──────────────────────── */}
        {loadState === 'success' && leads.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium text-text-muted">
              {isFilteredOrSearched ? (
                <span>
                  Showing <strong className="text-text">{displayedLeads.length}</strong> of{' '}
                  <strong className="text-text">{totalCount}</strong> leads
                </span>
              ) : (
                <span>
                  <strong className="text-text">{totalCount}</strong> {totalCount === 1 ? 'lead' : 'leads'} total
                </span>
              )}
            </p>

            {isFilteredOrSearched && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ── Loading state ────────────────────────────────────── */}
        {loadState === 'loading' && (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <svg
                className="h-4 w-4 animate-spin text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Loading leads…
            </div>
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────── */}
        {loadState === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="mb-1 text-sm font-medium text-red-800">Unable to load leads.</p>
            <p className="text-xs text-red-600">
              Make sure the FastAPI backend is running at{' '}
              {import.meta.env.VITE_API_BASE_URL}.
            </p>
          </div>
        )}

        {/* ── Initial Empty state (No leads in DB) ───────────────── */}
        {loadState === 'success' && leads.length === 0 && (
          <div className="rounded-xl border border-border bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface">
              <svg
                className="h-6 w-6 text-text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <p className="mb-1 text-base font-semibold text-text">No leads yet</p>
            <p className="mb-6 text-sm text-text-muted">
              Add your first lead to start prioritizing inbound opportunities.
            </p>
            <Link
              to="/add-lead"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              + Add Lead
            </Link>
          </div>
        )}

        {/* ── Filter/Search No Matches State ─────────────────────── */}
        {loadState === 'success' && leads.length > 0 && displayedLeads.length === 0 && (
          <div className="rounded-xl border border-border bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface">
              <svg className="h-5 w-5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
              </svg>
            </div>
            <p className="mb-1 text-sm font-semibold text-text">No matching leads</p>
            <p className="mb-4 text-xs text-text-muted">
              Try changing your search terms or priority filter settings.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text hover:bg-slate-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Lead Grid ────────────────────────────────────────── */}
        {loadState === 'success' && displayedLeads.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {displayedLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
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
