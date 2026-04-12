'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Plus, ChevronDown, RefreshCw, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { CompetitorCard } from '@/components/competitors/CompetitorCard'
import { CompetitorCardSkeleton } from '@/components/competitors/CompetitorCardSkeleton'
import { ValidationProgress } from '@/components/competitors/ValidationProgress'
import { getCompetitors, type Competitor } from '@/lib/api'

const INITIAL_VISIBLE = 5
const REQUIRED_VALIDATIONS = 3

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

function mapCompetitor(c: Competitor): MappedCompetitor {
  const platformMap: Record<string, MappedCompetitor['platform']> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
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
    tags: [],
    avatarUrl: c.avatar_url,
    followersCount: c.followers_count,
    biography: c.biography,
  }
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
  const [celebrateAt3, setCelebrateAt3] = useState(false)

  const fetchCompetitors = useCallback(async () => {
    try {
      const result = await getCompetitors(projectId)
      if (result.data && result.data.length > 0) {
        setCompetitors(result.data.map(mapCompetitor))
        setPageState('ready')
      } else {
        setPageState('empty')
      }
    } catch {
      setPageState('error')
    }
  }, [projectId])

  useEffect(() => {
    fetchCompetitors()
  }, [fetchCompetitors])

  // If empty, poll a few times in case scraper is still running
  useEffect(() => {
    if (pageState !== 'empty') return

    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      try {
        const result = await getCompetitors(projectId)
        if (result.data && result.data.length > 0) {
          setCompetitors(result.data.map(mapCompetitor))
          setPageState('ready')
          clearInterval(poll)
        }
      } catch { /* keep trying */ }
      if (attempts >= 15) clearInterval(poll) // stop after ~1 minute
    }, 4000)

    return () => clearInterval(poll)
  }, [pageState, projectId])

  const visibleCompetitors = useMemo(() => {
    const filtered = competitors.filter((c) => !dismissedIds.has(c.id))
    return showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE)
  }, [competitors, dismissedIds, showAll])

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
  }, [])

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  // Loading
  if (pageState === 'loading') {
    return (
      <main className="min-h-screen bg-white">
        <nav className="mx-auto max-w-[1340px] px-5 sm:px-6 md:px-12 lg:px-16 py-4">
          <Link href="/" className="shrink-0 inline-block">
            <img src="/logo_navix.svg" alt="Navix" className="h-5 w-auto sm:h-6" />
          </Link>
        </nav>
        <ProgressBar percent={90} />
        <div className="mx-auto max-w-[1240px] px-5 sm:px-6 md:px-12 lg:px-16 pt-8 pb-16">
          <div className="mb-8 space-y-2">
            <div className="h-8 w-72 rounded bg-alpha-10 animate-pulse" />
            <div className="h-5 w-96 rounded bg-alpha-5 animate-pulse" />
          </div>
          <div className="flex gap-8">
            <div className="flex-1 max-w-[740px] space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CompetitorCardSkeleton key={i} index={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Empty — still waiting for scraper
  if (pageState === 'empty') {
    return (
      <main className="min-h-screen bg-white">
        <nav className="mx-auto max-w-[1340px] px-5 sm:px-6 md:px-12 lg:px-16 py-4">
          <Link href="/" className="shrink-0 inline-block">
            <img src="/logo_navix.svg" alt="Navix" className="h-5 w-auto sm:h-6" />
          </Link>
        </nav>
        <div className="mx-auto max-w-[1240px] px-5 sm:px-6 md:px-12 lg:px-16 pt-20 pb-16">
          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-full bg-secondary-50 border border-secondary-300 flex items-center justify-center mb-4"
            >
              <Search className="size-6 text-primary-btn" />
            </motion.div>
            <h2 className="text-h5 font-bold text-primary-900 mb-2">Still discovering...</h2>
            <p className="text-body-2 text-alpha-60 mb-2 max-w-md">
              Our scrapers are searching Instagram, TikTok & YouTube for competitors in your niche.
            </p>
            <p className="text-caption-1 text-alpha-30">This page will update automatically.</p>
          </div>
        </div>
      </main>
    )
  }

  // Error
  if (pageState === 'error') {
    return (
      <main className="min-h-screen bg-white">
        <nav className="mx-auto max-w-[1340px] px-5 sm:px-6 md:px-12 lg:px-16 py-4">
          <Link href="/" className="shrink-0 inline-block">
            <img src="/logo_navix.svg" alt="Navix" className="h-5 w-auto sm:h-6" />
          </Link>
        </nav>
        <div className="mx-auto max-w-[1240px] px-5 sm:px-6 md:px-12 lg:px-16 pt-20 pb-16">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-h5 font-bold text-primary-900 mb-2">Something went wrong</h2>
            <p className="text-body-2 text-alpha-60 mb-6 max-w-md">
              We couldn't load your competitor results.
            </p>
            <button
              type="button"
              onClick={() => { setPageState('loading'); fetchCompetitors() }}
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
      <nav className="mx-auto max-w-[1340px] px-5 sm:px-6 md:px-12 lg:px-16 py-4">
        <Link href="/" className="shrink-0 inline-block">
          <img src="/logo_navix.svg" alt="Navix" className="h-5 w-auto sm:h-6" />
        </Link>
      </nav>

      <ProgressBar percent={100} />

      <div className="mx-auto max-w-[1240px] px-5 sm:px-6 md:px-12 lg:px-16 pt-4 sm:pt-8 pb-16">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-h5 sm:text-h4 lg:text-h3 font-bold text-primary-btn mb-2">
            We found your real competitors.
          </h1>
          <p className="text-body-2 sm:text-body-1 text-alpha-60 max-w-[640px]">
            These accounts are targeting your exact audience. Track the ones you want to watch.
          </p>
        </motion.div>

        {/* Content */}
        <div className="flex flex-col gap-6">
          {/* Competitor list */}
          <div className="flex-1 max-w-[740px]">
            <div className="flex items-end justify-between gap-4 mb-4">
              <ValidationProgress
                validated={validatedCount}
                total={competitors.length}
                celebrate={celebrateAt3}
                className="flex-1"
              />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-caption-1 font-medium text-alpha-60 border border-alpha-10 hover:border-primary-900 hover:text-primary-900 hover:bg-alpha-5 transition-all duration-150 shrink-0"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Add manually</span>
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {visibleCompetitors.map((competitor, i) => (
                  <CompetitorCard
                    key={competitor.id}
                    competitor={competitor}
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
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <Link
                  href="/dashboard"
                  className="flex w-full sm:w-auto sm:inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-6 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
                >
                  Go to Dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* Market brief sidebar — disabled for now
          <div className="hidden lg:block w-[380px] shrink-0">
            <div className="sticky top-8">
              <MarketBriefSidebar
                validatedCount={trackedIds.size}
                requiredCount={REQUIRED_VALIDATIONS}
                isUnlocked={isUnlocked}
              />
            </div>
          </div>

          <div className="lg:hidden">
            <MarketBriefSidebar
              validatedCount={trackedIds.size}
              requiredCount={REQUIRED_VALIDATIONS}
              isUnlocked={isUnlocked}
            />
          </div>
          */}
        </div>
      </div>
    </main>
  )
}
