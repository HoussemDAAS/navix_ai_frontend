'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Plus, ChevronDown, RefreshCw, Search, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { CompetitorCard } from '@/components/competitors/CompetitorCard'
import { CompetitorCardSkeleton } from '@/components/competitors/CompetitorCardSkeleton'
import { AddCompetitorModal } from '@/components/competitors/AddCompetitorModal'
import { ValidationProgress } from '@/components/competitors/ValidationProgress'
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
const REQUIRED_VALIDATIONS = 3
const POLL_MS = 4000

/** Map used by CompetitorCard */
export interface MappedCompetitor {
  id: string
  handle: string
  initials: string
  color: string
  platform: 'Instagram' | 'TikTok' | 'YouTube'
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
    youtube: 'YouTube',
  }
  const tags: string[] = []
  if (c.discovery_method === 'seed') tags.push('Your pick')
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

type PageState = 'loading' | 'ready' | 'empty' | 'error'

export default function CompetitorsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [competitors, setCompetitors] = useState<MappedCompetitor[]>([])
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set())
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [celebrateAt3, setCelebrateAt3] = useState(false)
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
    if (list.length > 0) {
      applyCompetitors(list)
      setPageState('ready')
    } else {
      setPageState('empty')
    }
    return { count: list.length, status: statusRes?.data ?? null }
  }, [projectId, applyCompetitors])

  // Initial load
  useEffect(() => {
    refresh().catch(() => setPageState('error'))
  }, [refresh])

  // Poll while discovery/expansion runs, or while the list is still empty
  useEffect(() => {
    if (pageState === 'loading' || pageState === 'error') return
    const shouldPoll = discoveryActive || (pageState === 'empty' && !pollExhausted)
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
  }, [pageState, discoveryActive, pollExhausted, refresh])

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
        facebook_handle: project.facebook_handle ?? undefined,
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

  const visibleCompetitors = useMemo(() => {
    const filtered = competitors.filter((c) => !dismissedIds.has(c.id))
    // Tracked first, then newest arrivals, then by confidence
    const sorted = [...filtered].sort((a, b) => {
      const t = Number(trackedIds.has(b.id)) - Number(trackedIds.has(a.id))
      if (t !== 0) return t
      const n = Number(b.isNew) - Number(a.isNew)
      if (n !== 0) return n
      return b.confidenceScore - a.confidenceScore
    })
    return showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE)
  }, [competitors, dismissedIds, trackedIds, showAll])

  const totalActive = competitors.filter((c) => !dismissedIds.has(c.id)).length
  const hiddenCount = totalActive - Math.min(INITIAL_VISIBLE, totalActive)
  const validatedCount = trackedIds.size + dismissedIds.size
  const isUnlocked = trackedIds.size >= REQUIRED_VALIDATIONS

  const handleTrack = useCallback((id: string) => {
    setTrackedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      if (next.size === REQUIRED_VALIDATIONS) {
        setCelebrateAt3(true)
        setTimeout(() => setCelebrateAt3(false), 1000)
      }
      return next
    })
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
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    updateCompetitor(projectId, id, { rejectedByUser: true }).catch(() => {
      setDismissedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    })
  }, [projectId])

  const Nav = (
    <nav className="mx-auto max-w-[1340px] px-5 sm:px-6 md:px-12 lg:px-16 py-4">
      <Link href="/" className="shrink-0 inline-block">
        <img src="/logo_navix.svg" alt="Navix" className="h-5 w-auto sm:h-6" />
      </Link>
    </nav>
  )

  const progressPanel = discovery && (discoveryActive || discovery.status === 'failed') && (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-[16px] border border-secondary-400 bg-secondary-50 px-5 py-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-secondary-300 border border-primary-900">
          {discovery.status === 'failed' ? <RefreshCw className="size-4 text-primary-900" /> : (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}>
              <Sparkles className="size-4 text-primary-900" />
            </motion.div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-2 font-semibold text-primary-900">
            {discovery.status === 'failed'
              ? 'Discovery hit a problem'
              : discovery.message || STAGE_LABEL[discovery.stage ?? ''] || 'Working…'}
          </p>
          <p className="text-caption-2 text-alpha-60 mt-0.5">
            {discovery.status === 'failed'
              ? discovery.error || 'Try again in a moment.'
              : [
                  discovery.counts.candidates > 0 ? `${discovery.counts.candidates} accounts found` : null,
                  discovery.counts.enriched > 0 ? `${discovery.counts.enriched} analyzed` : null,
                  discovery.counts.kept > 0 ? `${discovery.counts.kept} kept` : null,
                ].filter(Boolean).join(' · ') || 'We take our time here — good matches beat fast ones.'}
          </p>
          {discovery.status !== 'failed' && (
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-alpha-10 overflow-hidden">
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
      <main className="min-h-screen bg-white">
        {Nav}
        <ProgressBar percent={90} />
        <div className="mx-auto max-w-[1240px] px-5 sm:px-6 md:px-12 lg:px-16 pt-8 pb-16">
          <div className="mb-8 space-y-2">
            <div className="h-8 w-72 rounded bg-alpha-10 animate-pulse" />
            <div className="h-5 w-96 rounded bg-alpha-5 animate-pulse" />
          </div>
          <div className="flex-1 max-w-[740px] space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CompetitorCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (pageState === 'empty') {
    return (
      <main className="min-h-screen bg-white">
        {Nav}
        <div className="mx-auto max-w-[1240px] px-5 sm:px-6 md:px-12 lg:px-16 pt-12 pb-16">
          <div className="max-w-[740px] mx-auto">{progressPanel}</div>
          <div className="flex flex-col items-center text-center">
            {!discoveryActive && (pollExhausted || (discovery && discovery.status !== 'pending' && discovery.status !== 'active')) ? (
              <>
                <div className="w-14 h-14 rounded-full bg-secondary-50 border border-secondary-300 flex items-center justify-center mb-4">
                  <Search className="size-6 text-primary-btn" />
                </div>
                <h2 className="text-h5 font-bold text-primary-900 mb-2">
                  {discovery?.status === 'failed' ? 'Discovery hit a problem' : 'No competitors yet'}
                </h2>
                <p className="text-body-2 text-alpha-60 mb-6 max-w-md">
                  {discovery?.status === 'failed'
                    ? discovery.error || 'Something went wrong during the search.'
                    : 'Run discovery: we read your profile, scan Instagram & TikTok, analyze every account we find, and keep only the ones worth benchmarking. It takes a few minutes.'}
                </p>
                <button
                  type="button"
                  onClick={handleRetryDiscovery}
                  disabled={retrying}
                  className="inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-5 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <RefreshCw className={`size-4 ${retrying ? 'animate-spin' : ''}`} />
                  {retrying ? 'Launching search...' : discovery?.status === 'idle' ? 'Find my competitors' : 'Search again'}
                </button>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="w-14 h-14 rounded-full bg-secondary-50 border border-secondary-300 flex items-center justify-center mb-4"
                >
                  <Search className="size-6 text-primary-btn" />
                </motion.div>
                <h2 className="text-h5 font-bold text-primary-900 mb-2">Finding your real competitors</h2>
                <p className="text-body-2 text-alpha-60 mb-2 max-w-md">
                  We read your profile, search Instagram &amp; TikTok, analyze every account we find, and only keep the ones worth benchmarking. This takes a few minutes.
                </p>
                <p className="text-caption-1 text-alpha-30">This page updates automatically.</p>
              </>
            )}
          </div>
        </div>
      </main>
    )
  }

  if (pageState === 'error') {
    return (
      <main className="min-h-screen bg-white">
        {Nav}
        <div className="mx-auto max-w-[1240px] px-5 sm:px-6 md:px-12 lg:px-16 pt-20 pb-16">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-h5 font-bold text-primary-900 mb-2">Something went wrong</h2>
            <p className="text-body-2 text-alpha-60 mb-6 max-w-md">We couldn&apos;t load your competitor results.</p>
            <button
              type="button"
              onClick={() => { setPageState('loading'); refresh().catch(() => setPageState('error')) }}
              className="inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-5 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {Nav}
      <ProgressBar percent={100} />

      <div className="mx-auto max-w-[1240px] px-5 sm:px-6 md:px-12 lg:px-16 pt-4 sm:pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h1 className="text-h5 sm:text-h4 lg:text-h3 font-bold text-primary-btn mb-2">
            {trackedIds.size > 0 ? 'Refining your competitor map.' : 'We found your real competitors.'}
          </h1>
          <p className="text-body-2 sm:text-body-1 text-alpha-60 max-w-[640px]">
            {trackedIds.size > 0
              ? 'Every account you track teaches us what to look for — similar accounts appear below. Aim for your best 5.'
              : 'Each account was analyzed against your profile. Track the ones you want to benchmark; we’ll find more like them.'}
          </p>
        </motion.div>

        <div className="flex flex-col gap-6">
          <div className="flex-1 max-w-[740px]">
            {progressPanel}

            <div className="flex items-end justify-between gap-4 mb-4">
              <ValidationProgress
                validated={validatedCount}
                total={competitors.length}
                celebrate={celebrateAt3}
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleRetryDiscovery}
                disabled={retrying || discoveryActive}
                title="Run discovery again with your current profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-caption-1 font-medium text-alpha-60 border border-alpha-10 hover:border-primary-900 hover:text-primary-900 hover:bg-alpha-5 transition-all duration-150 shrink-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                <RefreshCw className={`size-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Search again</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                title="Add a competitor by profile link"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-caption-1 font-medium text-primary-900 bg-secondary-300 border border-primary-900 hover:bg-secondary-400 transition-all duration-150 shrink-0"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            <AddCompetitorModal
              projectId={projectId}
              open={showAdd}
              onClose={() => setShowAdd(false)}
              onAdded={() => { void refresh() }}
            />

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {visibleCompetitors.map((competitor, i) => (
                  <CompetitorCard
                    key={competitor.id}
                    competitor={competitor}
                    projectId={projectId}
                    index={i}
                    isTracked={trackedIds.has(competitor.id)}
                    isDismissed={dismissedIds.has(competitor.id)}
                    onTrack={handleTrack}
                    onDismiss={handleDismiss}
                  />
                ))}
              </AnimatePresence>
            </div>

            {!showAll && hiddenCount > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                type="button"
                onClick={() => setShowAll(true)}
                className="flex items-center gap-1.5 mx-auto mt-6 text-caption-1 font-medium text-alpha-60 hover:text-primary-900 transition-colors"
              >
                Show {hiddenCount} more competitors
                <ChevronDown className="size-3.5" />
              </motion.button>
            )}

            {isUnlocked && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                <Link
                  href={`/projects/${projectId}/analysis`}
                  className="flex w-full sm:w-auto sm:inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-6 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
                >
                  Run Market Analysis
                  <ArrowRight className="size-4" />
                </Link>
                <p className="mt-2 text-caption-1 text-alpha-60 text-center sm:text-left">
                  We&apos;re scraping your tracked competitors&apos; content — the analysis
                  gets smarter as their posts come in (~1–2 min).
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
