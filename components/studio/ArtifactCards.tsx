'use client'

import { useState } from 'react'
import { CalendarCheck, CalendarPlus, Check, Copy, Lightbulb, PenLine, ThumbsDown, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  scheduleDraft,
  submitDraftFeedback,
  updateDraft,
  type DraftStatus,
  type StudioDraft,
  type StudioIdea,
} from '@/lib/api'

const chip =
  'inline-flex items-center rounded-full border border-alpha-10 bg-alpha-5 px-2 py-0.5 text-caption-2 font-medium text-alpha-60'
const lime =
  'inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-secondary-300 px-3 py-1.5 text-caption-1 font-semibold text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none'
const quiet =
  'inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-alpha-10 bg-white px-3 py-1.5 text-caption-1 font-medium text-alpha-60 transition-colors hover:border-primary-900 hover:text-primary-900 disabled:opacity-50 disabled:pointer-events-none'

const TIP_LABELS: Record<string, string> = {
  why_this_format: 'Why this format',
  best_time: 'When to post',
  modelled_on: 'Modelled on',
  watch_out: 'Watch out',
}

/* ── Idea ───────────────────────────────────────────────────── */

interface IdeaCardProps {
  idea: StudioIdea
  onDraft: (idea: StudioIdea) => void
  compact?: boolean
  disabled?: boolean
}

export function IdeaCard({ idea, onDraft, compact = false, disabled = false }: IdeaCardProps) {
  return (
    <div className="rounded-[14px] border border-alpha-10 bg-white p-4 shadow-card">
      {/* In the conversation the action sits under the text on phones; the compact panel card keeps it beside */}
      <div className={cn('flex gap-3', compact ? 'items-start justify-between' : 'flex-col sm:flex-row sm:items-start sm:justify-between')}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={chip}>
              <Lightbulb className="mr-1 size-3" />
              idea
            </span>
            <span className={chip}>{idea.format}</span>
          </div>
          <p className="mt-2 text-body-2 font-semibold text-primary-900">{idea.title_pillar}</p>
          {!compact && <p className="mt-1 text-caption-1 text-primary-900/80">{idea.angle}</p>}
        </div>
        <button
          type="button"
          onClick={() => onDraft(idea)}
          disabled={disabled}
          className={cn(lime, 'shrink-0', !compact && 'w-full sm:w-auto')}
        >
          <Wand2 className="size-3.5" />
          Draft this
        </button>
      </div>
      {!compact && (
        <div className="mt-3 space-y-1 text-caption-1">
          <p>
            <span className="font-semibold text-alpha-60">Hook · </span>
            <span className="text-primary-900">{idea.hook_suggestion}</span>
          </p>
          <p>
            <span className="font-semibold text-alpha-60">CTA · </span>
            <span className="text-primary-900">{idea.cta_suggestion}</span>
          </p>
          <p className="pt-1 text-caption-2 italic text-alpha-60">{idea.rationale}</p>
        </div>
      )}
    </div>
  )
}

/* ── Draft ──────────────────────────────────────────────────── */

interface DraftCardProps {
  draft: StudioDraft
  projectId: string
  onRevise: (draft: StudioDraft) => void
  compact?: boolean
  disabled?: boolean
}

