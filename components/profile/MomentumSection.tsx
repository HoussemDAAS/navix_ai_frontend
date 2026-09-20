'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import type { MonthBucket } from '@/lib/creator-score'
import { MomentumColumns } from '@/components/profile/MomentumColumns'

/** Month-by-month engagement trend. Callers only render it with 3+ buckets. */
export function MomentumSection({ buckets }: { buckets: MonthBucket[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="rounded-[20px] border border-alpha-10 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-alpha-60" />
        <h2 className="text-body-2 font-bold text-primary-900">Momentum</h2>
      </div>
      <p className="mt-1 text-caption-1 text-alpha-60">Average likes per post, by month</p>
      <MomentumColumns buckets={buckets} />
    </motion.section>
  )
}
