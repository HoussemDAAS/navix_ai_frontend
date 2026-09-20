'use client'

import { motion } from 'framer-motion'
import { Dna, Hash, PenLine, CalendarCheck, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CaptionInsight } from '@/lib/creator-score'

interface ContentDnaIslandProps {
  hashtags: Array<{ tag: string; count: number }>
  caption: CaptionInsight | null
  bestDay: string | null
  dominantFormat: string | null
}

/** Reads the caption experiment as a plain sentence, never a fake multiplier. */
function captionLine(insight: CaptionInsight): string {
  const winnerAvg = insight.winner === 'long' ? insight.longAvg : insight.shortAvg
  const loserAvg = insight.winner === 'long' ? insight.shortAvg : insight.longAvg
  if (loserAvg <= 0) return `Only your ${insight.winner} captions earn engagement at all.`
  const multiple = winnerAvg / loserAvg
  if (multiple < 1.05) return 'Caption length barely moves your engagement.'
  return `Your ${insight.winner} captions earn ${multiple.toFixed(1)}× more engagement`
}

function Fact({ Icon, text }: { Icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[8px] bg-alpha-5">
        <Icon className="size-3.5 text-alpha-60" />
      </span>
      <span className="text-caption-1 text-primary-900">{text}</span>
    </li>
  )
}

/** What the account's own posts say about it: its tags and its recurring habits. */
export function ContentDnaIsland({
  hashtags,
  caption,
  bestDay,
  dominantFormat,
}: ContentDnaIslandProps) {
  const facts: Array<{ key: string; Icon: LucideIcon; text: string }> = []
  if (caption) facts.push({ key: 'caption', Icon: PenLine, text: captionLine(caption) })
  if (bestDay)
    facts.push({
      key: 'day',
      Icon: CalendarCheck,
      text: `Your audience responds best on ${bestDay}`,
    })
  if (dominantFormat)
    facts.push({
      key: 'format',
      Icon: Layers,
      text: `Most of what you publish is ${dominantFormat}`,
    })

  if (hashtags.length === 0 && facts.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className="rounded-[20px] border border-alpha-10 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Dna className="size-4 text-alpha-60" />
        <h2 className="text-body-2 font-bold text-primary-900">Content DNA</h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-caption-2 font-semibold uppercase tracking-wide text-alpha-60">
            <Hash className="size-3.5" />
            Hashtags you live on
          </p>
          {hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((h) => (
                <span
                  key={h.tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-alpha-10 bg-alpha-5 px-3 py-1 text-caption-1 text-primary-900"
                >
                  #{h.tag}
                  <span className="text-alpha-40 tabular-nums">×{h.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-caption-1 text-alpha-60">
              You barely use hashtags — the field averages several per post.
            </p>
          )}
        </div>

        {facts.length > 0 && (
          <ul className="space-y-3 lg:border-l lg:border-alpha-10 lg:pl-6">
            {facts.map((f) => (
              <Fact key={f.key} Icon={f.Icon} text={f.text} />
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
