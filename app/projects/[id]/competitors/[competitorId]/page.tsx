'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { LimeButton } from '@/components/onboarding/LimeButton'
import { BackLink } from '@/components/profile/BackLink'
import { ProfileHero } from '@/components/profile/ProfileHero'
import { FreshnessChip } from '@/components/profile/FreshnessChip'
import { refreshCompetitorData } from '@/lib/api'
import { ProfileStats, buildProfileStats } from '@/components/profile/ProfileStats'
import { AiReadIsland } from '@/components/profile/AiReadIsland'
import { InsightList } from '@/components/profile/InsightList'
import { ThreatMeter } from '@/components/profile/ThreatMeter'
import { IdeaCards } from '@/components/profile/IdeaCards'
import { PatternsRow } from '@/components/profile/PatternsRow'
import { PostsGrid } from '@/components/profile/PostsGrid'
import { EmptyPostsIsland } from '@/components/profile/EmptyPostsIsland'
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { ProfileErrorState } from '@/components/profile/ProfileErrorState'
import { getCompetitorProfile, updateCompetitor, type CompetitorProfile } from '@/lib/api'

const SCRAPE_NOTE = 'We’re scraping their content now — numbers appear in a few minutes.'

type PageState = 'loading' | 'ready' | 'error'

export default function CompetitorProfilePage() {
  const params = useParams()
  const projectId = params.id as string
  const competitorId = params.competitorId as string

  const [state, setState] = useState<PageState>('loading')
  const [data, setData] = useState<CompetitorProfile | null>(null)
  const [loadError, setLoadError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [tracking, setTracking] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)
  const [justTracked, setJustTracked] = useState(false)

  const load = useCallback(async () => {
    setState('loading')
    setLoadError('')
    try {
      const res = await getCompetitorProfile(projectId, competitorId)
      setData(res.data)
      setState('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Something went wrong.')
      setState('error')
    }
  }, [projectId, competitorId])

  useEffect(() => {
    load()
  }, [load])

  const handleRefreshInsight = useCallback(async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      const res = await getCompetitorProfile(projectId, competitorId, true)
      setData(res.data)
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Could not refresh the AI read.')
    } finally {
      setRefreshing(false)
    }
  }, [projectId, competitorId])

  const handleTrack = useCallback(async () => {
    setTracking(true)
    setTrackError(null)
    try {
      await updateCompetitor(projectId, competitorId, { validatedByUser: true })
      setData((prev) =>
        prev
          ? {
              ...prev,
              competitor: { ...prev.competitor, validated_by_user: true },
              stats: { ...prev.stats, tracked: true },
            }
          : prev,
      )
      setJustTracked(true)
    } catch (err) {
      setTrackError(err instanceof Error ? err.message : 'Could not track this account.')
    } finally {
      setTracking(false)
    }
  }, [projectId, competitorId])

  const trackCta = (
    <LimeButton size="md" onClick={handleTrack} loading={tracking}>
      <Plus className="size-4" />
      Track this account
    </LimeButton>
  )

  const insight = data?.insight ?? null
  const tracked = Boolean(data?.competitor.validated_by_user || data?.stats.tracked)

  return (
    <DashboardShell>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        <BackLink href={`/projects/${projectId}/competitors`} label="Competitors" />

        {state === 'loading' && <ProfileSkeleton />}

        {state === 'error' && (
          <ProfileErrorState
            title="Couldn’t load this profile"
            message={loadError || 'This competitor may have been removed from your project.'}
            onRetry={load}
          />
        )}

        {state === 'ready' && data && (
          <div className="space-y-6">
            <ProfileHero
              handle={data.competitor.handle}
              fullName={data.competitor.full_name}
              platform={data.competitor.platform}
              avatarUrl={data.stats.avatar_url ?? data.competitor.avatar_url}
              biography={data.competitor.biography}
              matchScore={data.competitor.confidence_score}
              inclusionReason={data.competitor.inclusion_reason}
              tracked={tracked}
              action={trackCta}
              note={justTracked ? SCRAPE_NOTE : null}
              freshness={
                <FreshnessChip
                  lastScrapedAt={data.competitor.last_scraped_at ?? null}
                  onRefresh={() => refreshCompetitorData(projectId, competitorId).then((r) => r.data)}
                  poll={() =>
                    getCompetitorProfile(projectId, competitorId).then(
                      (r) => r.data.competitor.last_scraped_at ?? null,
                    )
                  }
                  onRefreshed={load}
                />
              }
            />

            {trackError && (
              <p className="rounded-[12px] border border-destructive-200 bg-destructive-50 px-4 py-3 text-caption-1 text-destructive-600">
                {trackError}
              </p>
            )}

            <ProfileStats stats={buildProfileStats(data.stats)} />

            <AiReadIsland
              status={data.insight_status}
              hasInsight={insight !== null}
              error={data.insight_error}
              generatedAt={data.insight_generated_at}
              noDataMessage="Track & scrape this account to unlock the AI read."
              onRefresh={handleRefreshInsight}
              refreshing={refreshing}
              refreshError={refreshError}
            >
              {insight && (
                <>
                  <p className="text-body-1 text-primary-900 leading-relaxed">{insight.summary}</p>
                  <InsightList title="What works" items={insight.what_works} />
                  <InsightList title="Weaknesses" items={insight.weaknesses} tone="caution" />
                  <ThreatMeter level={insight.threat.level} reason={insight.threat.reason} />
                  <IdeaCards title="Steal these" items={insight.steal} />
                </>
              )}
            </AiReadIsland>

            {data.posts.length > 0 ? (
              <>
                <PatternsRow
                  formatMix={data.stats.format_mix}
                  postingDays={data.posting_days}
                />
                <PostsGrid title="Their content" posts={data.posts} />
              </>
            ) : (
              <EmptyPostsIsland
                title="No content scraped yet"
                message={
                  tracked
                    ? 'This account is tracked — we’re pulling their posts now. Their content, numbers and patterns appear here within a few minutes.'
                    : 'Track this account and Navix will scrape their recent posts, then show every caption, format and engagement number right here.'
                }
                action={tracked ? undefined : trackCta}
              />
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
