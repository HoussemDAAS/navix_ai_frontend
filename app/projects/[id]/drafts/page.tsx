'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Check,
  X,
  Save,
  Calendar as CalendarIcon,
  Film,
  ChevronDown,
  ListFilter,
  Compass,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Spinner } from '@/components/ui/spinner'
import { LimeButton } from '@/components/onboarding/LimeButton'
import { cn } from '@/lib/utils'
import {
  getDrafts,
  generateDrafts,
  updateDraft,
  submitDraftFeedback,
  createCalendarItem,
  getJobStatus,
  type Draft,
  type DraftStatus,
  type CalendarPlatform,
} from '@/lib/api'

type PageState = 'loading' | 'empty' | 'running' | 'list' | 'error'
type FilterStatus = 'all' | DraftStatus
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const STATUS_STYLES: Record<DraftStatus, { label: string; pill: string; dot: string }> = {
  PENDING: {
    label: 'Pending',
    pill: 'bg-alpha-5 text-alpha-60 border border-alpha-10',
    dot: 'bg-alpha-40',
  },
  APPROVED: {
    label: 'Approved',
    pill: 'bg-success-50 text-success-700 border border-success-200',
    dot: 'bg-success-500',
  },
  REJECTED: {
    label: 'Rejected',
    pill: 'bg-destructive-50 text-destructive-700 border border-destructive-200',
    dot: 'bg-destructive-500',
  },
}

const PROGRESS_STEPS = [
  { label: 'Loading your selected directions', threshold: 0 },
  { label: 'Writing on-brand captions', threshold: 33 },
  { label: 'Drafting video scripts where needed', threshold: 66 },
]

const PLATFORMS: { value: CalendarPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
]

function draftTitle(d: Draft): string {
  if (d.direction?.title_pillar) return d.direction.title_pillar
  if (d.caption_text) {
    const firstLine = d.caption_text.split('\n')[0].trim()
    if (firstLine.length > 0) return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine
  }
  return 'Untitled draft'
}

