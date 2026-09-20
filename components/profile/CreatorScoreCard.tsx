'use client'

import { motion } from 'framer-motion'
import { Gauge } from 'lucide-react'
import type { CreatorScore } from '@/lib/creator-score'
import { ScoreGauge } from '@/components/profile/ScoreGauge'
import { ScorePillarRow } from '@/components/profile/ScorePillarRow'

interface CreatorScoreCardProps {
  score: CreatorScore
  /** How many scraped posts the score was computed from. */
  postCount: number
}

/**
 * The flagship island: a transparent, math-only read of the account.
 * Earns the signature border because it is the page's centerpiece.
 */
export function CreatorScoreCard({ score, postCount }: CreatorScoreCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04, duration: 0.4 }}
      className="rounded-[20px] border border-primary-900 bg-white p-5 shadow-signature sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Gauge className="size-4 text-alpha-60" />
        <h2 className="text-body-2 font-bold text-primary-900">Navix Creator Score</h2>
      </div>
      <p className="mt-1 text-caption-1 text-alpha-60">
        Computed live from your {postCount} scraped posts and your field — no AI, just math.
      </p>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        <ScoreGauge total={score.total} grade={score.grade} />
        <div className="w-full min-w-0 flex-1 space-y-3.5">
          {score.pillars.map((pillar, index) => (
            <ScorePillarRow key={pillar.key} pillar={pillar} index={index} />
          ))}
        </div>
      </div>
    </motion.section>
  )
}
