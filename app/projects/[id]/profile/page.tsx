'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { BackLink } from '@/components/profile/BackLink'
import { ProfileHero } from '@/components/profile/ProfileHero'
import { FreshnessChip } from '@/components/profile/FreshnessChip'
import { ProfileStats, buildProfileStats } from '@/components/profile/ProfileStats'
import { CreatorScoreCard } from '@/components/profile/CreatorScoreCard'
import { HighlightsRow } from '@/components/profile/HighlightsRow'
import { MomentumSection } from '@/components/profile/MomentumSection'
import { ContentDnaIsland } from '@/components/profile/ContentDnaIsland'
import { AiReadIsland } from '@/components/profile/AiReadIsland'
import { InsightList } from '@/components/profile/InsightList'
import { IdeaCards } from '@/components/profile/IdeaCards'
import { PatternsRow } from '@/components/profile/PatternsRow'
import { PostsGrid } from '@/components/profile/PostsGrid'
import { EmptyPostsIsland } from '@/components/profile/EmptyPostsIsland'
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { ProfileErrorState } from '@/components/profile/ProfileErrorState'
import {
  getFieldAnalytics,
  getProject,
  getSelfProfile,
  refreshProjectData,
  type FieldAnalytics,
  type SelfProfileData,
} from '@/lib/api'
import {
  bestPost,
  bestPostingDay,
  captionInsight,
  computeCreatorScore,
  daysSinceLastPost,
  monthlyMomentum,
  mostDiscussedPost,
  topOwnHashtags,
} from '@/lib/creator-score'

type PageState = 'loading' | 'ready' | 'error'

export default function SelfProfilePage() {
  const params = useParams()
  const projectId = params.id as string

  const [state, setState] = useState<PageState>('loading')
  const [data, setData] = useState<SelfProfileData | null>(null)
  const [field, setField] = useState<FieldAnalytics | null>(null)
  const [loadError, setLoadError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    setLoadError('')
    try {
      // The field read only sharpens the score's comparison — never block the page on it.
      const [res, fieldRes] = await Promise.all([
        getSelfProfile(projectId),
        getFieldAnalytics(projectId).catch(() => ({ data: null })),
      ])
      setData(res.data)
      setField(fieldRes.data)
      setState('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Something went wrong.')
      setState('error')
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const handleRefreshInsight = useCallback(async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      const res = await getSelfProfile(projectId, true)
      setData(res.data)
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Could not refresh the AI read.')
    } finally {
      setRefreshing(false)
    }
  }, [projectId])

  const insight = data?.insight ?? null
  const posts = useMemo(() => data?.posts ?? [], [data])

  const score = useMemo(
    () => (data ? computeCreatorScore(data.stats, posts, field) : null),
    [data, posts, field],
  )
  const momentum = useMemo(() => monthlyMomentum(posts), [posts])
  const highlights = useMemo(
    () => ({
      best: bestPost(posts),
      discussed: mostDiscussedPost(posts),
      days: daysSinceLastPost(posts),
    }),
    [posts],
  )
  const dna = useMemo(
    () => ({
      hashtags: topOwnHashtags(posts),
      caption: captionInsight(posts),
      bestDay: bestPostingDay(posts),
    }),
    [posts],
  )

  return (
    <DashboardShell>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        <BackLink href={`/projects/${projectId}`} label="Project" />

        {state === 'loading' && <ProfileSkeleton />}

        {state === 'error' && (
          <ProfileErrorState
            title="Couldn’t load your profile"
            message={loadError || 'We couldn’t reach your account data right now.'}
            onRetry={load}
          />
        )}

        {state === 'ready' && data && (
          <div className="space-y-6">
            <ProfileHero
              handle={data.stats.handle}
              fullName={data.profile.entity_name ?? data.profile.full_name}
              platform={data.stats.platform}
              avatarUrl={data.stats.avatar_url ?? data.profile.avatar_url}
              biography={data.profile.biography}
              tracked
              freshness={
                <FreshnessChip
                  lastScrapedAt={data.profile.last_scraped_at}
                  onRefresh={() => refreshProjectData(projectId).then((r) => r.data)}
                  poll={() => getProject(projectId).then((r) => r.data.last_scraped_at)}
                  onRefreshed={load}
                />
              }
            />

            <ProfileStats stats={buildProfileStats(data.stats)} />

            {score && <CreatorScoreCard score={score} postCount={posts.length} />}

            <HighlightsRow
              best={highlights.best}
              discussed={highlights.discussed}
              daysSinceLastPost={highlights.days}
            />

            {momentum.length >= 3 && <MomentumSection buckets={momentum} />}

            {posts.length > 0 && (
              <ContentDnaIsland
                hashtags={dna.hashtags}
                caption={dna.caption}
                bestDay={dna.bestDay}
                dominantFormat={data.stats.dominant_format}
              />
            )}

            <AiReadIsland
              status={data.insight_status}
              hasInsight={insight !== null}
              error={data.insight_error}
              generatedAt={data.insight_generated_at}
              noDataMessage="Scrape your account first — Navix reads your own posts before it can judge your voice."
              onRefresh={handleRefreshInsight}
              refreshing={refreshing}
              refreshError={refreshError}
            >
              {insight && (
                <>
                  <p className="text-body-1 text-primary-900 leading-relaxed">{insight.summary}</p>
                  <div>
                    <p className="text-caption-1 font-semibold text-alpha-60 uppercase tracking-wide mb-2">
                      Your voice
                    </p>
                    <p className="rounded-[14px] border border-alpha-10 bg-white p-4 text-body-2 text-primary-900 leading-relaxed">
                      {insight.voice}
                    </p>
                  </div>
                  <InsightList title="What works" items={insight.what_works} />
                  <InsightList title="Gaps" items={insight.gaps} tone="caution" />
                  <IdeaCards title="Next moves" items={insight.next_moves} />
                </>
              )}
            </AiReadIsland>

            {data.posts.length > 0 ? (
              <>
                <PatternsRow formatMix={data.stats.format_mix} postingDays={data.posting_days} />
                <PostsGrid title="Your content" posts={data.posts} />
              </>
            ) : (
              <EmptyPostsIsland
                title="We haven’t read your posts yet"
                message="Connect and scrape your account so Navix can measure your own numbers, spot your voice, and compare you against the field."
                action={
                  <Link
                    href="/settings"
                    className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-5 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
                  >
                    Check your social accounts
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
