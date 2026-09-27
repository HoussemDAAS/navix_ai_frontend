'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Ban,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AiMark } from '@/components/ui/ai-mark'
import { StatTiles, type StatTileData } from '@/components/dashboard/StatTiles'
import { CompetitorCard } from '@/components/competitors/CompetitorCard'
import { CompetitorCardSkeleton } from '@/components/competitors/CompetitorCardSkeleton'
import { AddCompetitorModal } from '@/components/competitors/AddCompetitorModal'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/utils'
import {
  getCompetitors,
  updateCompetitor,
  discoverCompetitors,
  getProject,
  getDiscoveryStatus,
  type Competitor,
  type DiscoveryStatus,
} from '@/lib/api'

const INITIAL_VISIBLE = 6
/** Tracked accounts needed before market analysis has a field to measure */
const ANALYSIS_READY_AT = 3
const POLL_MS = 4000

/** Map used by CompetitorCard */
export interface MappedCompetitor {
  id: string
  handle: string
  initials: string
  color: string
  platform: 'Instagram' | 'TikTok'
  confidenceScore: number
  inclusionReason: string
  dominantFormat: string
  tags: string[]
  avatarUrl: string | null
  followersCount: number | null
  biography: string | null
  isNew: boolean
}

function getInitials(handle: string, fullName: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('')
  }
  return handle.replace(/^@/, '').slice(0, 2).toUpperCase()
}

const avatarColors = ['#6366F1', '#14B8A6', '#8B5CF6', '#06B6D4', '#22C55E', '#10B981', '#7C3AED', '#0EA5E9', '#F59E0B', '#EF4444']
function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function mapCompetitor(c: Competitor, knownIds: Set<string> | null): MappedCompetitor {
  const platformMap: Record<string, MappedCompetitor['platform']> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
  }
  const tags: string[] = []
  if (c.discovery_method === 'seed') tags.push('Your pick')
  if (c.discovery_method === 'manual') tags.push('Added by you')
  if (c.discovery_method === 'expand') {
    const m = c.inclusion_reason?.match(/Similar to @([A-Za-z0-9._-]+)/)
    tags.push(m ? `Similar to @${m[1]}` : 'Similar to a tracked account')
  }

  return {
    id: c.id,
    handle: c.handle.startsWith('@') ? c.handle : `@${c.handle}`,
    initials: getInitials(c.handle, c.full_name),
    color: getAvatarColor(c.id),
    platform: platformMap[c.platform?.toLowerCase() || ''] || 'Instagram',
    confidenceScore: c.confidence_score ?? 70,
    inclusionReason: c.inclusion_reason || 'Relevant competitor in your niche.',
    dominantFormat: 'Mixed',
    tags,
    avatarUrl: c.avatar_url,
    followersCount: c.followers_count,
    biography: c.biography,
    isNew: knownIds ? !knownIds.has(c.id) : false,
  }
}

const STAGE_LABEL: Record<string, string> = {
  reading_profile: 'Reading your profile',
  planning: 'Planning the search from your profile and niche',
  searching: 'Searching Instagram',
  searching_tiktok: 'Searching TikTok',
  enriching: 'Analyzing accounts: bio, audience, related accounts',
  analyzing: 'Judging relevance against your brand',
  expanding: 'Finding similar accounts',
  done: 'Done',
}

const ctaClasses =
  'inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none'
const secondaryClasses =
  'inline-flex items-center justify-center gap-2 rounded-[12px] border border-alpha-10 bg-white px-4 py-2.5 text-caption-1 font-medium text-alpha-60 transition-all duration-200 hover:border-primary-900 hover:text-primary-900 disabled:opacity-50 disabled:pointer-events-none'

type PageState = 'loading' | 'ready' | 'error'

