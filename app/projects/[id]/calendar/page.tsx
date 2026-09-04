'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
  Trash2,
  Instagram,
  Music2,
  Youtube,
  Facebook,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Spinner } from '@/components/ui/spinner'
import { LimeButton } from '@/components/onboarding/LimeButton'
import { cn } from '@/lib/utils'
import {
  getCalendar,
  createCalendarItem,
  updateCalendarItem,
  deleteCalendarItem,
  getDrafts,
  type CalendarItem,
  type CalendarPlatform,
  type CalendarStatus,
  type Draft,
} from '@/lib/api'

type PageState = 'loading' | 'ready' | 'error'

interface PlatformStyle {
  label: string
  icon: typeof Instagram
  /** Tailwind classes for the pill (background + text + border). */
  pill: string
}

const PLATFORM_STYLES: Record<CalendarPlatform, PlatformStyle> = {
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    pill: 'bg-secondary-300/40 text-primary-900 border border-secondary-400',
  },
  tiktok: {
    label: 'TikTok',
    icon: Music2,
    pill: 'bg-primary-50 text-primary-900 border border-primary-200',
  },
  youtube: {
    label: 'YouTube',
    icon: Youtube,
    pill: 'bg-info-50 text-info-700 border border-info-200',
  },
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    pill: 'bg-info-100 text-info-900 border border-info-200',
  },
}