export function DraftCard({ draft, projectId, onRevise, compact = false, disabled = false }: DraftCardProps) {
  const [status, setStatus] = useState<DraftStatus>('PENDING')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scriptOpen, setScriptOpen] = useState(false)
  const [scheduled, setScheduled] = useState<{ when: string; reason: string } | null>(null)
  const [scheduling, setScheduling] = useState(false)

  async function schedule() {
    if (!draft.id || scheduling) return
    setScheduling(true)
    try {
      const res = await scheduleDraft(projectId, draft.id)
      setStatus('APPROVED')
      setScheduled({
        when: new Date(res.data.item.scheduled_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        reason: res.data.reason,
      })
    } catch {
      // the Library offers the same action with a visible error
    } finally {
      setScheduling(false)
    }
  }

  async function decide(next: 'APPROVED' | 'REJECTED') {
    if (!draft.id || saving) return
    setSaving(true)
    const previous = status
    setStatus(next)
    try {
      await updateDraft(projectId, draft.id, { status: next })
      // Feedback is what brand memory learns from
      await submitDraftFeedback(projectId, draft.id, next === 'APPROVED' ? 'approved' : 'rejected')
    } catch {
      setStatus(previous)
    } finally {
      setSaving(false)
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(draft.caption_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const tips = Object.entries(draft.tips ?? {}).filter(([, v]) => Boolean(v))

  return (
    <div
      className={cn(
        'rounded-[14px] border bg-white p-4 shadow-card',
        status === 'APPROVED' ? 'border-success-300' : status === 'REJECTED' ? 'border-alpha-10 opacity-70' : 'border-secondary-400',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={chip}>
          <PenLine className="mr-1 size-3" />
          draft v{draft.version ?? 1}
        </span>
        <span className={chip}>{draft.format}</span>
        {draft.language && <span className={chip}>{draft.language}</span>}
        {status !== 'PENDING' && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-caption-2 font-semibold',
              status === 'APPROVED' ? 'bg-success-100 text-success-700' : 'bg-alpha-10 text-alpha-60',
            )}
          >
            {status === 'APPROVED' ? 'Approved' : 'Rejected'}
          </span>
        )}
      </div>
      <p className="mt-2 text-body-2 font-semibold text-primary-900">{draft.idea_title}</p>

      <p className={cn('mt-2 whitespace-pre-wrap text-caption-1 leading-relaxed text-primary-900', compact && 'line-clamp-3')}>
        {draft.caption_text}
      </p>

      {!compact && draft.video_script && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setScriptOpen((v) => !v)}
            className="text-caption-1 font-semibold text-primary-900 underline-offset-2 hover:underline"
          >
            {scriptOpen ? 'Hide script' : 'Show script'}
          </button>
          {scriptOpen && (
            <pre className="mt-2 whitespace-pre-wrap rounded-[10px] bg-alpha-5 p-3 font-sans text-caption-1 leading-relaxed text-primary-900">
              {draft.video_script}
            </pre>
          )}
        </div>
      )}

      {!compact && (draft.hook_alternatives.length > 0 || draft.cta_alternatives.length > 0) && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {draft.hook_alternatives.length > 0 && (
            <div>
              <p className="text-caption-2 font-semibold uppercase tracking-wide text-alpha-40">Other hooks</p>
              <ul className="mt-1 space-y-1 list-disc pl-4">
                {draft.hook_alternatives.map((h, i) => (
                  <li key={i} className="text-caption-1 text-primary-900">{h}</li>
                ))}
              </ul>
            </div>
          )}
          {draft.cta_alternatives.length > 0 && (
            <div>
              <p className="text-caption-2 font-semibold uppercase tracking-wide text-alpha-40">Other CTAs</p>
              <ul className="mt-1 space-y-1 list-disc pl-4">
                {draft.cta_alternatives.map((c, i) => (
                  <li key={i} className="text-caption-1 text-primary-900">{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!compact && tips.length > 0 && (
        <div className="mt-3 rounded-[10px] border border-secondary-200 bg-secondary-50 px-3 py-2.5">
          <ul className="space-y-1">
            {tips.map(([key, value]) => (
              <li key={key} className="text-caption-1 text-primary-900">
                <span className="font-semibold">{TIP_LABELS[key] ?? key} · </span>
                {value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {scheduled && (
        <p className="mt-3 inline-flex items-start gap-1.5 rounded-[10px] border border-success-300 bg-success-50 px-3 py-2 text-caption-2 text-success-700">
          <CalendarCheck className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-semibold">Scheduled · {scheduled.when}.</span> {scheduled.reason}
          </span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {status === 'APPROVED' && !scheduled ? (
          <button type="button" onClick={schedule} disabled={disabled || scheduling || !draft.id} className={lime}>
            <CalendarPlus className="size-3.5" />
            {scheduling ? 'Finding the best slot…' : 'Schedule'}
          </button>
        ) : (
          <button type="button" onClick={() => decide('APPROVED')} disabled={disabled || saving || !draft.id || status === 'APPROVED'} className={lime}>
            <Check className="size-3.5" />
            {status === 'APPROVED' ? 'Approved' : 'Approve'}
          </button>
        )}
        <button type="button" onClick={() => onRevise(draft)} disabled={disabled} className={quiet}>
          <Wand2 className="size-3.5" />
          Revise
        </button>
        <button type="button" onClick={() => decide('REJECTED')} disabled={disabled || saving || !draft.id || status === 'REJECTED'} className={quiet}>
          <ThumbsDown className="size-3.5" />
          Reject
        </button>
        <button type="button" onClick={copyCaption} className={cn(quiet, 'ml-auto')} aria-label="Copy caption">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
