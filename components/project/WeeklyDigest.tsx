'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  ExternalLink,
  Flame,
  ImageOff,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { AiMark } from '@/components/ui/ai-mark'
import { formatCount } from '@/components/dashboard/utils'
import { avatarSrc } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import { getWeeklyDigest, type DigestPost, type WeeklyDigest as Digest } from '@/lib/api'

const DAY_MS = 24 * 3600 * 1000

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600_000) return 'just now'
  if (diff < DAY_MS) return `${Math.round(diff / 3600_000)} h ago`
  return `${Math.round(diff / DAY_MS)} d ago`
}

function ratioLabel(ratio: number | null, whose: string): string | null {
  if (ratio == null) return null
  return `×${ratio.toFixed(1)} ${whose} usual`
}

/** Signed change chip: green up, red down, muted flat, or "no baseline yet". */
function Delta({ value, suffix = '', digits = 0 }: { value: number | null; suffix?: string; digits?: number }) {
  if (value == null) return <span className="text-caption-2 text-alpha-40">no baseline yet</span>
  const up = value > 0
  const flat = value === 0
  const Icon = up ? TrendingUp : flat ? Minus : TrendingDown
  const text = digits ? Math.abs(value).toFixed(digits) : Math.abs(value).toLocaleString()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption-2 font-semibold',
        up ? 'bg-success-50 text-success-700' : flat ? 'bg-alpha-5 text-alpha-60' : 'bg-destructive-50 text-destructive-500',
      )}
    >
      <Icon className="size-3" />
      {up ? '+' : flat ? '' : '−'}
      {text}
      {suffix}
    </span>
  )
}

function Thumb({ url, alt }: { url: string | null; alt: string }) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(url)
  if (!src || broken) {
    return (
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-alpha-10 bg-alpha-5 text-alpha-40">
        <ImageOff className="size-4" />
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="size-12 shrink-0 rounded-[10px] border border-alpha-10 object-cover"
    />
  )
}

function PostRow({
  post,
  whose,
  handle,
}: {
  post: DigestPost
  whose: 'your' | 'their'
  handle?: string
}) {
  const ratio = ratioLabel(post.vs_avg, whose)
  const body = (
    <div className="flex items-start gap-3">
      <Thumb url={post.thumbnail_url} alt={post.caption ?? 'post'} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {handle && <span className="text-caption-1 font-semibold text-primary-900">@{handle}</span>}
          {ratio && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-caption-2 font-semibold',
                (post.vs_avg ?? 0) >= 1 ? 'bg-secondary-300/40 text-primary-900' : 'bg-alpha-5 text-alpha-60',
              )}
            >
              {ratio}
            </span>
          )}
          {post.content_type && <span className="text-caption-2 text-alpha-40">{post.content_type.toLowerCase()}</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-caption-1 leading-relaxed text-primary-900">
          {post.caption || 'No caption'}
        </p>
        <p className="mt-1 text-caption-2 text-alpha-60">
          {formatCount(post.likes_count)} likes · {formatCount(post.comments_count)} comments
          {post.views_count > 0 && ` · ${formatCount(post.views_count)} views`}
          {post.published_at && ` · ${shortDate(post.published_at)}`}
        </p>
      </div>
      {post.post_url && <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-alpha-40" />}
    </div>
  )
  if (!post.post_url) return body
  return (
    <a href={post.post_url} target="_blank" rel="noreferrer" className="block rounded-[10px] transition-colors hover:bg-alpha-5/60">
      {body}
    </a>
  )
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-caption-1 font-semibold uppercase tracking-wide text-alpha-60">
      <Icon className="size-3.5" />
      {children}
    </p>
  )
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-[16px] border border-alpha-10 bg-white p-5 shadow-card', className)}>
      <div className="flex items-center gap-3">
        <div className="size-9 animate-pulse rounded-[10px] bg-alpha-5" />
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-alpha-5" />
          <div className="h-2.5 w-40 animate-pulse rounded bg-alpha-5" />
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[12px] bg-alpha-5" />
        ))}
      </div>
    </div>
  )
}

