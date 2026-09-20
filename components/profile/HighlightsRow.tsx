'use client'

import { motion } from 'framer-motion'
import { Trophy, MessagesSquare } from 'lucide-react'
import type { ProfilePost } from '@/lib/api'
import { HighlightPostCard } from '@/components/profile/HighlightPostCard'
import { LastPostedCard } from '@/components/profile/LastPostedCard'

interface HighlightsRowProps {
  best: ProfilePost | null
  /** Skipped when it is the same post as `best`. */
  discussed: ProfilePost | null
  daysSinceLastPost: number | null
}

/** Three quick reads of the account: its peak, its most-talked-about post, its silence. */
export function HighlightsRow({ best, discussed, daysSinceLastPost }: HighlightsRowProps) {
  const showDiscussed = discussed !== null && discussed.id !== best?.id

  if (!best && !showDiscussed && daysSinceLastPost === null) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      {best && <HighlightPostCard label="Best post" Icon={Trophy} post={best} />}
      {showDiscussed && discussed && (
        <HighlightPostCard label="Most discussed" Icon={MessagesSquare} post={discussed} />
      )}
      {daysSinceLastPost !== null && <LastPostedCard days={daysSinceLastPost} />}
    </motion.section>
  )
}
