'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Small dependency-free charts used across analysis and profile pages.
 * Colors follow the validated chart palette: single-series = secondary-600.
 */

/** Single-series horizontal bars (one hue), labeled per bar. */
export function DistributionBars({ items }: { items: Array<{ label: string; count: number; hint?: string }> }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-3">
          <span className="w-20 text-caption-1 text-primary-900 capitalize truncate shrink-0">{i.label}</span>
          <div className="flex-1 h-4 flex items-center">
            <div
              className="h-2.5 rounded-[4px] bg-secondary-600"
              style={{ width: `${Math.max((i.count / max) * 100, 2)}%` }}
            />
            <span className="ml-2 text-caption-2 font-medium text-primary-900 whitespace-nowrap">
              {i.count}
              {i.hint ? <span className="text-alpha-40"> · {i.hint}</span> : null}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Column chart for posting days: every column carries its count above the bar, the busiest day stands out. */
export function DayColumns({ days }: { days: Array<{ day: string; count: number }> }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const max = Math.max(...days.map((d) => d.count), 1)
  const total = days.reduce((sum, d) => sum + d.count, 0)
  const busiest = days.reduce((a, b) => (b.count > a.count ? b : a), days[0])
  return (
    <div className="pt-2">
      <div className="flex items-end gap-2">
        {days.map((d) => {
          const isBusiest = d.day === busiest.day
          const active = hovered === d.day
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center gap-1 min-w-0"
              onMouseEnter={() => setHovered(d.day)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className={cn(
                  'text-caption-2 tabular-nums leading-none',
                  isBusiest || active ? 'font-semibold text-primary-900' : 'text-alpha-50',
                )}
              >
                {d.count}
              </span>
              <div className="w-full h-20 flex items-end justify-center">
                <div
                  className={cn(
                    'w-full max-w-8 rounded-t-[4px] transition-colors',
                    active ? 'bg-secondary-700' : isBusiest ? 'bg-secondary-600' : 'bg-secondary-500',
                  )}
                  style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
                />
              </div>
              <span className={cn('text-caption-2', isBusiest ? 'font-semibold text-primary-900' : 'text-alpha-60')}>{d.day}</span>
            </div>
          )
        })}
      </div>
      {total > 0 && (
        <p className="mt-3 text-caption-2 text-alpha-60">
          Busiest day: <span className="font-semibold text-primary-900">{busiest.day}</span> with {busiest.count} posts, {Math.round((busiest.count / total) * 100)}% of the week.
        </p>
      )}
    </div>
  )
}
