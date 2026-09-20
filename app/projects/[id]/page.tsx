'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Palette,
  BarChart3,
  Lightbulb,
  FileText,
  Calendar,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { useWorkspace } from '@/components/layout/WorkspaceContext'
import { ProjectHero } from '@/components/project/ProjectHero'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'
import {
  getProject,
  getCompetitors,
  getBrandKit,
  getDirections,
  getDrafts,
  getCalendar,
  getProjectInsights,
  getAnalysis,
  refreshProjectData,
  type Project,
  type Competitor,
  type BrandKit,
  type ContentDirection,
  type Draft,
  type CalendarItem,
  type ProjectInsights,
  type AnalysisBrief,
} from '@/lib/api'

interface PipelineStep {
  label: string
  href: (id: string) => string
  icon: React.ElementType
  status: 'completed' | 'current' | 'available'
}

interface QuickLink {
  label: string
  description: string
  href: (id: string) => string
  icon: React.ElementType
}

const quickLinks: QuickLink[] = [
  { label: 'Competitors', description: 'View and manage tracked competitors', href: (id) => `/projects/${id}/competitors`, icon: Users },
  { label: 'Brand Kit', description: 'Define your voice, tone, and identity', href: (id) => `/projects/${id}/brand-kit`, icon: Palette },
  { label: 'Analysis', description: 'Market insights and opportunity gaps', href: (id) => `/projects/${id}/analysis`, icon: BarChart3 },
  { label: 'Directions', description: 'Strategic content pillars for your brand', href: (id) => `/projects/${id}/directions`, icon: Lightbulb },
  { label: 'Drafts', description: 'Edit and refine your content', href: (id) => `/projects/${id}/drafts`, icon: FileText },
  { label: 'Calendar', description: 'Plan and export your editorial calendar', href: (id) => `/projects/${id}/calendar`, icon: Calendar },
]