export default function DraftsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [jobProgress, setJobProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [showScript, setShowScript] = useState(true)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Editor draft state
  const [caption, setCaption] = useState('')
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [captionSave, setCaptionSave] = useState<SaveState>('idle')
  const [notesSave, setNotesSave] = useState<SaveState>('idle')
  const [actionSaving, setActionSaving] = useState<DraftStatus | null>(null)

  // Initial load
  useEffect(() => {
    async function load() {
      try {
        const res = await getDrafts(projectId)
        const data = res.data ?? []
        setDrafts(data)
        setSelectedDraftId(data[0]?.id ?? null)
        setPageState(data.length > 0 ? 'list' : 'empty')
      } catch {
        setPageState('empty')
      }
    }
    load()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [projectId])

  // Auto-start generation when redirected from Directions with ?autostart=1
  useEffect(() => {
    const autostart = searchParams.get('autostart')
    const selected = searchParams.get('selected')
    if (autostart === '1' && selected && pageState !== 'running' && pageState !== 'loading') {
      const ids = selected.split(',').filter(Boolean)
      if (ids.length > 0) {
        void startGeneration(ids)
        // Strip query params so a reload doesn't re-trigger
        router.replace(`/projects/${projectId}/drafts`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState, searchParams])

  // Hydrate editor when selection changes
  useEffect(() => {
    const d = drafts.find((x) => x.id === selectedDraftId) ?? null
    setCaption(d?.caption_text ?? '')
    setFeedbackNotes(d?.user_feedback_notes ?? '')
    setCaptionSave('idle')
    setNotesSave('idle')
    setShowScript(true)
  }, [selectedDraftId, drafts])

  const pollJob = useCallback(
    (jobId: string) => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const status = await getJobStatus(jobId)
          setJobProgress(status.progress)
          if (status.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current)
            const fresh = await getDrafts(projectId)
            const next = fresh.data ?? []
            setDrafts(next)
            setSelectedDraftId(next[0]?.id ?? null)
            setPageState(next.length > 0 ? 'list' : 'empty')
          } else if (status.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current)
            setErrorMsg(status.error || 'Draft generation failed')
            setPageState('error')
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current)
          setErrorMsg('Lost connection while generating drafts')
          setPageState('error')
        }
      }, 3000)
    },
    [projectId],
  )

  const startGeneration = useCallback(
    async (directionIds: string[]) => {
      setPageState('running')
      setJobProgress(0)
      setErrorMsg('')
      try {
        const { jobId } = await generateDrafts(projectId, directionIds)
        pollJob(jobId)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to start generation')
        setPageState('error')
      }
    },
    [projectId, pollJob],
  )

  const selected = useMemo(
    () => drafts.find((d) => d.id === selectedDraftId) ?? null,
    [drafts, selectedDraftId],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return drafts
    return drafts.filter((d) => d.status === filter)
  }, [drafts, filter])

  // ── Editor handlers ──

  const persistCaption = async () => {
    if (!selected) return
    if (caption === (selected.caption_text ?? '')) return
    setCaptionSave('saving')
    try {
      const res = await updateDraft(projectId, selected.id, { caption_text: caption })
      setDrafts((prev) => prev.map((d) => (d.id === selected.id ? res.data : d)))
      setCaptionSave('saved')
      setTimeout(() => setCaptionSave('idle'), 1800)
    } catch {
      setCaptionSave('error')
      setTimeout(() => setCaptionSave('idle'), 3000)
    }
  }

  const persistNotes = async () => {
    if (!selected) return
    if (feedbackNotes === (selected.user_feedback_notes ?? '')) return
    setNotesSave('saving')
    try {
      const trimmed = feedbackNotes.trim()
      const res = await updateDraft(projectId, selected.id, {
        user_feedback_notes: trimmed.length > 0 ? trimmed : null,
      })
      setDrafts((prev) => prev.map((d) => (d.id === selected.id ? res.data : d)))
      if (trimmed.length > 0) {
        // Record an 'edited' feedback event for Brand Memory
        await submitDraftFeedback(projectId, selected.id, 'edited', trimmed).catch(() => {})
      }
      setNotesSave('saved')
      setTimeout(() => setNotesSave('idle'), 1800)
    } catch {
      setNotesSave('error')
      setTimeout(() => setNotesSave('idle'), 3000)
    }
  }

  const handleStatusAction = async (status: DraftStatus) => {
    if (!selected || actionSaving) return
    setActionSaving(status)
    try {
      const res = await updateDraft(projectId, selected.id, { status })
      setDrafts((prev) => prev.map((d) => (d.id === selected.id ? res.data : d)))
      if (status === 'APPROVED' || status === 'REJECTED') {
        await submitDraftFeedback(
          projectId,
          selected.id,
          status === 'APPROVED' ? 'approved' : 'rejected',
          feedbackNotes.trim() || undefined,
        ).catch(() => {})
      }
    } catch (err) {
      console.error('Status update failed:', err)
    } finally {
      setActionSaving(null)
    }
  }

  if (pageState === 'loading') {
    return (
      <DashboardShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1280px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-h4 sm:text-h3 font-bold text-primary-900 mb-2">
            Drafts
          </h1>
          <p className="text-body-1 text-alpha-60 max-w-[560px]">
            Refine captions, scripts, and notes. Your feedback teaches Navix what
            sounds like you.
          </p>
        </motion.div>

        {/* ─── EMPTY ─── */}
        {pageState === 'empty' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="rounded-[24px] border border-alpha-10 bg-gradient-to-br from-white to-alpha-5/50 p-8 sm:p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-[18px] bg-info-50 flex items-center justify-center mb-5">
                <FileText className="size-8 text-info-500" />
              </div>
              <h2 className="text-h6 font-bold text-primary-900 mb-2">
                No drafts yet
              </h2>
              <p className="text-body-2 text-alpha-60 max-w-[440px] mx-auto mb-7">
                Select directions on the Directions page and we&apos;ll write full
                drafts for each one — captions, hooks, and scripts.
              </p>
              <LimeButton
                onClick={() => router.push(`/projects/${projectId}/directions`)}
              >
                <Compass className="size-4" />
                Go to Directions
              </LimeButton>
            </div>
          </motion.div>
        )}

        {/* ─── RUNNING ─── */}
        {pageState === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border border-secondary-200 bg-gradient-to-br from-secondary-50 to-white p-8 sm:p-12 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mx-auto h-14 w-14 rounded-full border-3 border-secondary-300 border-t-transparent mb-6"
            />
            <h2 className="text-h6 font-bold text-primary-900 mb-2">
              Writing your drafts...
            </h2>
            <p className="text-body-2 text-alpha-60 mb-4">
              Generating brand-consistent captions and scripts.
            </p>
            <div className="flex flex-col items-start max-w-[320px] mx-auto gap-3 mt-6 text-left">
              {PROGRESS_STEPS.map((step) => {
                const reached = jobProgress > step.threshold
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-5 w-5 rounded-full flex items-center justify-center transition-colors',
                        reached ? 'bg-success-100' : 'bg-alpha-10',
                      )}
                    >
                      {reached ? (
                        <CheckCircle2 className="size-3.5 text-success-600" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-alpha-30" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-caption-1 font-medium',
                        reached ? 'text-primary-900' : 'text-alpha-40',
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ─── ERROR ─── */}
        {pageState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border border-destructive-200 bg-destructive-50/50 p-8 sm:p-10 text-center"
          >
            <AlertCircle className="size-10 text-destructive-500 mx-auto mb-4" />
            <h2 className="text-h6 font-bold text-primary-900 mb-2">
              Could not load drafts
            </h2>
            <p className="text-body-2 text-alpha-60 mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push(`/projects/${projectId}/directions`)}
              className="inline-flex items-center gap-2 rounded-[12px] px-5 py-3 text-body-2 font-medium bg-white text-primary-900 border border-alpha-10 hover:border-alpha-20 shadow-sm transition-all"
            >
              <RefreshCw className="size-4" />
              Try Again
            </button>
          </motion.div>
        )}

        {/* ─── LIST + EDITOR ─── */}
        {pageState === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
            {/* Left rail: draft list */}
            <motion.aside
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-[20px] border border-alpha-10 bg-white shadow-card overflow-hidden flex flex-col h-fit lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)]"
            >
              {/* Filter header */}
              <div className="border-b border-alpha-10 p-4">
                <div className="flex items-center gap-1.5 mb-3 text-caption-1 font-semibold text-alpha-60 uppercase tracking-wide">
                  <ListFilter className="size-3.5" />
                  Filter
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as FilterStatus[]).map((key) => {
                    const isActive = filter === key
                    const label =
                      key === 'all' ? 'All' : STATUS_STYLES[key as DraftStatus].label
                    const count =
                      key === 'all'
                        ? drafts.length
                        : drafts.filter((d) => d.status === key).length
                    return (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption-2 font-medium transition-all',
                          isActive
                            ? 'bg-primary-900 text-white'
                            : 'bg-alpha-5 text-alpha-60 hover:bg-alpha-10',
                        )}
                      >
                        {label}
                        <span
                          className={cn(
                            'rounded-full px-1.5 text-caption-2 font-semibold',
                            isActive ? 'bg-white/15 text-white' : 'text-alpha-50',
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* List */}
              <ul className="flex-1 overflow-y-auto divide-y divide-alpha-10">
                {filtered.length === 0 && (
                  <li className="p-6 text-center text-caption-1 text-alpha-50">
                    No drafts match this filter.
                  </li>
                )}
                {filtered.map((d) => {
                  const isActive = d.id === selectedDraftId
                  const s = STATUS_STYLES[d.status]
                  return (
                    <li key={d.id}>
                      <button
                        onClick={() => setSelectedDraftId(d.id)}
                        className={cn(
                          'w-full text-left p-4 transition-colors cursor-pointer',
                          isActive
                            ? 'bg-secondary-50'
                            : 'bg-white hover:bg-alpha-5/60',
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={cn(
                              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                              s.dot,
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'text-body-2 font-semibold truncate',
                                isActive ? 'text-primary-900' : 'text-primary-900',
                              )}
                            >
                              {draftTitle(d)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-caption-2 font-medium',
                                  s.pill,
                                )}
                              >
                                {s.label}
                              </span>
                              {d.direction?.format && (
                                <span className="inline-flex items-center gap-1 text-caption-2 text-alpha-50">
                                  <Film className="size-3" />
                                  {d.direction.format}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </motion.aside>

            {/* Right pane: editor */}
            <motion.section
              key={selectedDraftId ?? 'empty-editor'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="min-w-0"
            >
              {!selected ? (
                <div className="rounded-[20px] border border-alpha-10 bg-white p-10 text-center shadow-card">
                  <p className="text-body-2 text-alpha-60">
                    Select a draft from the list to start editing.
                  </p>
                </div>
              ) : (
                <DraftEditor
                  draft={selected}
                  caption={caption}
                  feedbackNotes={feedbackNotes}
                  captionSave={captionSave}
                  notesSave={notesSave}
                  actionSaving={actionSaving}
                  showScript={showScript}
                  onChangeCaption={setCaption}
                  onChangeNotes={setFeedbackNotes}
                  onBlurCaption={persistCaption}
                  onBlurNotes={persistNotes}
                  onToggleScript={() => setShowScript((s) => !s)}
                  onAction={handleStatusAction}
                  onSchedule={() => setScheduleOpen(true)}
                />
              )}
            </motion.section>
          </div>
        )}
      </div>

      {/* Schedule modal */}
      <AnimatePresence>
        {scheduleOpen && selected && (
          <ScheduleModal
            draft={selected}
            projectId={projectId}
            onClose={() => setScheduleOpen(false)}
            onScheduled={() => setScheduleOpen(false)}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Draft editor sub-component
   ────────────────────────────────────────────────────────────────────────── */

interface DraftEditorProps {
  draft: Draft
  caption: string
  feedbackNotes: string
  captionSave: SaveState
  notesSave: SaveState
  actionSaving: DraftStatus | null
  showScript: boolean
  onChangeCaption: (v: string) => void
  onChangeNotes: (v: string) => void
  onBlurCaption: () => void
  onBlurNotes: () => void
  onToggleScript: () => void
  onAction: (status: DraftStatus) => void
  onSchedule: () => void
}

function DraftEditor({
  draft,
  caption,
  feedbackNotes,
  captionSave,
  notesSave,
  actionSaving,
  showScript,
  onChangeCaption,
  onChangeNotes,
  onBlurCaption,
  onBlurNotes,
  onToggleScript,
  onAction,
  onSchedule,
}: DraftEditorProps) {
  const charCount = caption.length
  const idealMin = 100
  const idealMax = 150
  const inIdealRange = charCount >= idealMin && charCount <= idealMax
  const s = STATUS_STYLES[draft.status]

  return (
    <div className="space-y-5">
      {/* Header island */}
      <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h2 className="font-heading text-h6 font-semibold text-primary-900 truncate">
              {draftTitle(draft)}
            </h2>
            {draft.direction?.angle && (
              <p className="text-caption-1 text-alpha-60 mt-1">
                {draft.direction.angle}
              </p>
            )}
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-caption-2 font-semibold',
              s.pill,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
            {s.label}
          </span>
        </div>
      </div>

      {/* Caption editor */}
      <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <label className="text-caption-1 font-semibold text-primary-900">
            Caption
          </label>
          <SaveIndicator state={captionSave} />
        </div>

        <textarea
          value={caption}
          onChange={(e) => onChangeCaption(e.target.value)}
          onBlur={onBlurCaption}
          rows={9}
          placeholder="Write your caption here…"
          className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-3.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all resize-y min-h-[200px]"
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-caption-2 text-alpha-50">
            Suggested {idealMin}-{idealMax} characters for Instagram
          </p>
          <span
            className={cn(
              'text-caption-2 font-semibold',
              inIdealRange ? 'text-success-600' : 'text-alpha-50',
            )}
          >
            {charCount} chars
          </span>
        </div>
      </div>

      {/* Video script panel */}
      {draft.video_script && (
        <div className="rounded-[20px] border border-alpha-10 bg-white shadow-card overflow-hidden">
          <button
            type="button"
            onClick={onToggleScript}
            className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-alpha-5/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-[10px] bg-primary-50 flex items-center justify-center">
                <Film className="size-4 text-primary-700" />
              </div>
              <div className="text-left">
                <p className="text-caption-1 font-semibold text-primary-900">
                  Video script
                </p>
                <p className="text-caption-2 text-alpha-50">
                  {draft.video_script.split('\n').filter(Boolean).length} lines
                </p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: showScript ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="size-5 text-alpha-40" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {showScript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 sm:px-6 pb-6">
                  <pre className="rounded-[12px] bg-primary-900 text-white font-mono text-caption-1 leading-6 p-4 overflow-x-auto whitespace-pre">
                    {draft.video_script
                      .split('\n')
                      .map((line, i) => `${String(i + 1).padStart(2, ' ')}  ${line}`)
                      .join('\n')}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Brand Memory feedback notes */}
      <div className="rounded-[20px] border border-secondary-200 bg-gradient-to-br from-secondary-50 to-white p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-7 w-7 rounded-full bg-secondary-300 flex items-center justify-center">
            <Sparkles className="size-3.5 text-primary-900" />
          </div>
          <div className="flex-1">
            <p className="text-caption-1 font-semibold text-primary-900">
              Brand Memory feedback
            </p>
            <p className="text-caption-2 text-alpha-50">
              Tell Navix what to keep or change. Auto-saves on blur.
            </p>
          </div>
          <SaveIndicator state={notesSave} />
        </div>
        <textarea
          value={feedbackNotes}
          onChange={(e) => onChangeNotes(e.target.value)}
          onBlur={onBlurNotes}
          rows={3}
          placeholder="e.g., Keep the hook, but make it more playful. Don't use 'leverage'."
          className="w-full rounded-[12px] border border-alpha-10 bg-white px-4 py-3 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:ring-1 focus:ring-secondary-400 outline-none transition-all resize-none"
        />
      </div>

      {/* Action row */}
      <div className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-6 sm:-mb-8 px-5 sm:px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-alpha-10 flex flex-wrap items-center gap-2.5">
        <LimeButton
          onClick={() => onAction('APPROVED')}
          loading={actionSaving === 'APPROVED'}
          disabled={draft.status === 'APPROVED'}
          size="md"
        >
          <Check className="size-4" />
          Approve
        </LimeButton>

        <button
          type="button"
          onClick={() => onAction('REJECTED')}
          disabled={actionSaving === 'REJECTED' || draft.status === 'REJECTED'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-caption-1 font-medium border transition-all',
            'bg-white text-primary-900 border-alpha-10 hover:border-destructive-300 hover:bg-destructive-50/50',
            (actionSaving === 'REJECTED' || draft.status === 'REJECTED') &&
              'opacity-50 pointer-events-none',
          )}
        >
          {actionSaving === 'REJECTED' ? (
            <Spinner size="sm" />
          ) : (
            <X className="size-4 text-destructive-500" />
          )}
          Reject
        </button>

        <button
          type="button"
          onClick={() => onAction('PENDING')}
          disabled={actionSaving !== null}
          className="inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-caption-1 font-medium bg-info-50 text-info-700 border border-info-200 hover:bg-info-100 transition-all"
        >
          <Save className="size-4" />
          Save as pending
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={onSchedule}
            className="inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2.5 text-caption-1 font-medium bg-alpha-5 text-primary-900 border border-alpha-10 hover:bg-alpha-10 transition-all"
          >
            <CalendarIcon className="size-4" />
            Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Save indicator
   ────────────────────────────────────────────────────────────────────────── */
function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <AnimatePresence mode="wait">
      {state === 'saving' && (
        <motion.span
          key="saving"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-1.5 text-caption-2 text-alpha-50"
        >
          <Spinner size="sm" />
          Saving…
        </motion.span>
      )}
      {state === 'saved' && (
        <motion.span
          key="saved"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-1.5 text-caption-2 font-medium text-success-600"
        >
          <Check className="size-3.5" />
          Saved
        </motion.span>
      )}
      {state === 'error' && (
        <motion.span
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inline-flex items-center gap-1.5 text-caption-2 font-medium text-destructive-500"
        >
          <AlertCircle className="size-3.5" />
          Could not save
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Schedule modal — minimal in-page modal to create a CalendarItem
   ────────────────────────────────────────────────────────────────────────── */

interface ScheduleModalProps {
  draft: Draft
  projectId: string
  onClose: () => void
  onScheduled: () => void
}

function defaultScheduleDateTime(): string {
  // Tomorrow at 10:00 local time, formatted for <input type="datetime-local">
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ScheduleModal({ draft, projectId, onClose, onScheduled }: ScheduleModalProps) {
  const [title, setTitle] = useState(draftTitle(draft))
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleDateTime())
  const [platform, setPlatform] = useState<CalendarPlatform>('instagram')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title.trim() || !scheduledAt) return
    setSubmitting(true)
    setError('')
    try {
      await createCalendarItem(projectId, {
        draft_id: draft.id,
        title: title.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        platform,
        notes: notes.trim() || undefined,
      })
      onScheduled()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule')
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-[20px] bg-white border border-alpha-10 shadow-card"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-alpha-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[10px] bg-secondary-300/30 flex items-center justify-center">
              <CalendarIcon className="size-4 text-primary-900" />
            </div>
            <h3 className="text-subheadline font-semibold text-primary-900">
              Schedule post
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-alpha-5 transition-colors"
          >
            <X className="size-4 text-alpha-60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-caption-1 font-medium text-primary-900 mb-1.5 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-2.5 text-body-2 text-primary-900 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-caption-1 font-medium text-primary-900 mb-1.5 block">
                When
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-2.5 text-body-2 text-primary-900 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-caption-1 font-medium text-primary-900 mb-1.5 block">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as CalendarPlatform)}
                className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-3.5 py-2.5 text-body-2 text-primary-900 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-caption-1 font-medium text-primary-900 mb-1.5 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g., Post after Tuesday newsletter goes out"
              className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-2.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all resize-none"
            />
          </div>

          {error && (
            <div className="rounded-[12px] bg-destructive-50 border border-destructive-200 px-3.5 py-2.5 text-caption-1 text-destructive-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-1">
          <button
            onClick={onClose}
            className="rounded-[12px] px-4 py-2.5 text-caption-1 font-medium bg-white text-primary-900 border border-alpha-10 hover:bg-alpha-5 transition-all"
          >
            Cancel
          </button>
          <LimeButton onClick={handleSubmit} loading={submitting} size="md">
            <CalendarIcon className="size-4" />
            Schedule
          </LimeButton>
        </div>
      </motion.div>
    </motion.div>
  )
}
