import { useEffect, useRef, useState } from 'react'
import { getChatHistory, sendChatMessage } from '../services/api'
import type { ChatMessage } from '../types/chat'

interface Props {
  /** The lead ID — used to scope history and messages to the correct lead. */
  leadId: string
}

/**
 * LeadChat — Contextual AI chat for a specific lead.
 *
 * Phase 6:
 *   - Loads existing chat history on mount.
 *   - Allows the salesperson to ask questions about the lead.
 *   - AI answers are grounded to that lead's context only.
 *   - Shows appropriate states: loading, empty, sending, error.
 */
export default function LeadChat({ leadId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Auto-scroll anchor
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Load history on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    getChatHistory(leadId)
      .then((msgs) => {
        if (!cancelled) {
          setMessages(msgs)
          setHistoryLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryLoading(false)
      })

    return () => { cancelled = true }
  }, [leadId])

  // ── Auto-scroll whenever messages change ─────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send handler ─────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setSending(true)
    setSendError(null)

    // Optimistic: show user message immediately
    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    try {
      const reply = await sendChatMessage(leadId, trimmed)
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.slice(0, -1))
      setSendError(err instanceof Error ? err.message : 'Failed to send message.')
      // Restore input so user doesn't lose their question
      setInput(trimmed)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-t-xl border-b border-slate-200 bg-violet-50/80 px-6 py-4">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-600 shadow-sm">
          {/* Chat bubble icon */}
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Contextual AI Assistant</h3>
          <p className="text-xs font-semibold text-slate-600">Ask anything about this lead · Grounded to this lead only</p>
        </div>
      </div>

      {/* ── Message list ────────────────────────────────────────── */}
      <div className="flex h-96 flex-col overflow-y-auto px-6 py-4">
        {/* History loading */}
        {historyLoading && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm font-semibold text-slate-600">Loading conversation…</span>
          </div>
        )}

        {/* Empty state with clickable quick prompt suggestions */}
        {!historyLoading && messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 border border-violet-100">
              <svg className="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Ask anything about this lead</p>
              <p className="text-xs font-semibold text-slate-600 max-w-sm mt-0.5">
                AI Assistant is grounded strictly to this lead's message, requirement, and profile context.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap justify-center gap-2 max-w-lg">
              {[
                "What should I focus on during the call?",
                "How should I handle their budget concern?",
                "Draft a WhatsApp follow-up message",
              ].map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(promptText)
                    // trigger send asynchronously
                    setTimeout(() => {
                      const inputEl = document.getElementById('chat-input') as HTMLTextAreaElement
                      if (inputEl) inputEl.focus()
                    }, 50)
                  }}
                  className="rounded-full border border-violet-200 bg-violet-50/80 px-3.5 py-1.5 text-xs font-bold text-violet-900 hover:bg-violet-100 hover:border-violet-300 transition-all shadow-sm"
                >
                  💡 {promptText}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {!historyLoading && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {/* Sending indicator */}
            {sending && (
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
                  <svg className="h-3.5 w-3.5 animate-spin text-violet-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="rounded-xl rounded-tl-none border border-violet-100 bg-violet-50 px-4 py-2.5">
                  <p className="text-sm font-bold text-violet-800">Thinking…</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Error notice ─────────────────────────────────────────── */}
      {sendError && (
        <div className="mx-6 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
          <p className="text-xs font-bold text-red-700">{sendError}</p>
        </div>
      )}

      {/* ── Input area ──────────────────────────────────────────── */}
      <div className="border-t border-slate-200 px-6 py-4">
        <div className="flex items-end gap-3">
          <textarea
            id="chat-input"
            rows={2}
            placeholder="Ask a question about this lead…"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (sendError) setSendError(null)
            }}
            onKeyDown={handleKeyDown}
            disabled={sending || historyLoading}
            className={[
              'flex-1 resize-none rounded-lg border px-3.5 py-2.5 text-sm font-medium text-slate-900',
              'placeholder:text-slate-400 placeholder:font-normal',
              'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
              'transition-colors bg-white border-slate-300',
            ].join(' ')}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || historyLoading}
            className={[
              'flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold text-white',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
            ].join(' ')}
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-600">
          Press <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-xs font-mono">Enter</kbd> to send ·{' '}
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-xs font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[80%] rounded-xl rounded-tr-none bg-blue-600 px-4 py-2.5 shadow-sm">
          <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-white">
            {message.content}
          </p>
        </div>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-3.5 w-3.5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100">
        <svg className="h-3.5 w-3.5 text-violet-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="max-w-[80%] rounded-xl rounded-tl-none border border-violet-200 bg-violet-50/80 px-4 py-2.5 shadow-sm">
        <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-900">
          {message.content}
        </p>
      </div>
    </div>
  )
}
