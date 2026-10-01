import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLead } from '../services/api'
import type { LeadCreate, Lead } from '../types/lead'
import LeadAnalysisCard from './LeadAnalysisCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormErrors = Partial<Record<keyof LeadCreate, string>>

/**
 * Submit states:
 * - idle      → ready
 * - loading   → POST in flight (includes Gemini analysis wait)
 * - success   → lead saved + AI analysis returned
 * - partial   → lead saved, AI analysis failed (ai_analysis: null)
 * - error     → network/server failure before lead was saved
 */
type SubmitState = 'idle' | 'loading' | 'success' | 'partial' | 'error'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM: LeadCreate = {
  name: '',
  mobileNumber: '',
  email: '',
  location: '',
  propertyRequirement: '',
  budget: '',
  buyingTimeline: '',
  customerMessage: '',
}

const TIMELINE_OPTIONS = [
  'Immediately',
  'Within 1 month',
  'Within 2 months',
  'Within 3 months',
  'Within 6 months',
  'More than 6 months',
  'Not decided',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateField(key: keyof LeadCreate, value: string): string | undefined {
  const trimmed = value.trim()
  if (key === 'email') {
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Please enter a valid email address.'
    }
    return undefined
  }

  if (key === 'mobileNumber') {
    if (!trimmed) return 'Mobile Number is required.'
    const digitsOnly = trimmed.replace(/\D/g, '')
    if (digitsOnly.length < 10 || digitsOnly.length > 12) {
      return 'Please enter a valid mobile number (e.g., 9876543210).'
    }
    return undefined
  }

  if (!trimmed) {
    const labels: Record<keyof LeadCreate, string> = {
      name: 'Name',
      mobileNumber: 'Mobile Number',
      email: 'Email Address',
      location: 'Location',
      propertyRequirement: 'Property Requirement',
      budget: 'Budget',
      buyingTimeline: 'Buying Timeline',
      customerMessage: 'Customer Message',
    }
    return `${labels[key]} is required.`
  }
  return undefined
}

function validateAll(form: LeadCreate): FormErrors {
  const errors: FormErrors = {}
  ;(Object.keys(form) as Array<keyof LeadCreate>).forEach((key) => {
    const err = validateField(key, form[key] || '')
    if (err) errors[key] = err
  })
  return errors
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeadForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState<LeadCreate>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [createdLead, setCreatedLead] = useState<Lead | null>(null)
  const [apiError, setApiError] = useState<string>('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    const key = name as keyof LeadCreate
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationErrors = validateAll(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitState('loading')
    setApiError('')
    setCreatedLead(null)

    try {
      const lead = await createLead(form)
      setCreatedLead(lead)
      setForm(EMPTY_FORM)
      setErrors({})
      setSubmitState(lead.aiAnalysis !== null ? 'success' : 'partial')
    } catch {
      setApiError('Unable to add lead. Please check the backend connection and try again.')
      setSubmitState('error')
    }
  }

  const isLoading = submitState === 'loading'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-text">Add New Lead</h2>
        <p className="mb-8 text-sm text-text-muted">Fill in contact, requirement, and enquiry details.</p>

        {/* ── Full success ──────────────────────────────────────── */}
        {submitState === 'success' && createdLead && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-800">Lead analysed successfully.</p>
            <p className="mt-0.5 font-mono text-xs text-emerald-600">ID: {createdLead.id}</p>
            <button
              onClick={() => navigate(`/leads/${createdLead.id}`)}
              className="mt-2 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors"
            >
              View Lead →
            </button>
          </div>
        )}

        {/* ── Partial success ───────────────────────────────────── */}
        {submitState === 'partial' && createdLead && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              Lead saved, but AI analysis is currently unavailable.
            </p>
            <p className="mt-0.5 font-mono text-xs text-amber-600">ID: {createdLead.id}</p>
            <button
              onClick={() => navigate(`/leads/${createdLead.id}`)}
              className="mt-2 rounded-lg bg-amber-700 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-800 transition-colors"
            >
              View Lead →
            </button>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────── */}
        {submitState === 'error' && apiError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* ── Section 1: Contact Information ───────────────── */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">
                Contact Information
              </h3>
            </div>

            <Field id="name" label="Name" error={errors.name}>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Rohit Kumar"
                value={form.name}
                onChange={handleChange}
                disabled={isLoading}
                className={inputClass(!!errors.name)}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="mobileNumber" label="Mobile Number" error={errors.mobileNumber}>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={inputClass(!!errors.mobileNumber)}
                />
              </Field>

              <Field id="email" label="Email Address (Optional)" error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. rohit@example.com"
                  value={form.email || ''}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={inputClass(!!errors.email)}
                />
              </Field>
            </div>
          </div>

          {/* ── Section 2: Property Requirements ─────────────── */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">
                Property Requirements
              </h3>
            </div>

            <Field id="location" label="Location" error={errors.location}>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Mumbai"
                value={form.location}
                onChange={handleChange}
                disabled={isLoading}
                className={inputClass(!!errors.location)}
              />
            </Field>

            <Field
              id="propertyRequirement"
              label="Property Requirement"
              error={errors.propertyRequirement}
            >
              <input
                id="propertyRequirement"
                name="propertyRequirement"
                type="text"
                placeholder="e.g. 3 BHK"
                value={form.propertyRequirement}
                onChange={handleChange}
                disabled={isLoading}
                className={inputClass(!!errors.propertyRequirement)}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="budget" label="Budget" error={errors.budget}>
                <input
                  id="budget"
                  name="budget"
                  type="text"
                  placeholder="e.g. 1.5 crores"
                  value={form.budget}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={inputClass(!!errors.budget)}
                />
              </Field>

              <Field id="buyingTimeline" label="Buying Timeline" error={errors.buyingTimeline}>
                <select
                  id="buyingTimeline"
                  name="buyingTimeline"
                  value={form.buyingTimeline}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={inputClass(!!errors.buyingTimeline)}
                >
                  <option value="">Select timeline…</option>
                  {TIMELINE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* ── Section 3: Customer Message ──────────────────── */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase">
                Customer Message
              </h3>
            </div>

            <Field id="customerMessage" label="Customer Message" error={errors.customerMessage}>
              <textarea
                id="customerMessage"
                name="customerMessage"
                rows={4}
                placeholder="What did the customer say? Include any specific requirements or enquiry notes."
                value={form.customerMessage}
                onChange={handleChange}
                disabled={isLoading}
                className={inputClass(!!errors.customerMessage)}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Analysing lead with AI…' : 'Add Lead'}
          </button>
        </form>
      </div>

      {/* AI analysis preview below a successful submission */}
      {submitState === 'success' && createdLead?.aiAnalysis && (
        <LeadAnalysisCard analysis={createdLead.aiAnalysis} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean): string {
  return [
    'w-full rounded-lg border px-3 py-2.5 text-sm text-text',
    'placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted',
    'transition-colors bg-white',
    hasError ? 'border-red-400' : 'border-border hover:border-primary/50',
  ].join(' ')
}
