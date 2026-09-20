'use client'

import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import type { ScorePillar } from '@/lib/creator-score'

interface ScorePillarRowProps {
  pillar: ScorePillar
  /** Position in the list — only used to stagger the bar animation. */
  index: number
}

/** One pillar of the Creator Score: label, weight, bar, value and a hint when it drags. */
export function ScorePillarRow({ pillar, index }: ScorePillarRowProps) {
  const width = Math.max(0, Math.min(100, Math.round(pillar.score)))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-caption-1 font-semibold text-primary-900">{pillar.label}</span>
          <span className="shrink-0 rounded-full border border-alpha-10 bg-alpha-5 px-2 py-0.5 text-caption-2 font-medium text-alpha-60 tabular-nums">
            {pillar.weight} pts
          </span>
        </div>
        <span className="text-caption-1 text-primary-900 tabular-nums">{pillar.display}</span>
      </div>

      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-alpha-5">
        <motion.div
          className="h-full rounded-full bg-secondary-600"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 + index * 0.07 }}
        />
      </div>

      {pillar.hint && (
        <p className="mt-1.5 flex items-start gap-1.5 rounded-[8px] bg-warning-50 px-2 py-1 text-caption-2 text-warning-700">
          <Lightbulb className="size-3 mt-0.5 shrink-0" />
          <span>{pillar.hint}</span>
        </p>
      )}
    </div>
  )
}
