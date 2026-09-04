'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Hash, CalendarDays, Layers, Trophy, Heart, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'
import type { FieldAnalytics, AccountAnalytics, FieldTopPost } from '@/lib/api'
import { DistributionBars, DayColumns } from '@/components/analysis/charts'

/**
 * "The field, measured" — quantitative layer of the analysis page, computed
 * from real scraped posts. Chart colors are the validated pair: You =
 * secondary-600, Field = info-500; single-series charts use secondary-600.
 */

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

function pct(rate: number | null | undefined): string {
  if (rate == null) return '—'
  return `${(rate * 100).toFixed(1)}%`
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-alpha-10 bg-white p-4">
      <p className="text-caption-2 font-medium text-alpha-60 uppercase tracking-wide">{label}</p>
      <p className="text-h6 font-bold text-primary-900 mt-1">{value}</p>
      {hint && <p className="text-caption-2 text-alpha-40 mt-0.5">{hint}</p>}
    </div>
  )
}

/** Paired horizontal bars: You vs Field, direct-labeled. */
function ComparisonRow({
  label,
  you,
  field,
  format,
}: {
  label: string
  you: number | null
  field: number | null
  format: (v: number | null) => string
}) {
  const max = Math.max(you ?? 0, field ?? 0)
  const width = (v: number | null) => (max > 0 && v != null ? Math.max((v / max) * 100, 3) : 3)
  return (
    <div>
      <p className="text-caption-1 font-semibold text-primary-900 mb-1.5">{label}</p>
      <div className="space-y-1">
        {[
          { name: 'You', value: you, bar: 'bg-secondary-600' },
          { name: 'Field', value: field, bar: 'bg-info-500' },
        ].map((row) => (
          <div key={row.name} className="flex items-center gap-2">
            <span className="w-9 text-caption-2 text-alpha-60 shrink-0">{row.name}</span>
            <div className="flex-1 h-4 flex items-center">
              <div
                className={cn('h-2.5 rounded-[4px]', row.bar)}
                style={{ width: `${width(row.value)}%` }}
              />
              <span className="ml-2 text-caption-2 font-medium text-primary-900 whitespace-nowrap">
                {format(row.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function verdictText(data: FieldAnalytics): string | null {
  const { engagement_vs_field: er, cadence_vs_field: cad } = data.comparison
  if (er == null && cad == null) return null
  const parts: string[] = []
  if (er != null) {
    if (er >= 1.15) parts.push(`your posts out-engage the field (${er.toFixed(1)}×)`)
    else if (er <= 0.85) parts.push(`your engagement runs at ${Math.round(er * 100)}% of the field's`)
    else parts.push('your engagement is on par with the field')
  }
  if (cad != null && cad < 0.7) {
    const times = cad > 0 ? (1 / cad).toFixed(0) : null
    parts.push(times ? `but the field posts ~${times}× more often than you` : 'but the field posts far more often')
  } else if (cad != null && cad > 1.3) {
    parts.push('and you post more often than the field')
  }
  if (parts.length === 0) return null
  const s = parts.join(', ')
  return s.charAt(0).toUpperCase() + s.slice(1) + '.'
}

function AccountRow({ account, maxEngagement, isSelf }: { account: AccountAnalytics; maxEngagement: number; isSelf?: boolean }) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(account.avatar_url)
  const er = account.engagement_rate
  return (
    <tr className={cn('border-b border-alpha-10 last:border-0', isSelf && 'bg-secondary-50')}>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {src && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={account.handle} onError={() => setBroken(true)} className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-caption-2 font-bold text-primary-900 shrink-0">
              {account.handle.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-caption-1 font-medium text-primary-900 truncate">
            {isSelf ? 'You' : `@${account.handle}`}
          </span>
          {account.tracked && !isSelf && (
            <span className="rounded-full bg-secondary-300 border border-primary-900 px-1.5 py-px text-caption-2 font-semibold text-primary-900 shrink-0">
              Tracked
            </span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-3 text-caption-1 text-primary-900 text-right">{account.posts}</td>
      <td className="py-2.5 px-3 text-caption-1 text-primary-900 text-right">{fmt(account.avg_likes)}</td>
      <td className="py-2.5 px-3 text-caption-1 text-primary-900 text-right">{fmt(account.avg_comments)}</td>
      <td className="py-2.5 px-3 text-caption-1 text-primary-900 text-right">{fmt(account.avg_views)}</td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2 justify-end">
          <div className="w-16 h-2 rounded-[4px] bg-alpha-5 overflow-hidden">
            <div
              className={cn('h-full rounded-[4px]', isSelf ? 'bg-secondary-600' : 'bg-info-500')}
              style={{ width: er != null && maxEngagement > 0 ? `${Math.max((er / maxEngagement) * 100, 3)}%` : '0%' }}
            />
          </div>
          <span className="text-caption-1 text-primary-900 w-12 text-right">{pct(er)}</span>
        </div>
      </td>
      <td className="py-2.5 px-3 text-caption-1 text-primary-900 text-right">{account.posts_per_week ?? '—'}</td>
      <td className="py-2.5 pl-3 text-caption-1 text-alpha-60 capitalize">{account.dominant_format ?? '—'}</td>
    </tr>
  )
}

function TopPostCard({ post, handle }: { post: FieldTopPost; handle: string }) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(post.thumbnail_url)
  const inner = (
    <div className="w-40 shrink-0 rounded-[14px] border border-alpha-10 bg-white overflow-hidden hover:border-alpha-30 transition-colors">
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setBroken(true)} className="w-40 h-40 object-cover" />
      ) : (
        <div className="w-40 h-40 bg-alpha-5 flex items-center justify-center">
          <Layers className="size-6 text-alpha-30" />
        </div>
      )}
      <div className="p-2.5">
        <p className="text-caption-2 font-semibold text-primary-900 truncate">@{handle}</p>
        <div className="flex items-center gap-2.5 mt-1 text-caption-2 text-alpha-60">
          <span className="inline-flex items-center gap-1"><Heart className="size-3" />{fmt(post.likes_count)}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" />{fmt(post.comments_count)}</span>
        </div>
      </div>
    </div>
  )
  return post.post_url ? (
    <a href={post.post_url} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : inner
}

export function FieldAnalyticsSection({ data }: { data: FieldAnalytics }) {
  const withContent = data.competitors.filter((c) => c.posts > 0)
  const rows: Array<{ account: AccountAnalytics; isSelf: boolean }> = [
    ...(data.self ? [{ account: data.self, isSelf: true }] : []),
    ...withContent.map((account) => ({ account, isSelf: false })),
  ]
  const maxEngagement = Math.max(...rows.map((r) => r.account.engagement_rate ?? 0), 0.0001)
  const topPosts = withContent
    .filter((c) => c.tracked)
    .flatMap((c) => c.top_posts.map((post) => ({ post, handle: c.handle })))
    .sort((a, b) => b.post.likes_count + b.post.comments_count - (a.post.likes_count + a.post.comments_count))
    .slice(0, 8)
  const verdict = verdictText(data)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5 mb-8"
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-[10px] bg-alpha-5 border border-alpha-10 flex items-center justify-center">
          <Database className="size-4 text-primary-900" />
        </div>
        <div>
          <h2 className="text-subheadline font-bold text-primary-900">The field, measured</h2>
          <p className="text-caption-2 text-alpha-50">
            Computed from {data.generated_from.posts} scraped posts across {data.generated_from.competitors_with_content} accounts
            {data.generated_from.self_posts > 0 ? ` — plus ${data.generated_from.self_posts} of yours` : ''}. Live data, no AI.
          </p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Posts analyzed" value={String(data.generated_from.posts)} />
        <StatTile label="Accounts" value={String(data.generated_from.competitors_with_content)} />
        <StatTile label="Field engagement" value={pct(data.field.avg_engagement_rate)} hint="likes + comments per view" />
        <StatTile label="Field cadence" value={data.field.posts_per_week != null ? `${data.field.posts_per_week}/wk` : '—'} hint="posts per week, per account" />
      </div>

      {/* You vs field */}
      {data.self && (
        <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h3 className="text-body-2 font-bold text-primary-900">You vs the field</h3>
            <div className="flex items-center gap-3 text-caption-2 text-alpha-60">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-secondary-600" />You</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-info-500" />Field</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ComparisonRow
              label="Engagement per view"
              you={data.self.engagement_rate}
              field={data.field.avg_engagement_rate}
              format={pct}
            />
            <ComparisonRow
              label="Posts per week"
              you={data.self.posts_per_week}
              field={data.field.posts_per_week}
              format={(v) => (v != null ? String(v) : '—')}
            />
          </div>
          {verdict && (
            <p className="mt-4 rounded-[12px] bg-secondary-50 border border-secondary-200 px-4 py-3 text-caption-1 text-primary-900">
              {verdict}
            </p>
          )}
        </div>
      )}

      {/* Format mix + posting days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="size-4 text-alpha-60" />
            <h3 className="text-body-2 font-bold text-primary-900">What the field posts</h3>
          </div>
          <DistributionBars
            items={data.field.format_mix.map((m) => ({
              label: m.format,
              count: m.count,
              hint: `${Math.round(m.share * 100)}%`,
            }))}
          />
        </div>
        <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="size-4 text-alpha-60" />
            <h3 className="text-body-2 font-bold text-primary-900">When the field posts</h3>
          </div>
          {data.field.posting_days.length > 0 ? (
            <DayColumns days={data.field.posting_days} />
          ) : (
            <p className="text-caption-1 text-alpha-50 mt-3">Not enough dated posts yet.</p>
          )}
        </div>
      </div>

      {/* Hashtags */}
      {data.field.top_hashtags.length > 0 && (
        <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="size-4 text-alpha-60" />
            <h3 className="text-body-2 font-bold text-primary-900">Hashtags the field lives on</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.field.top_hashtags.map((h) => (
              <span key={h.tag} className="inline-flex items-center gap-1.5 rounded-full bg-alpha-5 border border-alpha-10 px-3 py-1 text-caption-1 text-primary-900">
                #{h.tag}
                <span className="text-caption-2 text-alpha-40">×{h.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Benchmark table */}
      {rows.length > 0 && (
        <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
          <h3 className="text-body-2 font-bold text-primary-900 mb-3">Account benchmark</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-alpha-10 text-caption-2 text-alpha-50 uppercase tracking-wide">
                  <th className="py-2 pr-3 font-medium">Account</th>
                  <th className="py-2 px-3 font-medium text-right">Posts</th>
                  <th className="py-2 px-3 font-medium text-right">Avg likes</th>
                  <th className="py-2 px-3 font-medium text-right">Avg comments</th>
                  <th className="py-2 px-3 font-medium text-right">Avg views</th>
                  <th className="py-2 px-3 font-medium text-right">Engagement</th>
                  <th className="py-2 px-3 font-medium text-right">Posts/wk</th>
                  <th className="py-2 pl-3 font-medium">Top format</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ account, isSelf }) => (
                  <AccountRow key={isSelf ? 'self' : (account.id ?? account.handle)} account={account} maxEngagement={maxEngagement} isSelf={isSelf} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top posts */}
      {topPosts.length > 0 && (
        <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-4 text-alpha-60" />
            <h3 className="text-body-2 font-bold text-primary-900">Top posts in your field</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {topPosts.map(({ post, handle }, i) => (
              <TopPostCard key={`${handle}-${i}`} post={post} handle={handle} />
            ))}
          </div>
        </div>
      )}
    </motion.section>
  )
}
