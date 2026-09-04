'use client'

import { motion } from 'framer-motion'
import { Layers, CalendarDays } from 'lucide-react'
import { DistributionBars, DayColumns } from '@/components/analysis/charts'

interface PatternsRowProps {
  formatMix: Array<{ format: string; count: number }>
  postingDays: Array<{ day: string; count: number }>
}

/** Content mix + posting rhythm, computed from the account's scraped posts. */
export function PatternsRow({ formatMix, postingDays }: PatternsRowProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="size-4 text-alpha-60" />
          <h2 className="text-body-2 font-bold text-primary-900">Content mix</h2>
        </div>
        {formatMix.length > 0 ? (
          <DistributionBars items={formatMix.map((m) => ({ label: m.format, count: m.count }))} />
        ) : (
          <p className="text-caption-1 text-alpha-50">No formats detected yet.</p>
        )}
      </div>

      <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="size-4 text-alpha-60" />
          <h2 className="text-body-2 font-bold text-primary-900">Posting days</h2>
        </div>
        {postingDays.length > 0 ? (
          <DayColumns days={postingDays} />
        ) : (
          <p className="text-caption-1 text-alpha-50 mt-3">Not enough dated posts yet.</p>
        )}
      </div>
    </motion.section>
  )
}