function formatFollowers(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1_000)}K`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function initialsOf(handle: string, fullName: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('')
  }
  return handle.replace(/^@/, '').slice(0, 2).toUpperCase()
}

/** Avatar with image-proxy + initials fallback */
function CompetitorAvatar({
  competitor,
  size,
}: {
  competitor: Competitor
  size: 'lg' | 'md'
}) {
  const [broken, setBroken] = useState(false)
  const dim = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'
  const src = avatarSrc(competitor.avatar_url)
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={competitor.handle}
        onError={() => setBroken(true)}
        className={cn(dim, 'rounded-full object-cover border-2 border-white shadow-card')}
      />
    )
  }
  return (
    <div
      className={cn(
        dim,
        'rounded-full bg-primary-100 border-2 border-white shadow-card flex items-center justify-center',
      )}
    >
      <span className={cn('font-bold text-primary-900', size === 'lg' ? 'text-body-1' : 'text-body-2')}>
        {initialsOf(competitor.handle, competitor.full_name)}
      </span>
    </div>
  )
}

/** One podium card. rank is 1-based. */
function PodiumCard({
  competitor,
  rank,
  projectId,
}: {
  competitor: Competitor
  rank: number
  projectId: string
}) {
  const rankStyles = [
    'bg-secondary-300 text-primary-900 border-primary-900', // #1 — signature lime
    'bg-alpha-10 text-primary-900 border-alpha-30',         // #2 — silver
    'bg-warning-100 text-warning-700 border-warning-300',   // #3 — bronze
  ][rank - 1]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + rank * 0.08, duration: 0.4 }}
      className={cn(
        'relative rounded-[16px] border bg-white transition-all duration-200 hover:border-primary-900',
        rank === 1
          ? 'border-primary-900 shadow-signature sm:-translate-y-3'
          : 'border-alpha-10 shadow-card',
      )}
    >
      <span
        className={cn(
          'absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-caption-1 font-bold',
          rankStyles,
        )}
      >
        #{rank}
      </span>
      <Link
        href={`/projects/${projectId}/competitors/${competitor.id}`}
        className="group flex h-full flex-col items-center px-4 pb-5 pt-8 text-center"
      >
        <CompetitorAvatar competitor={competitor} size={rank === 1 ? 'lg' : 'md'} />
        <p className="mt-3 text-body-2 font-semibold text-primary-900 truncate max-w-full">
          @{competitor.handle}
        </p>
        <p className="text-caption-2 text-alpha-60 capitalize">
          {competitor.platform?.toLowerCase()} · {formatFollowers(competitor.followers_count)} followers
        </p>
        <span className="mt-2 inline-flex items-center rounded-full bg-success-50 border border-success-200 px-2.5 py-0.5 text-caption-2 font-semibold text-success-700">
          {Math.round(competitor.confidence_score)}% match
        </span>
        {competitor.inclusion_reason && (
          <p className="mt-2 text-caption-2 text-alpha-60 line-clamp-2">
            {competitor.inclusion_reason}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-caption-2 font-medium text-primary-900 underline-offset-2 group-hover:underline">
          View profile
          <ArrowRight className="size-3" />
        </span>
      </Link>
    </motion.div>
  )
}

function OverviewContent() {
  const params = useParams()
  const projectId = params.id as string
  const { profile, persona, singleBrand } = useWorkspace()

  const [project, setProject] = useState<Project | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null)
  const [directions, setDirections] = useState<ContentDirection[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [analysis, setAnalysis] = useState<AnalysisBrief | null>(null)
  const [loading, setLoading] = useState(true)
  // Bumped when a data refresh lands so the page re-reads everything
  const [reloadKey, setReloadKey] = useState(0)

  const [insights, setInsights] = useState<ProjectInsights | null>(null)
  const [insightsState, setInsightsState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, competitorsRes, brandKitRes, directionsRes, draftsRes, calendarRes, analysisRes] = await Promise.all([
          getProject(projectId),
          getCompetitors(projectId).catch(() => ({ data: [] as Competitor[] })),
          getBrandKit(projectId).catch(() => ({ data: null as BrandKit | null })),
          getDirections(projectId).catch(() => ({ data: [] as ContentDirection[] })),
          getDrafts(projectId).catch(() => ({ data: [] as Draft[] })),
          getCalendar(projectId).catch(() => ({ data: [] as CalendarItem[] })),
          getAnalysis(projectId).catch(() => ({ data: null as AnalysisBrief | null })),
        ])
        setProject(projectRes.data)
        setCompetitors(competitorsRes.data || [])
        setBrandKit(brandKitRes.data ?? null)
        setDirections(directionsRes.data ?? [])
        setDrafts(draftsRes.data ?? [])
        setCalendarItems(calendarRes.data ?? [])
        setAnalysis(analysisRes.data ?? null)
      } catch (err) {
        console.error('Failed to load project:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [projectId, reloadKey])

  const fetchInsights = useCallback(async (refresh = false) => {
    setInsightsState('loading')
    try {
      const res = await getProjectInsights(projectId, refresh)
      setInsights(res.data)
      setInsightsState('ready')
    } catch {
      setInsightsState('error')
    }
  }, [projectId])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center px-5">
          <h2 className="text-h5 font-bold text-primary-900">Project not found</h2>
          <p className="text-body-2 text-alpha-60">This project doesn&apos;t exist or you don&apos;t have access.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-5 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 active:translate-y-[2px]"
          >
            Back to Dashboard
          </Link>
        </div>
    )
  }

  const activeCompetitors = competitors.filter((c) => !c.rejected_by_user)
  const hasCompetitors = activeCompetitors.length > 0
  const hasBrandKit = Boolean(brandKit?.tone_of_voice || brandKit?.target_audience)
  const hasDirections = directions.length > 0
  const hasDrafts = drafts.length > 0
  const hasCalendar = calendarItems.length > 0
  const hasAnalysis = analysis !== null
  const briefTakeaways = analysis?.key_takeaways?.slice(0, 3) ?? []
  const briefOpportunity = analysis?.whitespace_opportunities?.[0] ?? null
  const firstName = (profile?.full_name || project.name).trim().split(/\s+/)[0] || 'there'

  // Podium: prefer the exact competitors the AI analyzed so the two sections agree
  const podium =
    insights?.top_competitors && insights.top_competitors.length > 0
      ? insights.top_competitors.slice(0, 3)
      : [...activeCompetitors]
          .sort((a, b) => {
            const t = Number(b.validated_by_user) - Number(a.validated_by_user)
            return t !== 0 ? t : b.confidence_score - a.confidence_score
          })
          .slice(0, 3)

  const completions = [hasCompetitors, hasBrandKit, hasAnalysis, hasDirections, hasDrafts, hasCalendar]
  const firstIncomplete = completions.findIndex((c) => !c)
  const stepConfigs: Array<{ label: string; href: (id: string) => string; icon: React.ElementType }> = [
    { label: 'Competitors', href: (id) => `/projects/${id}/competitors`, icon: Users },
    { label: 'Brand Kit', href: (id) => `/projects/${id}/brand-kit`, icon: Palette },
    { label: 'Analysis', href: (id) => `/projects/${id}/analysis`, icon: BarChart3 },
    { label: 'Directions', href: (id) => `/projects/${id}/directions`, icon: Lightbulb },
    { label: 'Drafts', href: (id) => `/projects/${id}/drafts`, icon: FileText },
    { label: 'Calendar', href: (id) => `/projects/${id}/calendar`, icon: Calendar },
  ]
  const pipelineSteps: PipelineStep[] = stepConfigs.map((cfg, i) => ({
    ...cfg,
    status: completions[i] ? 'completed' : i === firstIncomplete ? 'current' : 'available',
  }))

  return (
    <>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
        >
          {singleBrand ? (
            <>
              <h1 className="text-h5 sm:text-h4 font-bold text-primary-900">
                Welcome back, {firstName}
              </h1>
              <p className="mt-1.5 text-body-2 text-alpha-60">
                Here&apos;s where your brand stands today.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-h5 sm:text-h4 font-bold text-primary-900">{project.name}</h1>
              <p className="mt-1.5 text-body-2 text-alpha-60">Client overview</p>
            </>
          )}
        </motion.div>

        {/* The brand under analysis, as last scraped */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03, duration: 0.4 }}
          className="mb-6"
        >
          <ProjectHero
            project={project}
            persona={persona}
            freshness={{
              onRefresh: () => refreshProjectData(projectId).then((r) => r.data),
              poll: () => getProject(projectId).then((r) => r.data.last_scraped_at),
              onRefreshed: () => setReloadKey((k) => k + 1),
            }}
          />
        </motion.div>

        {/* Progress Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-[16px] border border-alpha-10 bg-white p-4 shadow-card overflow-x-auto">
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              {pipelineSteps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div key={step.label} className="flex items-center gap-2 sm:gap-3">
                    <Link
                      href={step.href(projectId)}
                      className={cn(
                        'flex items-center gap-2 rounded-[10px] px-3 py-2 text-caption-1 font-medium transition-all hover:shadow-sm',
                        step.status === 'completed' && 'bg-success-50 text-success-700 border border-success-200 hover:bg-success-100',
                        step.status === 'current' && 'bg-secondary-300/20 text-primary-900 border border-secondary-400 hover:bg-secondary-300/30',
                        step.status === 'available' && 'bg-white text-alpha-60 border border-alpha-10 hover:border-alpha-30 hover:text-primary-900',
                      )}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <StepIcon className="size-3.5" />
                      )}
                      <span className="hidden sm:inline">{step.label}</span>
                    </Link>
                    {index < pipelineSteps.length - 1 && (
                      <div className={cn(
                        'w-4 sm:w-6 h-px',
                        completions[index] ? 'bg-success-300' : 'bg-alpha-10',
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Top competitors podium */}
        {podium.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-subheadline font-semibold text-primary-900">
                  Your top competitors
                </h2>
                <p className="text-caption-1 text-alpha-60 mt-0.5">
                  Real accounts competing for your audience — found and ranked by Navix.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Link
                  href={`/projects/${projectId}/profile`}
                  className="inline-flex items-center gap-1 text-caption-1 font-medium text-primary-900 hover:underline underline-offset-2"
                >
                  Your profile
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href={`/projects/${projectId}/competitors`}
                  className="inline-flex items-center gap-1 text-caption-1 font-medium text-primary-900 hover:underline underline-offset-2"
                >
                  View all {activeCompetitors.length}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:pt-3">
              {/* Podium order on desktop: #2, #1 (center, raised), #3 */}
              {podium.length >= 3 ? (
                <>
                  <div className="sm:order-1 order-2"><PodiumCard competitor={podium[1]} rank={2} projectId={projectId} /></div>
                  <div className="sm:order-2 order-1"><PodiumCard competitor={podium[0]} rank={1} projectId={projectId} /></div>
                  <div className="order-3"><PodiumCard competitor={podium[2]} rank={3} projectId={projectId} /></div>
                </>
              ) : (
                podium.map((c, i) => (
                  <PodiumCard key={c.id} competitor={c} rank={i + 1} projectId={projectId} />
                ))
              )}
            </div>
          </motion.section>
        )}

        {/* AI intelligence widget */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-[16px] border border-alpha-10 bg-white shadow-card overflow-hidden">
            {/* Widget header */}
            <div className="flex items-center justify-between gap-3 border-b border-alpha-10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-secondary-300 border border-primary-900">
                  <Sparkles className="size-4 text-primary-900" />
                </div>
                <div>
                  <p className="text-body-2 font-semibold text-primary-900">Navix Intelligence</p>
                  <p className="text-caption-2 text-alpha-60">
                    AI read of your profile vs the field
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fetchInsights(true)}
                disabled={insightsState === 'loading'}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-alpha-10 px-3 py-1.5 text-caption-1 font-medium text-alpha-60 hover:border-primary-900 hover:text-primary-900 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn('size-3.5', insightsState === 'loading' && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Widget body */}
            <div className="px-5 py-5">
              {insightsState === 'loading' && (
                <div className="space-y-3">
                  <div className="h-5 w-3/4 rounded bg-alpha-10 animate-pulse" />
                  <div className="h-4 w-full rounded bg-alpha-5 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-alpha-5 animate-pulse" />
                  <p className="text-caption-1 text-alpha-60 pt-1">
                    Navix AI is reading your market...
                  </p>
                </div>
              )}

              {insightsState === 'error' && (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-body-2 text-alpha-60">
                    Couldn&apos;t generate insights right now.
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchInsights(true)}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-alpha-10 px-3.5 py-2 text-caption-1 font-medium text-primary-900 hover:border-primary-900 transition-all"
                  >
                    <RefreshCw className="size-3.5" />
                    Try again
                  </button>
                </div>
              )}

              {insightsState === 'ready' && insights && !insights.available && (
                <p className="text-body-2 text-alpha-60">
                  {insights.reason === 'no_ai_credits'
                    ? 'AI insights are paused — the OpenAI account has no credits. Add credits, then hit Refresh.'
                    : insights.reason === 'ai_error'
                      ? 'The AI read failed — hit Refresh to try again.'
                      : 'Track a few competitors first — Navix needs a field to compare you against.'}
                </p>
              )}

              {insightsState === 'ready' && insights?.available && (
                <div className="space-y-5">
                  <p className="text-subheadline font-semibold text-primary-900">
                    {insights.headline}
                  </p>

                  <div>
                    <p className="text-caption-1 font-semibold text-alpha-60 uppercase tracking-wide mb-1.5">
                      About you
                    </p>
                    <p className="text-body-2 text-primary-900 leading-relaxed">
                      {insights.profile_insight}
                    </p>
                  </div>

                  {(insights.competitor_insights?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-caption-1 font-semibold text-alpha-60 uppercase tracking-wide mb-2">
                        The accounts that matter
                      </p>
                      <div className="space-y-2.5">
                        {insights.competitor_insights!.map((ci, i) => (
                          <div key={ci.handle} className="flex items-start gap-3">
                            <span className={cn(
                              'mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border px-1.5 text-caption-2 font-bold',
                              i === 0 && 'bg-secondary-300 text-primary-900 border-primary-900',
                              i === 1 && 'bg-alpha-10 text-primary-900 border-alpha-30',
                              i >= 2 && 'bg-warning-100 text-warning-700 border-warning-300',
                            )}>
                              #{i + 1}
                            </span>
                            <p className="text-body-2 text-primary-900 leading-relaxed">
                              <span className="font-semibold">@{ci.handle}</span>{' '}
                              <span className="text-alpha-60">—</span> {ci.insight}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insights.opportunity && (
                    <div className="rounded-[12px] border border-secondary-400 bg-secondary-50 px-4 py-3.5">
                      <div className="flex items-start gap-2.5">
                        <Lightbulb className="size-4 text-primary-900 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-caption-1 font-semibold text-primary-900 mb-0.5">
                            Your opening
                          </p>
                          <p className="text-body-2 text-primary-900 leading-relaxed">
                            {insights.opportunity}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                    {insights.thin_data ? (
                      <p className="text-caption-2 text-alpha-60">
                        Based on limited scraped data — track more competitors to sharpen this read.
                      </p>
                    ) : <span />}
                    <Link
                      href={`/projects/${projectId}/analysis`}
                      className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] shrink-0"
                    >
                      {hasAnalysis ? 'Open market analysis' : 'Run full market analysis'}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Market brief — what the full analysis found */}
        {analysis && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="mb-8"
          >
            <div className="rounded-[16px] border border-alpha-10 bg-white shadow-card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-alpha-10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-alpha-5 border border-alpha-10">
                    <BarChart3 className="size-4 text-primary-900" />
                  </div>
                  <div>
                    <p className="text-body-2 font-semibold text-primary-900">Market brief</p>
                    <p className="text-caption-2 text-alpha-60">
                      {analysis.generated_at
                        ? `Analyzed ${new Date(analysis.generated_at).toLocaleDateString()}`
                        : 'From your latest market analysis'}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/projects/${projectId}/analysis`}
                  className="inline-flex items-center gap-1 text-caption-1 font-medium text-primary-900 hover:underline underline-offset-2 shrink-0"
                >
                  Full analysis
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 px-5 py-5">
                <div className="lg:col-span-3">
                  <p className="text-caption-1 font-semibold text-alpha-60 uppercase tracking-wide mb-2">
                    Key takeaways
                  </p>
                  {briefTakeaways.length > 0 ? (
                    <ul className="space-y-2">
                      {briefTakeaways.map((t, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-300/30 text-caption-2 font-bold text-primary-900">
                            {i + 1}
                          </span>
                          <span className="text-body-2 text-primary-900 leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-body-2 text-alpha-60">
                      {analysis.dominant_formats.length} formats, {analysis.winning_hooks.length} hooks and{' '}
                      {analysis.whitespace_opportunities.length} opportunities identified.
                    </p>
                  )}
                </div>
                <div className="lg:col-span-2 space-y-4">
                  {briefOpportunity && (
                    <div className="rounded-[12px] border border-secondary-400 bg-secondary-50 px-4 py-3.5">
                      <p className="text-caption-1 font-semibold text-primary-900 mb-0.5">
                        Biggest gap: {briefOpportunity.area}
                      </p>
                      <p className="text-caption-1 text-alpha-60 leading-relaxed">{briefOpportunity.reasoning}</p>
                    </div>
                  )}
                  {analysis.content_cadence && (
                    <div className="flex items-start gap-2.5">
                      <Calendar className="size-4 text-alpha-60 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-caption-1 font-semibold text-primary-900">Cadence in your market</p>
                        <p className="text-caption-1 text-alpha-60">{analysis.content_cadence}</p>
                      </div>
                    </div>
                  )}
                  {!hasDirections && (
                    <Link
                      href={`/projects/${projectId}/directions`}
                      className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
                    >
                      Generate content directions
                      <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="text-subheadline font-semibold text-primary-900 mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const LinkIcon = link.icon
              return (
                <Link key={link.label} href={link.href(projectId)}>
                  <div className="rounded-[12px] border border-alpha-10 bg-white p-4 shadow-card hover:border-secondary-400 hover:shadow-sm transition-all duration-200 group h-full">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-alpha-5 group-hover:bg-secondary-300/20 transition-colors">
                        <LinkIcon className="size-4 text-alpha-60 group-hover:text-primary-900 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-caption-1 font-semibold text-primary-900">{link.label}</p>
                        <p className="text-caption-2 text-alpha-60 mt-0.5">{link.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default function ProjectOverviewPage() {
  return (
    <DashboardShell>
      <OverviewContent />
    </DashboardShell>
  )
}
