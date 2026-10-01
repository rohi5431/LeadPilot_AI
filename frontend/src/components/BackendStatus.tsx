import { useState, useEffect } from 'react'
import { getHealthStatus } from '../services/api'
import type { HealthResponse } from '../types/api'

type CheckState = 'checking' | 'connected' | 'error'

/**
 * BackendStatus
 *
 * Calls the FastAPI health endpoint on mount and displays one of three states:
 * - checking  → spinner + "Checking backend..."
 * - connected → green dot + "Connected"
 * - error     → red dot + "Backend unavailable" + help message
 */
export default function BackendStatus() {
  const [state, setState] = useState<CheckState>('checking')
  const [data, setData] = useState<HealthResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    getHealthStatus()
      .then((health) => {
        if (!cancelled) {
          setData(health)
          setState('connected')
        }
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-text-muted">
        Backend Status
      </h2>

      {state === 'checking' && (
        <div className="flex items-center gap-3">
          {/* Spinner */}
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-text-secondary">Checking backend…</span>
        </div>
      )}

      {state === 'connected' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {/* Green dot */}
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-emerald-700">Connected</span>
          </div>
          {data && (
            <p className="pl-6 text-xs text-text-muted">
              Service: <span className="font-mono">{data.service}</span> &nbsp;·&nbsp; Status:{' '}
              <span className="font-mono">{data.status}</span>
            </p>
          )}
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {/* Red dot */}
            <span className="inline-flex h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-700">Backend unavailable</span>
          </div>
          <p className="pl-6 text-xs text-text-muted">
            Make sure the FastAPI server is running on{' '}
            <span className="font-mono text-text-secondary">
              {import.meta.env.VITE_API_BASE_URL}
            </span>
            .
          </p>
        </div>
      )}
    </div>
  )
}