interface WeeklyDigestProps {
  projectId: string
  /** Bumped by the page when a data refresh lands */
  reloadKey?: number
  className?: string
}

/** "This week" on Home: what moved, the standout posts, the pipeline, and one idea to make next. */
export function WeeklyDigest({ projectId, reloadKey = 0, className }: WeeklyDigestProps) {
  const [digest, setDigest] = useState<Digest | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true)
      else setState('loading')
      try {
        const res = await getWeeklyDigest(projectId, refresh)
        setDigest(res.data)
        setState('ready')
      } catch {
        setState((s) => (s === 'ready' ? s : 'error'))
      } finally {
        setRefreshing(false)
      }
    },
    [projectId],
  )

  useEffect(() => {
    load()
  }, [load, reloadKey])

  // Home must not depend on the digest: a failure just hides the card
  if (state === 'error') return null
  if (state === 'loading' || !digest) return <Skeleton className={className} />

  const { account, you, field, pipeline, ai, period } = digest
  const hasAnything = account.snapshots > 0 || you.posts > 0 || field.posts > 0
  if (!hasAnything) return null

  const studioHref = ai.idea
    ? `/projects/${projectId}/studio?prompt=${encodeURIComponent(ai.idea.studio_prompt)}`
    : `/projects/${projectId}/studio`

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('overflow-hidden rounded-[16px] border border-alpha-10 bg-white shadow-card', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-alpha-10 px-5 py-4">
        <div className="flex items-center gap-3">
          <AiMark size="md" />
          <div>
            <p className="text-body-2 font-semibold text-primary-900">This week</p>
            <p className="text-caption-2 text-alpha-60">
              {shortDate(period.from)} to {shortDate(period.to)} · from your data
              {ai.generated_at && ` · read ${timeAgo(ai.generated_at)}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          title="Re-read this week"
          className="inline-flex size-8 items-center justify-center rounded-[8px] border border-alpha-10 text-alpha-60 transition-colors hover:border-primary-900 hover:text-primary-900 disabled:opacity-50"
        >
          <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>

      {ai.headline && (
        <p className="px-5 pt-4 text-body-1 font-semibold leading-snug text-primary-900">{ai.headline}</p>
      )}

      {/* Numbers */}
      <div className="grid gap-3 px-5 pt-4 sm:grid-cols-3">
        <div className="rounded-[12px] border border-alpha-10 px-4 py-3">
          <p className="text-caption-2 font-semibold uppercase tracking-wide text-alpha-60">Followers</p>
          <p className="mt-1 text-h5 font-bold text-primary-900">{formatCount(account.followers_now)}</p>
          <div className="mt-1 flex items-center gap-2">
            <Delta value={account.followers_delta} />
            {account.since && account.followers_delta != null && (
              <span className="text-caption-2 text-alpha-40">since {shortDate(account.since)}</span>
            )}
          </div>
        </div>
        <div className="rounded-[12px] border border-alpha-10 px-4 py-3">
          <p className="text-caption-2 font-semibold uppercase tracking-wide text-alpha-60">Engagement</p>
          <p className="mt-1 text-h5 font-bold text-primary-900">
            {account.engagement_now != null ? `${account.engagement_now}%` : '—'}
          </p>
          <div className="mt-1">
            <Delta value={account.engagement_delta} suffix=" pts" digits={2} />
          </div>
        </div>
        <div className="rounded-[12px] border border-alpha-10 px-4 py-3">
          <p className="text-caption-2 font-semibold uppercase tracking-wide text-alpha-60">Your posting</p>
          <p className="mt-1 text-h5 font-bold text-primary-900">
            {you.window_days === 7 ? you.posts : 0}
            <span className="ml-1 text-caption-1 font-medium text-alpha-60">in 7 days</span>
          </p>
          <p
            className={cn(
              'mt-1 text-caption-2',
              you.days_since_last_post != null && you.days_since_last_post > 7 ? 'text-warning-600' : 'text-alpha-60',
            )}
          >
            {you.days_since_last_post == null
              ? 'No posts read yet'
              : you.days_since_last_post === 0
                ? 'Posted today'
                : `Last post ${you.days_since_last_post} d ago`}
            {field.posts > 0 && ` · field posted ${field.posts}× in ${field.window_days} d`}
          </p>
        </div>
      </div>

      {/* Standouts + idea */}
      <div className="grid gap-5 px-5 py-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <div>
            <SectionLabel icon={Trophy}>
              Your best post{you.window_days === 30 && you.best_post ? ' this month' : ''}
            </SectionLabel>
            {you.best_post ? (
              <PostRow post={you.best_post} whose="your" />
            ) : (
              <p className="text-caption-1 text-alpha-60">
                Nothing published in the last 30 days. The field kept moving: {field.posts} posts from{' '}
                {field.accounts_posted} accounts.
              </p>
            )}
          </div>
          <div>
            <SectionLabel icon={Flame}>
              Breakout in your field{field.breakout_window_days === 30 && field.breakout ? ' this month' : ''}
            </SectionLabel>
            {field.breakout ? (
              <>
                <PostRow post={field.breakout} whose="their" handle={field.breakout.handle} />
                {field.most_active && (
                  <p className="mt-2 text-caption-2 text-alpha-60">
                    {field.posts} posts from {field.accounts_posted} tracked accounts · @{field.most_active.handle} most
                    active ({field.most_active.posts})
                  </p>
                )}
              </>
            ) : (
              <p className="text-caption-1 text-alpha-60">No competitor post in the last 30 days.</p>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-[12px] border border-secondary-400 bg-secondary-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AiMark size="sm" />
              <p className="text-caption-1 font-semibold uppercase tracking-wide text-primary-900">Make this next</p>
            </div>
            {ai.idea ? (
              <>
                <p className="text-body-1 font-bold leading-snug text-primary-900">{ai.idea.title}</p>
                <p className="mt-1.5 text-caption-1 leading-relaxed text-alpha-60">{ai.idea.why}</p>
                {ai.idea.format && (
                  <span className="mt-2 inline-block rounded-full border border-primary-900/20 bg-white px-2 py-0.5 text-caption-2 font-medium text-primary-900">
                    {ai.idea.format}
                  </span>
                )}
              </>
            ) : (
              <p className="text-caption-1 leading-relaxed text-alpha-60">
                Navix is reading this week&apos;s data. Brainstorm in the Studio meanwhile. It already knows your
                voice and your field.
              </p>
            )}
            <Link
              href={studioHref}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-[12px] border border-primary-900 bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:translate-y-[2px] active:shadow-none"
            >
              {ai.idea ? 'Make it in Studio' : 'Open Studio'}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex items-start gap-2.5">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-alpha-60" />
            <div className="min-w-0">
              <p className="text-caption-1 font-semibold text-primary-900">
                {pipeline.scheduled > 0
                  ? `${pipeline.scheduled} scheduled this week`
                  : 'Nothing scheduled this week'}
              </p>
              <p className="text-caption-2 text-alpha-60">
                {pipeline.next &&
                  `Next: ${pipeline.next.title} · ${new Date(pipeline.next.scheduled_at).toLocaleString(undefined, {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
                {pipeline.next && pipeline.pending_review > 0 && ' · '}
                {pipeline.pending_review > 0 &&
                  `${pipeline.pending_review} draft${pipeline.pending_review > 1 ? 's' : ''} waiting for review`}
                {!pipeline.next && pipeline.pending_review === 0 && 'Approve a draft in the Library to plan it.'}
              </p>
              {pipeline.posted.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {pipeline.posted.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-caption-2 text-alpha-60">
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 font-semibold',
                          (p.vs_avg_interactions ?? 1) >= 1 ? 'bg-success-50 text-success-700' : 'bg-alpha-5 text-alpha-60',
                        )}
                      >
                        Posted{p.vs_avg_interactions != null && ` · ×${p.vs_avg_interactions.toFixed(1)}`}
                      </span>
                      <span className="truncate">{p.caption || 'Draft'}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/projects/${projectId}/library`}
                className="mt-1.5 inline-flex items-center gap-1 text-caption-2 font-medium text-primary-900 underline-offset-2 hover:underline"
              >
                Library
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