function Section({
  title,
  count,
  hint,
  children,
}: {
  title: string
  count: number
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-subheadline font-semibold text-primary-900">
          {title} <span className="font-medium text-alpha-40">{count}</span>
        </h2>
        {hint && <p className="mt-0.5 text-caption-1 text-alpha-60">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/** A job killed by a backend restart restarts on its own; say so instead of "problem". */
function wasInterrupted(error: string | null | undefined): boolean {
  return !!error && error.startsWith('Interrupted')
}

function discoveryErrorTitle(error: string | null | undefined): string {
  return wasInterrupted(error) ? 'Search interrupted' : 'Discovery hit a problem'
}

function discoveryErrorText(error: string | null | undefined, fallback: string): string {
  if (wasInterrupted(error)) {
    return 'The backend restarted while the search was running. It picks the search up again on its own within a minute; if nothing moves, use Search again.'
  }
  return error || fallback
}

function CompetitorsContent() {
  const params = useParams()
  const projectId = params.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [competitors, setCompetitors] = useState<MappedCompetitor[]>([])
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set())
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [showAllFound, setShowAllFound] = useState(false)
  const [showDismissed, setShowDismissed] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [discovery, setDiscovery] = useState<DiscoveryStatus | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [pollExhausted, setPollExhausted] = useState(false)
  // Ids we have already shown — anything beyond them is "new"
  const knownIdsRef = useRef<Set<string> | null>(null)
  const idleTicksRef = useRef(0)

  const discoveryActive = discovery?.status === 'pending' || discovery?.status === 'active'

  const applyCompetitors = useCallback((data: Competitor[]) => {
    const known = knownIdsRef.current
    setCompetitors(data.map((c) => mapCompetitor(c, known)))
    setTrackedIds(new Set(data.filter((c) => c.validated_by_user).map((c) => c.id)))
    setDismissedIds(new Set(data.filter((c) => c.rejected_by_user).map((c) => c.id)))
    // After the first render everything currently listed is "known"
    if (!known) knownIdsRef.current = new Set(data.map((c) => c.id))
  }, [])

  const refresh = useCallback(async () => {
    const [listRes, statusRes] = await Promise.all([
      getCompetitors(projectId),
      getDiscoveryStatus(projectId).catch(() => null),
    ])
    if (statusRes) setDiscovery(statusRes.data)
    const list = listRes.data ?? []
    applyCompetitors(list)
    setPageState('ready')
    return { count: list.length, status: statusRes?.data ?? null }
  }, [projectId, applyCompetitors])

  // Initial load
  useEffect(() => {
    refresh().catch(() => setPageState('error'))
  }, [refresh])

  // Poll while discovery/expansion runs, or while the list is still empty
  const isEmpty = competitors.length === 0
  useEffect(() => {
    if (pageState !== 'ready') return
    const shouldPoll = discoveryActive || (isEmpty && !pollExhausted)
    if (!shouldPoll) return
    const timer = setInterval(async () => {
      try {
        const { count, status } = await refresh()
        const active = status?.status === 'pending' || status?.status === 'active'
        if (!active && count === 0) {
          idleTicksRef.current += 1
          // Nothing running and nothing found: stop after ~2 minutes and offer a retry
          if (idleTicksRef.current >= 30) setPollExhausted(true)
        } else {
          idleTicksRef.current = 0
        }
      } catch { /* keep polling */ }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [pageState, discoveryActive, isEmpty, pollExhausted, refresh])

  // Once a run finishes, promote the "new" arrivals to known on the next run
  useEffect(() => {
    if (discovery?.status === 'completed' || discovery?.status === 'failed') {
      const t = setTimeout(() => {
        knownIdsRef.current = new Set(competitors.map((c) => c.id))
      }, 30_000)
      return () => clearTimeout(t)
    }
  }, [discovery?.status, competitors])

  const handleRetryDiscovery = useCallback(async () => {
    setRetrying(true)
    try {
      const { data: project } = await getProject(projectId)
      await discoverCompetitors({
        niche: project.niche,
        location: project.location ?? undefined,
        project_id: projectId,
        persona: project.persona ?? undefined,
        entity_name: project.name,
        instagram_handle: project.instagram_handle ?? undefined,
        tiktok_handle: project.tiktok_handle ?? undefined,
        niche_description: project.niche_description ?? undefined,
        keywords: project.keywords ?? undefined,
        seed_accounts: project.seed_accounts ?? undefined,
      })
      setPollExhausted(false)
      idleTicksRef.current = 0
      setDiscovery({ status: 'pending', progress: 0, stage: 'reading_profile', message: 'Starting', expand_from: null, counts: { candidates: 0, enriched: 0, kept: 0, total: 0 }, error: null, updated_at: null })
    } catch {
      setPageState('error')
    } finally {
      setRetrying(false)
    }
  }, [projectId])

  const handleTrack = useCallback((id: string) => {
    setTrackedIds((prev) => new Set(prev).add(id))
    // Persist + start the content scrape + "find similar accounts" refinement.
    // Optimistic: revert the local state if the server rejects it.
    const tracked = competitors.find((c) => c.id === id)
    updateCompetitor(projectId, id, { validatedByUser: true })
      .then(() => {
        setDiscovery({
          status: 'pending',
          progress: 5,
          stage: 'expanding',
          message: `Finding accounts similar to ${tracked?.handle ?? 'this account'}`,
          expand_from: tracked?.handle.replace(/^@/, '') ?? null,
          counts: { candidates: 0, enriched: 0, kept: 0, total: competitors.length },
          error: null,
          updated_at: null,
        })
      })
      .catch(() => {
        setTrackedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      })
  }, [projectId, competitors])

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id))
    updateCompetitor(projectId, id, { rejectedByUser: true }).catch(() => {
      setDismissedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    })
  }, [projectId])

  const handleRestore = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    updateCompetitor(projectId, id, { rejectedByUser: false }).catch(() => {
      setDismissedIds((prev) => new Set(prev).add(id))
    })
  }, [projectId])

  const tracked = useMemo(
    () => competitors.filter((c) => trackedIds.has(c.id) && !dismissedIds.has(c.id)),
    [competitors, trackedIds, dismissedIds],
  )
  const dismissed = useMemo(
    () => competitors.filter((c) => dismissedIds.has(c.id)),
    [competitors, dismissedIds],
  )
  const found = useMemo(() => {
    const rest = competitors.filter((c) => !trackedIds.has(c.id) && !dismissedIds.has(c.id))
    // Newest arrivals first, then by confidence
    return [...rest].sort((a, b) => {
      const n = Number(b.isNew) - Number(a.isNew)
      if (n !== 0) return n
      return b.confidenceScore - a.confidenceScore
    })
  }, [competitors, trackedIds, dismissedIds])
  const visibleFound = showAllFound ? found : found.slice(0, INITIAL_VISIBLE)
  const hiddenFound = found.length - visibleFound.length

  const lastRun = discovery?.updated_at ? relativeTime(discovery.updated_at) : null

  const tiles: StatTileData[] = [
    { key: 'tracked', label: 'Tracked', value: tracked.length, hint: 'benchmarked by you', icon: Users },
    { key: 'found', label: 'Found by Navix', value: found.length, hint: 'waiting for your call', icon: Search },
    { key: 'dismissed', label: 'Dismissed', value: dismissed.length, hint: 'kept out of the analysis', icon: Ban },
  ]

  const subtitle =
    tracked.length > 0
      ? `${tracked.length} tracked · ${found.length} more found by Navix`
      : found.length > 0
        ? `${found.length} accounts found — track the ones worth benchmarking`
        : 'The accounts competing for your audience, found and ranked by Navix.'

  const progressPanel = discovery && (discoveryActive || discovery.status === 'failed') && (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-[16px] border border-secondary-400 bg-secondary-50 px-5 py-4"
    >
      <div className="flex items-start gap-3">
        {discovery.status === 'failed' ? (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-alpha-10 bg-white">
            <RefreshCw className="size-4 text-primary-900" />
          </span>
        ) : (
          <AiMark spinning className="mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-body-2 font-semibold text-primary-900">
            {discovery.status === 'failed'
              ? discoveryErrorTitle(discovery.error)
              : discovery.message || STAGE_LABEL[discovery.stage ?? ''] || 'Working…'}
          </p>
          <p className="mt-0.5 text-caption-2 text-alpha-60">
            {discovery.status === 'failed'
              ? discoveryErrorText(discovery.error, 'Try again in a moment.')
              : [
                  discovery.counts.candidates > 0 ? `${discovery.counts.candidates} accounts found` : null,
                  discovery.counts.enriched > 0 ? `${discovery.counts.enriched} analyzed` : null,
                  discovery.counts.kept > 0 ? `${discovery.counts.kept} kept` : null,
                ].filter(Boolean).join(' · ') || 'We take our time here — good matches beat fast ones.'}
          </p>
          {discovery.status !== 'failed' && (
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-alpha-10">
              <motion.div
                className="h-full rounded-full bg-primary-900"
                animate={{ width: `${Math.max(4, discovery.progress)}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  if (pageState === 'loading') {
    return (
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-alpha-10" />
          <div className="h-5 w-80 animate-pulse rounded bg-alpha-5" />
        </div>
        <div className="max-w-[760px] space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CompetitorCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        <div className="flex flex-col items-center py-20 text-center">
          <h2 className="mb-2 text-h5 font-bold text-primary-900">Something went wrong</h2>
          <p className="mb-6 max-w-md text-body-2 text-alpha-60">We couldn&apos;t load your competitors.</p>
          <button
            type="button"
            onClick={() => { setPageState('loading'); refresh().catch(() => setPageState('error')) }}
            className={ctaClasses}
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  const searchLabel = retrying
    ? 'Launching search...'
    : discovery?.status === 'idle' || !discovery
      ? 'Find my competitors'
      : 'Search again'

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
          <h1 className="text-h5 font-bold text-primary-900 sm:text-h4">Competitors</h1>
          <p className="mt-1.5 text-body-2 text-alpha-60">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleRetryDiscovery}
            disabled={retrying || discoveryActive}
            title="Run discovery again with your current profile"
            className={secondaryClasses}
          >
            <RefreshCw className={cn('size-4', retrying && 'animate-spin')} />
            {searchLabel}
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            title="Add a competitor from an Instagram or TikTok profile link"
            className={ctaClasses}
          >
            <Plus className="size-4" />
            Add competitor
          </button>
        </div>
      </motion.div>

      {progressPanel}

      {!isEmpty && <StatTiles tiles={tiles} loading={false} skeletonCount={3} className="mb-6" />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Lists */}
        <div className="min-w-0 space-y-8">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center rounded-[20px] border border-alpha-10 bg-alpha-5/50 px-6 py-14 text-center"
            >
              {discoveryActive ? (
                <>
                  <AiMark size="lg" spinning className="mb-4" />
                  <h2 className="mb-2 text-h5 font-bold text-primary-900">Finding your real competitors</h2>
                  <p className="mb-2 max-w-md text-body-2 text-alpha-60">
                    We read your profile, search Instagram &amp; TikTok, analyze every account we find, and only keep the ones worth benchmarking. This takes a few minutes.
                  </p>
                  <p className="text-caption-1 text-alpha-30">This page updates automatically.</p>
                </>
              ) : (
                <>
                  <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-secondary-300 bg-secondary-50">
                    <Search className="size-6 text-primary-btn" />
                  </div>
                  <h2 className="mb-2 text-h5 font-bold text-primary-900">
                    {discovery?.status === 'failed' ? discoveryErrorTitle(discovery.error) : 'No competitors yet'}
                  </h2>
                  <p className="mb-6 max-w-md text-body-2 text-alpha-60">
                    {discovery?.status === 'failed'
                      ? discoveryErrorText(discovery.error, 'Something went wrong during the search.')
                      : 'Run discovery: we read your profile, scan Instagram & TikTok, analyze every account we find, and keep only the ones worth benchmarking. It takes a few minutes.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={handleRetryDiscovery} disabled={retrying} className={ctaClasses}>
                      <RefreshCw className={cn('size-4', retrying && 'animate-spin')} />
                      {searchLabel}
                    </button>
                    <button type="button" onClick={() => setShowAdd(true)} className={secondaryClasses}>
                      <Plus className="size-4" />
                      Add by link
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <>
              {tracked.length > 0 && (
                <Section
                  title="Tracked"
                  count={tracked.length}
                  hint="Their posts feed your analysis and are refreshed automatically."
                >
                  <AnimatePresence mode="popLayout">
                    {tracked.map((competitor, i) => (
                      <CompetitorCard
                        key={competitor.id}
                        competitor={competitor}
                        projectId={projectId}
                        index={i}
                        isTracked
                        isDismissed={false}
                        onTrack={handleTrack}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </AnimatePresence>
                </Section>
              )}

              {found.length > 0 && (
                <Section
                  title="Found by Navix"
                  count={found.length}
                  hint={
                    tracked.length > 0
                      ? 'Every account you track teaches Navix what to look for — similar accounts land here.'
                      : 'Each account was judged against your profile. Track the ones you want to benchmark.'
                  }
                >
                  <AnimatePresence mode="popLayout">
                    {visibleFound.map((competitor, i) => (
                      <CompetitorCard
                        key={competitor.id}
                        competitor={competitor}
                        projectId={projectId}
                        index={i}
                        isTracked={false}
                        isDismissed={false}
                        onTrack={handleTrack}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </AnimatePresence>
                  {hiddenFound > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllFound(true)}
                      className="mx-auto flex items-center gap-1.5 pt-2 text-caption-1 font-medium text-alpha-60 transition-colors hover:text-primary-900"
                    >
                      Show {hiddenFound} more
                      <ChevronDown className="size-3.5" />
                    </button>
                  )}
                </Section>
              )}

              {tracked.length === 0 && found.length === 0 && (
                <p className="rounded-[16px] border border-alpha-10 bg-alpha-5/50 px-5 py-4 text-body-2 text-alpha-60">
                  Everything found so far was dismissed — search again, add an account by link, or restore one below.
                </p>
              )}

              {dismissed.length > 0 && (
                <section>
                  <button
                    type="button"
                    onClick={() => setShowDismissed((v) => !v)}
                    className="flex items-center gap-1.5 text-caption-1 font-medium text-alpha-60 transition-colors hover:text-primary-900"
                  >
                    {showDismissed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    Dismissed ({dismissed.length})
                  </button>
                  {showDismissed && (
                    <ul className="mt-3 divide-y divide-alpha-10 rounded-[12px] border border-alpha-10 bg-white">
                      {dismissed.map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <span className="truncate text-caption-1 text-primary-900">
                            {c.handle} <span className="text-alpha-40">· {c.platform}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRestore(c.id)}
                            className="inline-flex shrink-0 items-center gap-1 text-caption-2 font-semibold text-primary-900 hover:underline"
                          >
                            <RotateCcw className="size-3" />
                            Restore
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {/* Rail */}
        <aside className="space-y-4 self-start lg:sticky lg:top-6">
          <div className="rounded-[16px] border border-alpha-10 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <AiMark spinning={discoveryActive} />
              <div className="min-w-0">
                <p className="text-body-2 font-semibold text-primary-900">Navix discovery</p>
                <p className="text-caption-2 text-alpha-60">
                  {discoveryActive ? 'Running now' : lastRun ? `Last run ${lastRun}` : 'Not run yet'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-caption-1 leading-relaxed text-alpha-60">
              Navix reads your profile, plans a search from your bio, scans Instagram and TikTok,
              then judges every account against your brand. Tracking one teaches it what to look for.
            </p>
          </div>

          {tracked.length >= ANALYSIS_READY_AT ? (
            <div className="rounded-[16px] border border-secondary-400 bg-secondary-50 p-5">
              <p className="text-body-2 font-semibold text-primary-900">Ready for market analysis</p>
              <p className="mt-1 text-caption-1 text-alpha-60">
                {tracked.length} tracked accounts give Navix a field to measure you against.
              </p>
              <Link href={`/projects/${projectId}/analysis`} className={cn(ctaClasses, 'mt-3 w-full')}>
                Open market analysis
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            !isEmpty && (
              <div className="rounded-[16px] border border-alpha-10 bg-alpha-5/50 p-5">
                <p className="text-body-2 font-semibold text-primary-900">
                  Track {ANALYSIS_READY_AT - tracked.length} more to unlock analysis
                </p>
                <p className="mt-1 text-caption-1 text-alpha-60">
                  Aim for your best five — quality beats quantity here.
                </p>
              </div>
            )
          )}
        </aside>
      </div>

      <AddCompetitorModal
        projectId={projectId}
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { void refresh() }}
      />
    </div>
  )
}

export default function CompetitorsPage() {
  return (
    <DashboardShell>
      <CompetitorsContent />
    </DashboardShell>
  )
}