const PLATFORM_OPTIONS: CalendarPlatform[] = ['instagram', 'tiktok', 'youtube', 'facebook']
const STATUS_OPTIONS: CalendarStatus[] = ['planned', 'published', 'cancelled']

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function defaultDateAt(date: Date, hour = 10): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(hour)}:00`
}

function buildMonthGrid(year: number, month: number): Date[] {
  // Returns 42 sequential dates that cover the visible 6-week calendar grid
  // starting from the Sunday on/before the 1st of the month.
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push(d)
  }
  return cells
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function CalendarPage() {
  const params = useParams()
  const projectId = params.id as string

  const today = useMemo(() => startOfDay(new Date()), [])
  const [pageState, setPageState] = useState<PageState>('loading')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  // Modal state
  const [modal, setModal] = useState<
    | { type: 'create'; date: Date; draftId?: string }
    | { type: 'edit'; item: CalendarItem }
    | null
  >(null)

  const monthGrid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const monthStart = useMemo(() => new Date(viewYear, viewMonth, 1), [viewYear, viewMonth])
  const monthEnd = useMemo(() => new Date(viewYear, viewMonth + 1, 1), [viewYear, viewMonth])

  // Approved drafts not yet scheduled
  const approvedDraftIds = useMemo(
    () => new Set(items.map((i) => i.draft_id).filter((id): id is string => Boolean(id))),
    [items],
  )
  const unscheduledApproved = useMemo(
    () => drafts.filter((d) => d.status === 'APPROVED' && !approvedDraftIds.has(d.id)),
    [drafts, approvedDraftIds],
  )

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const d = startOfDay(new Date(item.scheduled_at))
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  const loadData = useCallback(async () => {
    try {
      const from = monthGrid[0].toISOString()
      const to = new Date(monthGrid[monthGrid.length - 1].getTime() + 24 * 60 * 60 * 1000).toISOString()
      const [calRes, draftRes] = await Promise.all([
        getCalendar(projectId, from, to).catch(() => ({ data: [] as CalendarItem[] })),
        getDrafts(projectId).catch(() => ({ data: [] as Draft[] })),
      ])
      setItems(calRes.data ?? [])
      setDrafts(draftRes.data ?? [])
      setPageState('ready')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load calendar')
      setPageState('error')
    }
  }, [projectId, monthGrid])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const from = monthGrid[0].toISOString()
        const to = new Date(
          monthGrid[monthGrid.length - 1].getTime() + 24 * 60 * 60 * 1000,
        ).toISOString()
        const [calRes, draftRes] = await Promise.all([
          getCalendar(projectId, from, to).catch(() => ({ data: [] as CalendarItem[] })),
          getDrafts(projectId).catch(() => ({ data: [] as Draft[] })),
        ])
        if (cancelled) return
        setItems(calRes.data ?? [])
        setDrafts(draftRes.data ?? [])
        setPageState('ready')
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load calendar')
        setPageState('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, monthGrid])

  const handleCreate = async (data: {
    title: string
    scheduledAt: string
    platform: CalendarPlatform
    notes: string
    draftId?: string
  }) => {
    const res = await createCalendarItem(projectId, {
      draft_id: data.draftId,
      title: data.title,
      scheduled_at: new Date(data.scheduledAt).toISOString(),
      platform: data.platform,
      notes: data.notes || undefined,
    })
    setItems((prev) => [...prev, res.data])
  }

  const handleUpdate = async (
    itemId: string,
    patch: Partial<Pick<CalendarItem, 'title' | 'scheduled_at' | 'platform' | 'status' | 'notes'>>,
  ) => {
    const res = await updateCalendarItem(projectId, itemId, patch)
    setItems((prev) => prev.map((i) => (i.id === itemId ? res.data : i)))
  }

  const handleDelete = async (itemId: string) => {
    await deleteCalendarItem(projectId, itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }
  const goToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  const quickScheduleNextWeek = (draft: Draft) => {
    const target = new Date(today)
    target.setDate(today.getDate() + 7)
    setModal({ type: 'create', date: target, draftId: draft.id })
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

  if (pageState === 'error') {
    return (
      <DashboardShell>
        <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1280px]">
          <div className="rounded-[24px] border border-destructive-200 bg-destructive-50/50 p-8 text-center">
            <AlertCircle className="size-10 text-destructive-500 mx-auto mb-4" />
            <h2 className="text-h6 font-bold text-primary-900 mb-2">
              Could not load calendar
            </h2>
            <p className="text-body-2 text-alpha-60 mb-5">{errorMsg}</p>
            <button
              onClick={() => {
                setPageState('loading')
                loadData()
              }}
              className="inline-flex items-center gap-2 rounded-[12px] px-5 py-3 text-body-2 font-medium bg-white text-primary-900 border border-alpha-10 hover:border-alpha-20 shadow-sm transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Drag-drop hooks would attach to day cells: `onDragOver`/`onDrop` on the
  // <button class="day-cell"> below would receive a draft ID, then call
  // `setModal({ type: 'create', date, draftId })`. Skipped for MVP.

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
            Editorial Calendar
          </h1>
          <p className="text-body-1 text-alpha-60 max-w-[560px]">
            Plan, schedule, and export your content. Approved drafts live here
            until they ship.
          </p>
        </motion.div>

        {/* Approved drafts queue */}
        {unscheduledApproved.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="mb-6 rounded-[20px] bg-gradient-to-br from-secondary-50 to-white border border-secondary-200 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-secondary-300 flex items-center justify-center">
                  <Sparkles className="size-4 text-primary-900" />
                </div>
                <div>
                  <p className="text-caption-1 font-semibold text-primary-900">
                    {unscheduledApproved.length} approved draft
                    {unscheduledApproved.length !== 1 ? 's' : ''} ready to schedule
                  </p>
                  <p className="text-caption-2 text-alpha-50">
                    {/* Drag-drop would land here in a later iteration */}
                    Click any draft to schedule it
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {unscheduledApproved.slice(0, 6).map((d) => (
                <button
                  key={d.id}
                  onClick={() => quickScheduleNextWeek(d)}
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-alpha-10 hover:border-primary-900 hover:shadow-signature transition-all px-3.5 py-1.5 text-caption-2 font-medium text-primary-900 max-w-[260px]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                  <span className="truncate">
                    {d.direction?.title_pillar ??
                      (d.caption_text ? d.caption_text.slice(0, 40) : 'Untitled')}
                  </span>
                </button>
              ))}
              {unscheduledApproved.length > 6 && (
                <span className="inline-flex items-center rounded-full px-3 py-1.5 text-caption-2 font-medium text-alpha-50">
                  +{unscheduledApproved.length - 6} more
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Calendar header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="flex flex-wrap items-center justify-between gap-3 mb-3"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={goPrevMonth}
              className="h-9 w-9 rounded-[10px] bg-white border border-alpha-10 hover:bg-alpha-5 flex items-center justify-center transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4 text-primary-900" />
            </button>
            <h2 className="font-heading text-h6 sm:text-h5 font-semibold text-primary-900 min-w-[200px]">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={goNextMonth}
              className="h-9 w-9 rounded-[10px] bg-white border border-alpha-10 hover:bg-alpha-5 flex items-center justify-center transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="size-4 text-primary-900" />
            </button>
            <button
              onClick={goToday}
              className="ml-2 rounded-[10px] px-3 py-2 text-caption-1 font-medium bg-alpha-5 text-primary-900 border border-alpha-10 hover:bg-alpha-10 transition-colors"
            >
              Today
            </button>
          </div>

          <LimeButton
            size="md"
            onClick={() => setModal({ type: 'create', date: new Date() })}
          >
            <Plus className="size-4" />
            New post
          </LimeButton>
        </motion.div>

        {/* Calendar grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4 }}
          className="rounded-[20px] border border-alpha-10 bg-white shadow-card overflow-hidden"
        >
          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-alpha-10 bg-alpha-5/40">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-3 py-2.5 text-caption-2 font-semibold text-alpha-60 uppercase tracking-wide text-center"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Empty calendar state */}
          {items.length === 0 ? (
            <div className="p-10 sm:p-14 text-center border-t border-alpha-10">
              <div className="mx-auto h-14 w-14 rounded-[16px] bg-secondary-300/30 flex items-center justify-center mb-4">
                <CalendarIcon className="size-7 text-primary-900" />
              </div>
              <h3 className="text-subheadline font-semibold text-primary-900 mb-1">
                Nothing scheduled yet
              </h3>
              <p className="text-body-2 text-alpha-60 max-w-[380px] mx-auto mb-6">
                Schedule your first post and start shaping your editorial week.
              </p>
              <LimeButton
                onClick={() => setModal({ type: 'create', date: new Date() })}
              >
                <Plus className="size-4" />
                Schedule your first post
              </LimeButton>
            </div>
          ) : (
            <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr">
              {monthGrid.map((date, idx) => {
                const inMonth = date >= monthStart && date < monthEnd
                const isToday = sameDay(date, today)
                const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
                const dayItems = itemsByDay.get(key) ?? []
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      dayItems.length === 0 && setModal({ type: 'create', date })
                    }
                    className={cn(
                      'group relative text-left min-h-[110px] sm:min-h-[120px] border-r border-b border-alpha-10 p-2 transition-colors',
                      !inMonth && 'bg-alpha-5/30',
                      inMonth && dayItems.length === 0 && 'hover:bg-secondary-50/40 cursor-pointer',
                      inMonth && dayItems.length > 0 && 'cursor-default',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center text-caption-1 font-semibold',
                          isToday &&
                            'h-6 w-6 rounded-full bg-primary-900 text-white',
                          !isToday && inMonth && 'text-primary-900',
                          !isToday && !inMonth && 'text-alpha-30',
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {inMonth && dayItems.length === 0 && (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="size-3.5 text-alpha-40" />
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayItems.slice(0, 3).map((item) => {
                        const style = PLATFORM_STYLES[item.platform]
                        const Icon = style.icon
                        return (
                          <span
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              setModal({ type: 'edit', item })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                setModal({ type: 'edit', item })
                              }
                            }}
                            className={cn(
                              'flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-caption-2 font-medium truncate cursor-pointer hover:brightness-95 transition-all',
                              style.pill,
                              item.status === 'cancelled' && 'line-through opacity-60',
                              item.status === 'published' && 'opacity-80',
                            )}
                          >
                            <Icon className="size-3 shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </span>
                        )
                      })}
                      {dayItems.length > 3 && (
                        <span className="block text-caption-2 font-medium text-alpha-50 pl-2">
                          +{dayItems.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24, duration: 0.4 }}
          className="mt-5 flex flex-wrap items-center gap-2 text-caption-2 text-alpha-60"
        >
          <span className="font-semibold text-alpha-70 mr-1">Platforms:</span>
          {PLATFORM_OPTIONS.map((p) => {
            const style = PLATFORM_STYLES[p]
            const Icon = style.icon
            return (
              <span
                key={p}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                  style.pill,
                )}
              >
                <Icon className="size-3" />
                {style.label}
              </span>
            )
          })}
        </motion.div>
      </div>

      {/* Create / Edit modal */}
      <AnimatePresence>
        {modal && (
          <CalendarItemModal
            mode={modal.type}
            initialDate={modal.type === 'create' ? modal.date : new Date(modal.item.scheduled_at)}
            initialDraftId={modal.type === 'create' ? modal.draftId : modal.item.draft_id ?? undefined}
            item={modal.type === 'edit' ? modal.item : undefined}
            drafts={drafts}
            onClose={() => setModal(null)}
            onCreate={async (data) => {
              await handleCreate(data)
              setModal(null)
            }}
            onUpdate={async (patch) => {
              if (modal.type === 'edit') {
                await handleUpdate(modal.item.id, patch)
                setModal(null)
              }
            }}
            onDelete={async () => {
              if (modal.type === 'edit') {
                await handleDelete(modal.item.id)
                setModal(null)
              }
            }}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Calendar item modal (create + edit)
   ────────────────────────────────────────────────────────────────────────── */

interface CalendarItemModalProps {
  mode: 'create' | 'edit'
  initialDate: Date
  initialDraftId?: string
  item?: CalendarItem
  drafts: Draft[]
  onClose: () => void
  onCreate: (data: {
    title: string
    scheduledAt: string
    platform: CalendarPlatform
    notes: string
    draftId?: string
  }) => Promise<void>
  onUpdate: (patch: Partial<Pick<CalendarItem, 'title' | 'scheduled_at' | 'platform' | 'status' | 'notes'>>) => Promise<void>
  onDelete: () => Promise<void>
}

function CalendarItemModal({
  mode,
  initialDate,
  initialDraftId,
  item,
  drafts,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: CalendarItemModalProps) {
  const presetDraft = drafts.find((d) => d.id === initialDraftId) ?? null
  const presetTitle =
    item?.title ??
    presetDraft?.direction?.title_pillar ??
    (presetDraft?.caption_text ? presetDraft.caption_text.slice(0, 60) : '')

  const [title, setTitle] = useState(presetTitle)
  const [scheduledAt, setScheduledAt] = useState(
    item ? toDatetimeLocal(item.scheduled_at) : defaultDateAt(initialDate, 10),
  )
  const [platform, setPlatform] = useState<CalendarPlatform>(item?.platform ?? 'instagram')
  const [status, setStatus] = useState<CalendarStatus>(item?.status ?? 'planned')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [draftId, setDraftId] = useState<string | undefined>(initialDraftId ?? item?.draft_id ?? undefined)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title.trim() || !scheduledAt) {
      setError('Title and time are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (mode === 'create') {
        await onCreate({
          title: title.trim(),
          scheduledAt,
          platform,
          notes: notes.trim(),
          draftId,
        })
      } else {
        await onUpdate({
          title: title.trim(),
          scheduled_at: new Date(scheduledAt).toISOString(),
          platform,
          status,
          notes: notes.trim() || null,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
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
        className="w-full max-w-[520px] rounded-[20px] bg-white border border-alpha-10 shadow-card max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-alpha-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[10px] bg-secondary-300/30 flex items-center justify-center">
              <CalendarIcon className="size-4 text-primary-900" />
            </div>
            <h3 className="text-subheadline font-semibold text-primary-900">
              {mode === 'create' ? 'Schedule a post' : 'Edit scheduled post'}
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
          {/* Linked draft (create only, when there are approved drafts) */}
          {mode === 'create' && drafts.some((d) => d.status === 'APPROVED') && (
            <div>
              <label className="text-caption-1 font-medium text-primary-900 mb-1.5 block">
                Link to a draft (optional)
              </label>
              <select
                value={draftId ?? ''}
                onChange={(e) => {
                  const value = e.target.value || undefined
                  setDraftId(value)
                  const d = drafts.find((x) => x.id === value)
                  if (d) {
                    setTitle(
                      d.direction?.title_pillar ??
                        (d.caption_text ? d.caption_text.slice(0, 60) : title),
                    )
                  }
                }}
                className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-3.5 py-2.5 text-body-2 text-primary-900 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
              >
                <option value="">No linked draft</option>
                {drafts
                  .filter((d) => d.status === 'APPROVED')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.direction?.title_pillar ?? d.caption_text?.slice(0, 50) ?? d.id}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-caption-1 font-medium text-primary-900 mb-1.5 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How we tripled our reach in 30 days"
              className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-2.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
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
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_STYLES[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {mode === 'edit' && (
            <div>
              <label className="text-caption-1 font-medium text-primary-900 mb-1.5 block">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const active = status === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStatus(opt)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption-2 font-medium border transition-all capitalize',
                        active
                          ? opt === 'published'
                            ? 'bg-success-50 text-success-700 border-success-300'
                            : opt === 'cancelled'
                              ? 'bg-destructive-50 text-destructive-700 border-destructive-300'
                              : 'bg-secondary-300/30 text-primary-900 border-secondary-400'
                          : 'bg-white text-alpha-60 border-alpha-10 hover:border-alpha-20',
                      )}
                    >
                      {opt === 'published' && <CheckCircle2 className="size-3" />}
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-caption-1 font-medium text-primary-900 mb-1.5 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything to remember when publishing…"
              className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-2.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all resize-none"
            />
          </div>

          {error && (
            <div className="rounded-[12px] bg-destructive-50 border border-destructive-200 px-3.5 py-2.5 text-caption-1 text-destructive-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 pb-5 pt-1 flex-wrap">
          {mode === 'edit' ? (
            <button
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="inline-flex items-center gap-1.5 rounded-[12px] px-3.5 py-2.5 text-caption-1 font-medium bg-destructive-50 text-destructive-700 border border-destructive-200 hover:bg-destructive-100 transition-all disabled:opacity-50"
            >
              {deleting ? <Spinner size="sm" /> : <Trash2 className="size-4" />}
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-[12px] px-4 py-2.5 text-caption-1 font-medium bg-white text-primary-900 border border-alpha-10 hover:bg-alpha-5 transition-all"
            >
              Cancel
            </button>
            <LimeButton onClick={handleSubmit} loading={submitting} size="md">
              {mode === 'create' ? (
                <>
                  <Plus className="size-4" />
                  Schedule
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Save changes
                </>
              )}
            </LimeButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
