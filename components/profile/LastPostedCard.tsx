'use client'

import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LastPostedCardProps {
  /** Whole days since the newest dated post. */
  days: number
}

function headline(days: number): string {
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

/** How long the account has been silent, with an honest nudge either way. */
export function LastPostedCard({ days }: LastPostedCardProps) {
  const nudge =
    days > 14
      ? { text: 'Your field posted all week — time to show up.', tone: 'warning' as const }
      : days <= 7
        ? { text: 'You’re active — keep the rhythm.', tone: 'success' as const }
        : null

  return (
    <article className="flex h-full flex-col rounded-[16px] border border-alpha-10 bg-white p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-caption-2 font-semibold uppercase tracking-wide text-alpha-60">
        <CalendarClock className="size-3.5" />
        Last posted
      </p>
      <p className="mt-1.5 text-h5 font-bold text-primary-900 tabular-nums">{headline(days)}</p>
      {nudge && (
        <p
          className={cn(
            'mt-2 rounded-[8px] px-2 py-1 text-caption-2',
            nudge.tone === 'warning'
              ? 'bg-warning-50 text-warning-700'
              : 'bg-success-50 text-success-700',
          )}
        >
          {nudge.text}
        </p>
      )}
    </article>
  )
}
