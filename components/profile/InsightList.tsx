'use client'

import { cn } from '@/lib/utils'

type InsightTone = 'positive' | 'caution'

interface InsightListProps {
  title: string
  items: string[]
  tone?: InsightTone
  className?: string
}

const markerStyles: Record<InsightTone, string> = {
  positive: 'bg-secondary-300 text-primary-900 border-primary-900',
  caution: 'bg-warning-100 text-warning-700 border-warning-300',
}

/** Numbered bullet list used for "What works", "Weaknesses", "Gaps". */
export function InsightList({ title, items, tone = 'positive', className }: InsightListProps) {
  if (items.length === 0) return null

  return (
    <div className={className}>
      <p className="text-caption-1 font-semibold text-alpha-60 uppercase tracking-wide mb-2">
        {title}
      </p>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={`${title}-${i}`} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-caption-2 font-bold tabular-nums',
                markerStyles[tone],
              )}
            >
              {i + 1}
            </span>
            <span className="text-body-2 text-primary-900 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
