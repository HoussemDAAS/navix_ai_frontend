'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { MonthBucket } from '@/lib/creator-score'
import { fmtCount } from '@/components/profile/utils'

/**
 * Column chart of average likes per month — same hover/label conventions as
 * the analysis DayColumns, kept local so the shared chart file stays untouched.
 */
export function MomentumColumns({ buckets }: { buckets: MonthBucket[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const max = Math.max(...buckets.map((b) => b.avgLikes), 1)
  const best = buckets.reduce((a, b) => (b.avgLikes > a.avgLikes ? b : a), buckets[0])

  return (
    <div className="overflow-x-auto">
      <div className="flex h-36 min-w-[300px] items-end gap-2 pt-8">
        {buckets.map((b) => {
          const active = hovered === b.label
          return (
            <div
              key={b.label}
              className="relative flex h-full min-w-[34px] flex-1 flex-col items-center justify-end gap-1.5"
              onMouseEnter={() => setHovered(b.label)}
              onMouseLeave={() => setHovered(null)}
            >
              {active ? (
                <span className="absolute -top-2 z-10 whitespace-nowrap rounded-[8px] border border-alpha-10 bg-white px-2 py-1 text-caption-2 font-medium text-primary-900 tabular-nums shadow-dropdown">
                  {fmtCount(b.avgLikes)} likes · {b.posts} {b.posts === 1 ? 'post' : 'posts'}
                </span>
              ) : (
                b.label === best.label && (
                  <span className="absolute -top-1 text-caption-2 font-semibold text-primary-900 tabular-nums">
                    {fmtCount(b.avgLikes)}
                  </span>
                )
              )}
              <div
                className={cn(
                  'w-full max-w-10 rounded-t-[4px] transition-colors',
                  active ? 'bg-secondary-700' : 'bg-secondary-600',
                )}
                style={{ height: `${Math.max((b.avgLikes / max) * 100, 4)}%` }}
              />
              <span className="whitespace-nowrap text-caption-2 text-alpha-60">{b.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
