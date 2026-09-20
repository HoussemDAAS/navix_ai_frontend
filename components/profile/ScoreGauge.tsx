'use client'

import { motion } from 'framer-motion'

/**
 * Radial 0–100 gauge for the Navix Creator Score.
 * Track in alpha-10, progress arc in secondary-600, swept in on mount.
 */

const SIZE = 160
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

interface ScoreGaugeProps {
  total: number
  grade: string
}

export function ScoreGauge({ total, grade }: ScoreGaugeProps) {
  const filled = Math.max(0, Math.min(100, total)) / 100

  return (
    <div className="relative size-[150px] shrink-0">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeWidth={STROKE}
          className="fill-none stroke-alpha-10"
        />
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          className="fill-none stroke-secondary-600"
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - filled) }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-h3 font-bold text-primary-900 leading-none">{grade}</span>
        <span className="mt-2 text-caption-1 font-medium text-alpha-60 tabular-nums">
          {total}/100
        </span>
      </div>

      <span className="sr-only">
        Navix Creator Score: {total} out of 100, grade {grade}.
      </span>
    </div>
  )
}
