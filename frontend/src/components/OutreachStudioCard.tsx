import { useState } from 'react'
import type { Lead } from '../types/lead'
import type { OutreachResponse, OutreachTone, OutreachChannel } from '../types/outreach'
import { generateOutreach } from '../services/api'

interface OutreachStudioCardProps {
  lead: Lead
}

const TONES: { id: OutreachTone; label: string; desc: string }[] = [
  { id: 'consultative', label: 'Consultative', desc: 'Advisory & empathetic fit' },
  { id: 'urgent', label: 'High Urgency', desc: 'Market momentum & limited stock' },
  { id: 'friendly', label: 'Friendly & Warm', desc: 'Casual conversation starter' },
  { id: 'professional', label: 'Executive', desc: 'Structured & data-focused' },
]

export default function OutreachStudioCard({ lead }: OutreachStudioCardProps) {
  const [selectedTone, setSelectedTone] = useState<OutreachTone>('consultative')
  const [activeChannel, setActiveChannel] = useState<OutreachChannel>('whatsapp')
  const [outreach, setOutreach] = useState<OutreachResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null)

  const handleGenerate = async (toneToUse = selectedTone) => {
    if (isGenerating || lead.aiAnalysis === null) return
    setIsGenerating(true)
    setError(null)

    try {
      const res = await generateOutreach(lead.id, toneToUse)
      setOutreach(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outreach copy.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToneChange = (tone: OutreachTone) => {
    setSelectedTone(tone)
    if (outreach) {
      handleGenerate(tone)
    }
  }

  const handleCopy = (text: string, channelKey: string) => {
    navigator.clipboard.writeText(text)
    setCopiedChannel(channelKey)
    setTimeout(() => setCopiedChannel(null), 2000)
  }

  const cleanPhone = lead.mobileNumber ? lead.mobileNumber.replace(/[^0-9]/g, '') : ''

  return (
    <div className="rounded-xl border border-indigo-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L32 6l-6 18-9-9-9 9 3-12" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI Outreach Studio</h2>
            <p className="text-xs font-semibold text-slate-600">
              Generate tailored sales copy for WhatsApp, Email & SMS
            </p>
          </div>
        </div>

        {/* Generate / Regenerate Button */}
        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating || lead.aiAnalysis === null}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
            isGenerating || lead.aiAnalysis === null
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generating Copy…
            </>
          ) : outreach ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Regenerate Copy
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate Outreach Copy
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
          {error}
        </div>
      )}

      {/* Tone Selection Pills */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
          Outreach Tone & Framing
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TONES.map((t) => {
            const isSelected = selectedTone === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToneChange(t.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-bold text-slate-900">
                  {t.label}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 mt-0.5 leading-snug">
                  {t.desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Initial Empty State before generation */}
      {!outreach && !isGenerating && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
          <p className="text-sm font-bold text-slate-800">Ready to draft personalized outreach messaging</p>
          <p className="text-xs font-medium text-slate-600 mt-1 max-w-md mx-auto">
            Select your preferred tone above and click <strong>"Generate Outreach Copy"</strong> to produce high-converting messages tailored to {lead.name}'s requirements.
          </p>
        </div>
      )}

      {/* Generated Content Studio */}
      {outreach && (
        <div className="space-y-4">
          {/* Channel Tabs */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setActiveChannel('whatsapp')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeChannel === 'whatsapp'
                  ? 'border-emerald-600 text-emerald-800 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setActiveChannel('email')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeChannel === 'email'
                  ? 'border-blue-600 text-blue-800 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setActiveChannel('sms')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeChannel === 'sms'
                  ? 'border-amber-600 text-amber-800 font-extrabold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              SMS
            </button>
          </div>

          {/* Active Channel Display Box - White Template Background */}
          <div className="rounded-xl border border-slate-200 bg-white text-slate-900 p-5 shadow-sm space-y-4">
            
            {/* WHATSAPP TAB */}
            {activeChannel === 'whatsapp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    WhatsApp Template
                  </span>
                  <span>Ready for {lead.name}</span>
                </div>
                <div className="whitespace-pre-line text-xs leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-800 font-mono">
                  {outreach.whatsapp}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {cleanPhone ? (
                    <a
                      href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(outreach.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
                    >
                      Send via WhatsApp Web
                    </a>
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold">Phone number not provided</span>
                  )}
                  <button
                    onClick={() => handleCopy(outreach.whatsapp, 'whatsapp')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    {copiedChannel === 'whatsapp' ? 'Copied' : 'Copy Text'}
                  </button>
                </div>
              </div>
            )}

            {/* EMAIL TAB */}
            {activeChannel === 'email' && (
              <div className="space-y-4">
                <div className="space-y-1.5 border-b border-slate-200 pb-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject Line</span>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-900">
                    {outreach.email_subject}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Body</span>
                  <div className="whitespace-pre-line text-xs font-mono leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-800">
                    {outreach.email_body}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}?subject=${encodeURIComponent(outreach.email_subject)}&body=${encodeURIComponent(outreach.email_body)}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-sm"
                    >
                      Open Email Client
                    </a>
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold">Email address not provided</span>
                  )}
                  <button
                    onClick={() => handleCopy(`Subject: ${outreach.email_subject}\n\n${outreach.email_body}`, 'email')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    {copiedChannel === 'email' ? 'Copied' : 'Copy Full Email'}
                  </button>
                </div>
              </div>
            )}

            {/* SMS TAB */}
            {activeChannel === 'sms' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2">
                  <span className="font-bold text-amber-700">Direct SMS Template</span>
                  <span className="font-mono text-[11px] text-slate-500">{outreach.sms.length} chars</span>
                </div>
                <div className="text-xs font-mono leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-800">
                  {outreach.sms}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {cleanPhone ? (
                    <a
                      href={`sms:${cleanPhone}?body=${encodeURIComponent(outreach.sms)}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 transition-all shadow-sm"
                    >
                      Send SMS
                    </a>
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold">Phone number not provided</span>
                  )}
                  <button
                    onClick={() => handleCopy(outreach.sms, 'sms')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    {copiedChannel === 'sms' ? 'Copied' : 'Copy SMS'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
