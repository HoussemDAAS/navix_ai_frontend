'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  Check,
  Lightbulb,
  MessagesSquare,
  PenLine,
  RefreshCw,
  ThumbsDown,
  Wand2,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  getCalendar,
  getDirections,
  getDrafts,
  planWeek,
  scheduleDraft,
  selectDirection,
  submitDraftFeedback,
  updateDraft,
  type CalendarItem,
  type ContentDirection,
  type Draft,
  type DraftStatus,
} from '@/lib/api'

function slotLabel(iso: string): string {
  return new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const lime =
  'inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-semibold text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none'
const quiet =
  'inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-alpha-10 bg-white px-3 py-1.5 text-caption-1 font-medium text-alpha-60 transition-colors hover:border-primary-900 hover:text-primary-900 disabled:opacity-50 disabled:pointer-events-none'
const chip =
  'inline-flex items-center rounded-full border border-alpha-10 bg-alpha-5 px-2 py-0.5 text-caption-2 font-medium text-alpha-60'

type Tab = 'ideas' | 'drafts'
type IdeaFilter = 'all' | 'studio' | 'generated'
type DraftFilter = 'all' | DraftStatus

const STATUS_LABEL: Record<DraftStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

function studioHref(projectId: string, prompt: string): string {
  return `/projects/${projectId}/studio?prompt=${encodeURIComponent(prompt)}`
}

function LibraryContent() {
  const params = useParams()
  const projectId = params.id as string

  const [tab, setTab] = useState<Tab>('ideas')
  const [ideaFilter, setIdeaFilter] = useState<IdeaFilter>('all')
  const [draftFilter, setDraftFilter] = useState<DraftFilter>('all')
  const [ideas, setIdeas] = useState<ContentDirection[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [calendar, setCalendar] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [planning, setPlanning] = useState(false)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ideasRes, draftsRes, calendarRes] = await Promise.all([
        getDirections(projectId).catch(() => ({ data: [] as ContentDirection[] })),
        getDrafts(projectId).catch(() => ({ data: [] as Draft[] })),
        getCalendar(projectId).catch(() => ({ data: [] as CalendarItem[] })),
      ])
      setIdeas(ideasRes.data ?? [])
      setDrafts(draftsRes.data ?? [])
      setCalendar(calendarRes.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your library.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const visibleIdeas = useMemo(() => {
    const list = [...ideas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (ideaFilter === 'all') return list
    return list.filter((i) => (ideaFilter === 'studio' ? i.source === 'studio' : i.source !== 'studio'))
  }, [ideas, ideaFilter])

  const visibleDrafts = useMemo(() => {
    const list = [...drafts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return draftFilter === 'all' ? list : list.filter((d) => d.status === draftFilter)
  }, [drafts, draftFilter])

  const toggleSelected = useCallback(
    async (idea: ContentDirection) => {
      const next = !idea.selected
      setIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, selected: next } : i)))
      try {
        await selectDirection(projectId, idea.id, next)
      } catch {
        setIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, selected: !next } : i)))
      }
    },
    [projectId],
  )

  const decide = useCallback(
    async (draft: Draft, status: 'APPROVED' | 'REJECTED') => {
      const previous = draft.status
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, status } : d)))
      try {
        await updateDraft(projectId, draft.id, { status })
        // Feedback is what brand memory learns from
        await submitDraftFeedback(projectId, draft.id, status === 'APPROVED' ? 'approved' : 'rejected')
      } catch {
        setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, status: previous } : d)))
      }
    },
    [projectId],
  )

  // Which drafts already sit on the calendar
  const scheduledByDraft = useMemo(() => {
    const map = new Map<string, CalendarItem>()
    for (const item of calendar) {
      if (item.draft_id && item.status !== 'cancelled' && !map.has(item.draft_id)) map.set(item.draft_id, item)
    }
    return map
  }, [calendar])

  const schedule = useCallback(
    async (draft: Draft) => {
      setSchedulingId(draft.id)
      setNotice(null)
      try {
        const res = await scheduleDraft(projectId, draft.id)
        setCalendar((prev) => (prev.some((i) => i.id === res.data.item.id) ? prev : [...prev, res.data.item]))
        setDrafts((prev) => prev.map((d) => (d.id === draft.id && d.status === 'PENDING' ? { ...d, status: 'APPROVED' } : d)))
        setNotice(`${res.data.already ? 'Already scheduled' : 'Scheduled'} for ${slotLabel(res.data.item.scheduled_at)}. ${res.data.reason}`)
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Could not schedule this draft.')
      } finally {
        setSchedulingId(null)
      }
    },
    [projectId],
  )

  const plan = useCallback(async () => {
    setPlanning(true)
    setNotice(null)
    try {
      const res = await planWeek(projectId)
      setCalendar((prev) => [...prev, ...res.data.items.filter((i) => !prev.some((p) => p.id === i.id))])
      setNotice(
        res.data.items.length === 0
          ? 'Nothing to plan — approve a draft first.'
          : `${res.data.items.length} draft${res.data.items.length > 1 ? 's' : ''} placed on your calendar: ${res.data.items
              .map((i) => slotLabel(i.scheduled_at))
              .join(' · ')}. ${res.data.reasons[0] ?? ''}`,
      )
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not plan the week.')
    } finally {
      setPlanning(false)
    }
  }, [projectId])

  const counts = {
    ideas: ideas.length,
    drafts: drafts.length,
    pending: drafts.filter((d) => d.status === 'PENDING').length,
    approved: drafts.filter((d) => d.status === 'APPROVED').length,
    toPlan: drafts.filter((d) => d.status === 'APPROVED' && !scheduledByDraft.has(d.id)).length,
  }

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <h1 className="text-h5 font-bold text-primary-900 sm:text-h4">Library</h1>
          <p className="mt-1.5 text-body-2 text-alpha-60">
            Everything the Studio produced: ideas to develop, drafts to approve.
            {counts.pending > 0 && ` ${counts.pending} draft${counts.pending > 1 ? 's' : ''} waiting for your call.`}
          </p>
        </div>
        <Link href={`/projects/${projectId}/studio`} className={cn(lime, 'shrink-0')}>
          <MessagesSquare className="size-4" />
          Open Studio
        </Link>
      </motion.div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-[12px] bg-alpha-5 p-1">
          {(['ideas', 'drafts'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'rounded-[10px] px-4 py-1.5 text-caption-1 font-semibold capitalize transition-colors',
                tab === t ? 'bg-white text-primary-900 shadow-card' : 'text-alpha-60 hover:text-primary-900',
              )}
            >
              {t} <span className="text-alpha-40">{t === 'ideas' ? counts.ideas : counts.drafts}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {tab === 'ideas'
            ? (['all', 'studio', 'generated'] as const).map((f) => (
                <FilterChip key={f} active={ideaFilter === f} onClick={() => setIdeaFilter(f)}>
                  {f === 'all' ? 'All' : f === 'studio' ? 'From Studio' : 'Generated'}
                </FilterChip>
              ))
            : (['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
                <FilterChip key={f} active={draftFilter === f} onClick={() => setDraftFilter(f)}>
                  {f === 'all' ? 'All' : STATUS_LABEL[f]}
                </FilterChip>
              ))}
          {tab === 'drafts' && counts.toPlan > 0 && (
            <button type="button" onClick={() => void plan()} disabled={planning} className={cn(quiet, 'ml-1 border-primary-900 text-primary-900')}>
              <CalendarPlus className={cn('size-3.5', planning && 'animate-pulse')} />
              {planning ? 'Planning…' : `Plan my week (${counts.toPlan})`}
            </button>
          )}
        </div>
      </div>

      {notice && tab === 'drafts' && (
        <p className="mb-4 rounded-[12px] border border-secondary-400 bg-secondary-50 px-4 py-3 text-caption-1 text-primary-900">
          {notice}{' '}
          <Link href={`/projects/${projectId}/calendar`} className="font-semibold underline-offset-2 hover:underline">
            Open calendar
          </Link>
        </p>
      )}

      {loading && (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[16px] border border-destructive-200 bg-destructive-50 p-5">
          <p className="text-body-2 font-semibold text-destructive-700">We couldn&apos;t load your library</p>
          <p className="mt-0.5 text-caption-1 text-destructive-600">{error}</p>
          <button type="button" onClick={() => void load()} className={cn(quiet, 'mt-3')}>
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        </div>
      )}

      {!loading && !error && tab === 'ideas' && (
        visibleIdeas.length === 0 ? (
          <Empty
            icon={Lightbulb}
            title={ideas.length === 0 ? 'No ideas yet' : 'Nothing matches this filter'}
            description="Ideas are content angles Navix proposes in the Studio — each one can become a draft."
            projectId={projectId}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleIdeas.map((idea, i) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
                className="flex flex-col rounded-[16px] border border-alpha-10 bg-white p-4 shadow-card"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {idea.format && <span className={chip}>{idea.format}</span>}
                  <span className={chip}>{idea.source === 'studio' ? 'from Studio' : 'generated'}</span>
                  {idea.selected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-caption-2 font-semibold text-success-700">
                      <Check className="size-3" />
                      Selected
                    </span>
                  )}
                </div>
                <p className="mt-2 text-body-2 font-semibold text-primary-900">{idea.title_pillar}</p>
                {idea.angle && <p className="mt-1 text-caption-1 text-primary-900/80">{idea.angle}</p>}
                {(idea.hook_suggestion || idea.cta_suggestion) && (
                  <div className="mt-2 space-y-0.5 text-caption-2">
                    {idea.hook_suggestion && (
                      <p><span className="font-semibold text-alpha-60">Hook · </span><span className="text-primary-900">{idea.hook_suggestion}</span></p>
                    )}
                    {idea.cta_suggestion && (
                      <p><span className="font-semibold text-alpha-60">CTA · </span><span className="text-primary-900">{idea.cta_suggestion}</span></p>
                    )}
                  </div>
                )}
                {idea.rationale && <p className="mt-2 text-caption-2 italic text-alpha-60">{idea.rationale}</p>}
                <div className="mt-auto flex items-center gap-2 pt-3">
                  <Link
                    href={studioHref(projectId, `Write a draft for the idea "${idea.title_pillar}"${idea.format ? ` as a ${idea.format}` : ''}.`)}
                    className={cn(lime, 'px-3 py-1.5')}
                  >
                    <Wand2 className="size-3.5" />
                    Draft in Studio
                  </Link>
                  <button type="button" onClick={() => void toggleSelected(idea)} className={quiet}>
                    <Check className="size-3.5" />
                    {idea.selected ? 'Unselect' : 'Select'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {!loading && !error && tab === 'drafts' && (
        visibleDrafts.length === 0 ? (
          <Empty
            icon={PenLine}
            title={drafts.length === 0 ? 'No drafts yet' : 'Nothing matches this filter'}
            description="Drafts are finished captions and scripts. Approve the ones you would post — that is what Navix learns from."
            projectId={projectId}
          />
        ) : (
          <div className="space-y-4">
            {visibleDrafts.map((draft, i) => {
              const title = draft.direction?.title_pillar ?? 'Untitled draft'
              const tips = Object.entries(draft.tips ?? {}).filter(([, v]) => Boolean(v))
              return (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
                  className={cn(
                    'rounded-[16px] border bg-white p-4 shadow-card sm:p-5',
                    draft.status === 'APPROVED' ? 'border-success-300' : draft.status === 'REJECTED' ? 'border-alpha-10 opacity-70' : 'border-alpha-10',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-caption-2 font-semibold',
                        draft.status === 'APPROVED'
                          ? 'bg-success-100 text-success-700'
                          : draft.status === 'REJECTED'
                            ? 'bg-alpha-10 text-alpha-60'
                            : 'bg-secondary-300/30 text-primary-900',
                      )}
                    >
                      {STATUS_LABEL[draft.status]}
                    </span>
                    {draft.direction?.format && <span className={chip}>{draft.direction.format}</span>}
                    {draft.version != null && draft.version > 1 && <span className={chip}>v{draft.version}</span>}
                    {draft.language && <span className={chip}>{draft.language}</span>}
                    <span className="ml-auto text-caption-2 text-alpha-40">
                      {new Date(draft.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="mt-2 text-body-2 font-semibold text-primary-900">{title}</p>
                  {draft.caption_text && (
                    <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-caption-1 leading-relaxed text-primary-900">
                      {draft.caption_text}
                    </p>
                  )}
                  {tips.length > 0 && (
                    <p className="mt-2 text-caption-2 text-alpha-60">
                      {tips.length} coaching tip{tips.length > 1 ? 's' : ''}{draft.video_script ? ' · script included' : ''}
                    </p>
                  )}
                  {draft.performance && (
                    <p
                      className={cn(
                        'mt-2 inline-flex flex-wrap items-center gap-x-2 rounded-[10px] border px-3 py-1.5 text-caption-2 font-medium',
                        (draft.performance.vs_avg_interactions ?? 1) >= 1
                          ? 'border-success-300 bg-success-50 text-success-700'
                          : 'border-alpha-10 bg-alpha-5 text-alpha-60',
                      )}
                    >
                      <span className="font-semibold">Posted</span>
                      <span>{draft.performance.likes} likes · {draft.performance.comments} comments{draft.performance.views ? ` · ${draft.performance.views} views` : ''}</span>
                      {draft.performance.vs_avg_interactions != null && (
                        <span className="font-semibold">
                          {draft.performance.vs_avg_interactions >= 1 ? '+' : ''}
                          {Math.round((draft.performance.vs_avg_interactions - 1) * 100)}% vs your average
                        </span>
                      )}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {scheduledByDraft.has(draft.id) ? (
                      <Link
                        href={`/projects/${projectId}/calendar`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-success-300 bg-success-50 px-3 py-1.5 text-caption-1 font-semibold text-success-700"
                      >
                        <CalendarCheck className="size-3.5" />
                        {scheduledByDraft.get(draft.id)!.status === 'published' ? 'Published' : 'Scheduled'} · {slotLabel(scheduledByDraft.get(draft.id)!.scheduled_at)}
                      </Link>
                    ) : draft.status === 'APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => void schedule(draft)}
                        disabled={schedulingId === draft.id}
                        className={cn(lime, 'px-3 py-1.5')}
                      >
                        <CalendarPlus className="size-3.5" />
                        {schedulingId === draft.id ? 'Finding the best slot…' : 'Schedule'}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => void decide(draft, 'APPROVED')}
                          className={cn(lime, 'px-3 py-1.5')}
                        >
                          <Check className="size-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void schedule(draft)}
                          disabled={schedulingId === draft.id}
                          className={quiet}
                          title="Approve and put it on the next best slot"
                        >
                          <CalendarPlus className="size-3.5" />
                          {schedulingId === draft.id ? 'Scheduling…' : 'Approve & schedule'}
                        </button>
                      </>
                    )}
                    <Link href={studioHref(projectId, `Revise "${title}" v${draft.version ?? 1}: `)} className={quiet}>
                      <Wand2 className="size-3.5" />
                      Refine in Studio
                    </Link>
                    <button
                      type="button"
                      onClick={() => void decide(draft, 'REJECTED')}
                      disabled={draft.status === 'REJECTED'}
                      className={quiet}
                    >
                      <ThumbsDown className="size-3.5" />
                      Reject
                    </button>
                    <Link href={`/projects/${projectId}/drafts?selected=${draft.id}`} className={cn(quiet, 'ml-auto')}>
                      Open editor
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-caption-2 font-medium transition-colors',
        active ? 'border-primary-900 bg-primary-900 text-white' : 'border-alpha-10 bg-white text-alpha-60 hover:border-primary-900 hover:text-primary-900',
      )}
    >
      {children}
    </button>
  )
}

function Empty({
  icon: Icon,
  title,
  description,
  projectId,
}: {
  icon: React.ElementType
  title: string
  description: string
  projectId: string
}) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-alpha-10 bg-alpha-5/50 px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full border border-secondary-300 bg-secondary-50">
        <Icon className="size-5 text-primary-900" />
      </span>
      <h2 className="text-h6 font-bold text-primary-900">{title}</h2>
      <p className="mt-1.5 max-w-md text-body-2 text-alpha-60">{description}</p>
      <Link href={`/projects/${projectId}/studio`} className={cn(lime, 'mt-5')}>
        <MessagesSquare className="size-4" />
        Open Studio
      </Link>
    </div>
  )
}

export default function LibraryPage() {
  return (
    <DashboardShell>
      <LibraryContent />
    </DashboardShell>
  )
}
