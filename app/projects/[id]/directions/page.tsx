'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Check,
  ArrowRight,
  ChevronDown,
  Film,
  Layers,
  Image as ImageIcon,
  Video,
  Clapperboard,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Spinner } from '@/components/ui/spinner'
import { LimeButton } from '@/components/onboarding/LimeButton'
import { cn } from '@/lib/utils'
import {
  getDirections,
  generateDirections,
  selectDirection,
  getJobStatus,
  type ContentDirection,
} from '@/lib/api'

type PageState = 'loading' | 'empty' | 'running' | 'complete' | 'error'

interface FormatStyle {
  label: string
  icon: typeof Film
  /** Tailwind classes for the format pill (background + text). */
  pill: string
}

const FORMAT_STYLES: Record<string, FormatStyle> = {
  reel: {
    label: 'Reel',
    icon: Film,
    pill: 'bg-secondary-300/30 text-primary-900 border border-secondary-400',
  },
  carousel: {
    label: 'Carousel',
    icon: Layers,
    pill: 'bg-info-50 text-info-700 border border-info-200',
  },
  story: {
    label: 'Story',
    icon: Clapperboard,
    pill: 'bg-warning-100 text-warning-700 border border-warning-200',
  },
  static: {
    label: 'Static',
    icon: ImageIcon,
    pill: 'bg-alpha-5 text-alpha-60 border border-alpha-10',
  },
  video: {
    label: 'Video',
    icon: Video,
    pill: 'bg-primary-50 text-primary-700 border border-primary-100',
  },
}

function getFormatStyle(format: string | null): FormatStyle {
  const key = (format ?? '').toLowerCase().trim()
  return FORMAT_STYLES[key] ?? FORMAT_STYLES.static
}

const PROGRESS_STEPS = [
  { label: 'Reading your analysis', threshold: 0 },
  { label: 'Crafting angles for each pillar', threshold: 33 },
  { label: 'Matching to your brand voice', threshold: 66 },
]

