'use client'

import type { AccountAnalytics } from '@/lib/api'
import { fmtCount, fmtPercent } from '@/components/profile/utils'

export interface ProfileStat {
  label: string
  value: string
  hint?: string
}

/** The six headline numbers shown under every profile hero. */
export function buildProfileStats(stats: AccountAnalytics): ProfileStat[] {
  return [
    { label: 'Followers', value: fmtCount(stats.followers_count) },
    { label: 'Posts analyzed', value: String(stats.posts) },
    { label: 'Avg likes', value: fmtCount(stats.avg_likes) },
    { label: 'Avg views', value: fmtCount(stats.avg_views) },
    { label: 'Engagement', value: fmtPercent(stats.engagement_rate), hint: 'per view' },
    {
      label: 'Posts / week',
      value: stats.posts_per_week != null ? String(stats.posts_per_week) : '—',
    },
  ]
}

export function ProfileStats({ stats }: { stats: ProfileStat[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-[14px] border border-alpha-10 bg-white p-3.5">
          <p className="text-caption-2 font-medium text-alpha-60 uppercase tracking-wide">
            {s.label}
          </p>
          <p className="text-h6 font-bold text-primary-900 mt-1 tabular-nums">{s.value}</p>
          {s.hint && <p className="text-caption-2 text-alpha-40 mt-0.5">{s.hint}</p>}
        </div>
      ))}
    </div>
  )
}
