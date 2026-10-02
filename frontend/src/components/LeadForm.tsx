import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLead } from '../services/api'
import type { LeadCreate, Lead } from '../types/lead'

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

  function handleAutofillSample() {
    setForm({
      name: 'Rahul Sharma',
      mobileNumber: '9876543210',
      email: 'rahul.sharma@example.com',
      location: 'Bandra West, Mumbai',
      propertyRequirement: '3 BHK Luxury Apartment',
      budget: '3.5 Crores',
      buyingTimeline: 'Within 1 month',
      customerMessage: 'Looking for a ready-to-move 3 BHK near Carter Road. Have pre-approved home loan and want to schedule site visits this weekend.',
    })
    setErrors({})
  }

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
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Card Header with Auto-fill Sample */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Lead</h2>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Fill in contact, property requirements, and customer enquiry notes for AI scoring.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutofillSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 transition-colors shadow-sm self-start sm:self-auto"
          >
            <span>✨ Auto-fill Sample Lead</span>
          </button>
        </div>

        {/* ── Full success ──────────────────────────────────────── */}
        {submitState === 'success' && createdLead && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/90 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-900">Lead added & analyzed successfully!</p>
              <p className="mt-0.5 font-mono text-xs text-emerald-700 font-semibold">ID: {createdLead.id}</p>
            </div>
            <button
              onClick={() => navigate(`/leads/${createdLead.id}`)}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-sm"
            >
              View Lead Details →
            </button>
          </div>
        )}

        {/* ── Partial success ───────────────────────────────────── */}
        {submitState === 'partial' && createdLead && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/90 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-900">
                Lead saved, but AI analysis is currently unavailable.
              </p>
              <p className="mt-0.5 font-mono text-xs text-amber-700 font-semibold">ID: {createdLead.id}</p>
            </div>
            <button
              onClick={() => navigate(`/leads/${createdLead.id}`)}
              className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 transition-colors shadow-sm"
            >
              View Lead →
            </button>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────── */}
        {submitState === 'error' && apiError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-bold text-red-800">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* ── Section 1: Contact Information ───────────────── */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase">
                Contact Information
              </h3>
            </div>

            <Field id="name" label="Customer Name" error={errors.name}>
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
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase">
                Property Requirements
              </h3>
            </div>

            <Field id="location" label="Location Preference" error={errors.location}>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Bandra West, Mumbai"
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
                placeholder="e.g. 3 BHK Luxury Apartment"
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
                  placeholder="e.g. 1.5 - 2 Crores"
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
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase">
                Customer Message & Notes
              </h3>
            </div>

            <Field id="customerMessage" label="Customer Inquiry Message" error={errors.customerMessage}>
              <textarea
                id="customerMessage"
                name="customerMessage"
                rows={4}
                placeholder="Paste customer enquiry or write message summary (e.g. 'Looking for 3 BHK in Bandra, budget 3.5Cr, pre-approved loan')."
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
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Analyzing lead with AI…
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Create Lead & Run AI Analysis
              </>
            )}
          </button>
        </form>
      </div>
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
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-900">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-bold text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean): string {
  return [
    'w-full rounded-lg border px-3.5 py-2.5 text-sm font-semibold text-slate-900',
    'placeholder:text-slate-400 placeholder:font-normal',
    'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
    'transition-colors bg-white',
    hasError ? 'border-red-400' : 'border-slate-300 hover:border-slate-400',
  ].join(' ')
}