export default function DirectionsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [directions, setDirections] = useState<ContentDirection[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [numToGenerate, setNumToGenerate] = useState(6)
  const [jobProgress, setJobProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load existing directions on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await getDirections(projectId)
        const data = res.data ?? []
        setDirections(data)
        // Hydrate selected set from any directions already marked selected
        setSelectedIds(new Set(data.filter((d) => d.selected).map((d) => d.id)))
        setPageState(data.length > 0 ? 'complete' : 'empty')
      } catch {
        setPageState('empty')
      }
    }
    load()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [projectId])

  const pollJob = useCallback(
    (jobId: string) => {
      if (pollRef.current) clearInterval(pollRef.current)

      pollRef.current = setInterval(async () => {
        try {
          const status = await getJobStatus<{ directions?: ContentDirection[] }>(jobId)
          setJobProgress(status.progress)

          if (status.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current)
            // Re-fetch from canonical endpoint so we have stable IDs
            const fresh = await getDirections(projectId)
            setDirections(fresh.data ?? [])
            setSelectedIds(new Set())
            setPageState('complete')
          } else if (status.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current)
            setErrorMsg(status.error || 'Could not generate directions')
            setPageState('error')
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current)
          setErrorMsg('Lost connection while generating directions')
          setPageState('error')
        }
      }, 3000)
    },
    [projectId],
  )

  const handleGenerate = async () => {
    setPageState('running')
    setJobProgress(0)
    setErrorMsg('')
    try {
      const { jobId } = await generateDirections(projectId, undefined, numToGenerate)
      pollJob(jobId)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start generation')
      setPageState('error')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    // Persist selection state to backend (fire-and-forget; errors are non-fatal)
    const willBeSelected = !selectedIds.has(id)
    selectDirection(projectId, id, willBeSelected).catch(() => {
      // Silent: server-side selection persistence is best-effort,
      // user can still proceed to drafts since we send the IDs explicitly.
    })
  }

  const handleGenerateDrafts = async () => {
    if (selectedIds.size === 0 || submitting) return
    setSubmitting(true)
    try {
      // Persist all selections first (parallel) so any later visit reflects them
      await Promise.all(
        Array.from(selectedIds).map((id) => selectDirection(projectId, id, true)),
      )
      router.push(
        `/projects/${projectId}/drafts?selected=${Array.from(selectedIds).join(',')}&autostart=1`,
      )
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to prepare drafts')
      setSubmitting(false)
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

  const selectionCount = selectedIds.size

  return (
    <DashboardShell>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px] pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-h4 sm:text-h3 font-bold text-primary-900 mb-2">
            Content Directions
          </h1>
          <p className="text-body-1 text-alpha-60 max-w-[560px]">
            Strategic content pillars derived from your market analysis. Pick the ones
            that fit your brand and we&apos;ll generate full drafts for each.
          </p>
        </motion.div>

        {/* ─── EMPTY STATE ─── */}
        {pageState === 'empty' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="rounded-[24px] border border-alpha-10 bg-gradient-to-br from-white to-alpha-5/50 p-8 sm:p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-[18px] bg-secondary-300/30 flex items-center justify-center mb-5">
                <Compass className="size-8 text-primary-900" />
              </div>
              <h2 className="text-h6 font-bold text-primary-900 mb-2">
                Generate Content Directions
              </h2>
              <p className="text-body-2 text-alpha-60 max-w-[480px] mx-auto mb-6">
                Directions are the strategic backbone of your editorial calendar.
                Each one is a content pillar with a specific angle and format,
                grounded in what&apos;s working in your niche.
              </p>

              {/* Number slider */}
              <div className="max-w-[420px] mx-auto rounded-[16px] border border-alpha-10 bg-white p-5 mb-7 text-left">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-caption-1 font-medium text-primary-900">
                    How many directions?
                  </label>
                  <span className="rounded-full bg-secondary-300/30 border border-secondary-400 px-3 py-0.5 text-caption-1 font-bold text-primary-900">
                    {numToGenerate}
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={10}
                  value={numToGenerate}
                  onChange={(e) => setNumToGenerate(Number(e.target.value))}
                  className="w-full accent-secondary-400"
                />
                <div className="flex justify-between text-caption-2 text-alpha-50 mt-1">
                  <span>4 (focused)</span>
                  <span>10 (broad)</span>
                </div>
              </div>

              <LimeButton onClick={handleGenerate}>
                <Sparkles className="size-4" />
                Generate {numToGenerate} Directions
              </LimeButton>

              <p className="text-caption-2 text-alpha-40 mt-4">
                Takes about 20-40 seconds
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── RUNNING STATE ─── */}
        {pageState === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-[24px] p-[2px] overflow-hidden"
          >
            {/* Rotating gradient border */}
            <motion.div
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,var(--color-secondary-300),var(--color-info-300),var(--color-secondary-300))]"
            />
            <div className="relative rounded-[22px] bg-gradient-to-br from-secondary-50 to-white p-8 sm:p-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mx-auto h-14 w-14 rounded-full border-3 border-secondary-300 border-t-transparent mb-6"
              />
              <h2 className="text-h6 font-bold text-primary-900 mb-2">
                Crafting your directions...
              </h2>
              <p className="text-body-2 text-alpha-60 mb-6">
                We&apos;re translating market signals into actionable content pillars.
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
            </div>
          </motion.div>
        )}

        {/* ─── ERROR STATE ─── */}
        {pageState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border border-destructive-200 bg-destructive-50/50 p-8 sm:p-10 text-center"
          >
            <AlertCircle className="size-10 text-destructive-500 mx-auto mb-4" />
            <h2 className="text-h6 font-bold text-primary-900 mb-2">
              Direction generation failed
            </h2>
            <p className="text-body-2 text-alpha-60 mb-6">{errorMsg}</p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-[12px] px-5 py-3 text-body-2 font-medium bg-white text-primary-900 border border-alpha-10 hover:border-alpha-20 shadow-sm transition-all"
            >
              <RefreshCw className="size-4" />
              Try Again
            </button>
          </motion.div>
        )}

        {/* ─── COMPLETE STATE ─── */}
        {pageState === 'complete' && (
          <>
            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.4 }}
              className="flex flex-wrap items-center justify-between gap-3 mb-5"
            >
              <p className="text-caption-1 text-alpha-60">
                <span className="font-semibold text-primary-900">
                  {directions.length}
                </span>{' '}
                directions ready
                {selectionCount > 0 && (
                  <>
                    {' '}·{' '}
                    <span className="font-semibold text-primary-900">
                      {selectionCount}
                    </span>{' '}
                    selected
                  </>
                )}
              </p>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-caption-1 font-medium bg-alpha-5 text-primary-900 border border-alpha-10 hover:bg-alpha-10 transition-all"
              >
                <RefreshCw className="size-3.5" />
                Regenerate
              </button>
            </motion.div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {directions.map((d, i) => {
                const fmt = getFormatStyle(d.format)
                const FmtIcon = fmt.icon
                const isSelected = selectedIds.has(d.id)
                const isExpanded = expandedId === d.id
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.04, duration: 0.4 }}
                    className={cn(
                      'relative rounded-[20px] bg-white p-5 sm:p-6 transition-all duration-200',
                      isSelected
                        ? 'border-2 border-primary-900 shadow-signature'
                        : 'border border-alpha-10 shadow-card hover:border-alpha-20',
                    )}
                  >
                    {/* Top bar: select + format */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(d.id)}
                        aria-pressed={isSelected}
                        aria-label={isSelected ? 'Deselect direction' : 'Select direction'}
                        className={cn(
                          'h-6 w-6 shrink-0 rounded-md flex items-center justify-center transition-all duration-200 cursor-pointer',
                          isSelected
                            ? 'bg-secondary-300 border border-primary-900'
                            : 'bg-white border-2 border-alpha-20 hover:border-alpha-40',
                        )}
                      >
                        {isSelected && <Check className="size-3.5 text-primary-900" />}
                      </button>

                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption-2 font-semibold',
                          fmt.pill,
                        )}
                      >
                        <FmtIcon className="size-3" />
                        {fmt.label}
                      </span>
                    </div>

                    {/* Pillar */}
                    <h3 className="font-heading text-h6 font-semibold text-primary-900 mb-2">
                      {d.title_pillar}
                    </h3>

                    {/* Angle */}
                    {d.angle && (
                      <p className="text-body-2 text-alpha-60 mb-3">
                        {d.angle}
                      </p>
                    )}

                    {/* Rationale */}
                    {d.rationale && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : d.id)}
                          className="inline-flex items-center gap-1 text-caption-1 font-medium text-primary-900 hover:text-primary-700 transition-colors"
                        >
                          {isExpanded ? 'Hide rationale' : 'Why this works'}
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="size-3.5" />
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              key="rationale"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <p className="mt-3 rounded-[12px] bg-alpha-5/70 border border-alpha-10 p-3.5 text-caption-1 text-alpha-70">
                                {d.rationale}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Floating action bar */}
            <AnimatePresence>
              {selectionCount > 0 && (
                <motion.div
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="fixed bottom-5 inset-x-0 z-30 px-4 pointer-events-none"
                >
                  <div className="max-w-[680px] mx-auto pointer-events-auto rounded-[18px] border border-primary-900 bg-white shadow-signature p-3 sm:p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-secondary-300 flex items-center justify-center">
                        <Sparkles className="size-4 text-primary-900" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-caption-1 font-semibold text-primary-900 truncate">
                          {selectionCount} direction{selectionCount !== 1 ? 's' : ''} selected
                        </p>
                        <p className="text-caption-2 text-alpha-50 truncate">
                          Generate full drafts with captions and scripts
                        </p>
                      </div>
                    </div>
                    <LimeButton onClick={handleGenerateDrafts} loading={submitting} size="md">
                      Generate drafts
                      <ArrowRight className="size-4" />
                    </LimeButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
