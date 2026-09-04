'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Instagram, Youtube, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { avatarSrc } from '@/lib/avatar'
import type { MappedCompetitor } from '@/app/projects/[id]/competitors/page'

/** Avatar with initials fallback (external CDN links expire) */
function CompetitorAvatar({ competitor }: { competitor: MappedCompetitor }) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(competitor.avatarUrl)
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={competitor.handle}
        onError={() => setBroken(true)}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <div
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-caption-1 sm:text-body-2 font-bold shrink-0"
      style={{ backgroundColor: competitor.color }}
    >
      {competitor.initials}
    </div>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.27 8.27 0 0 0 4.85 1.56V6.64a4.84 4.84 0 0 1-1.09.05Z" />
    </svg>
  )
}

const platformIcons: Record<MappedCompetitor['platform'], React.ReactNode> = {
  Instagram: <Instagram className="size-3.5" />,
  TikTok: <TikTokIcon className="size-3.5" />,
  YouTube: <Youtube className="size-3.5" />,
}

function getConfidenceBadge(score: number) {
  if (score >= 70) return { label: `${score}% match`, classes: 'bg-success-100 text-success-600' }
  if (score >= 40) return { label: `${score}% match`, classes: 'bg-warning-100 text-warning-600' }
  return { label: `${score}% match`, classes: 'bg-destructive-100 text-destructive-500' }
}

function formatFollowers(count: number | null): string | null {
  if (!count) return null
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

interface CompetitorCardProps {
  competitor: MappedCompetitor
  projectId: string
  index: number
  isTracked: boolean
  isDismissed: boolean
  onTrack: (id: string) => void
  onDismiss: (id: string) => void
}

export function CompetitorCard({
  competitor,
  projectId,
  index,
  isTracked,
  isDismissed,
  onTrack,
  onDismiss,
}: CompetitorCardProps) {
  const confidence = getConfidenceBadge(competitor.confidenceScore)
  const isEven = index % 2 === 0
  const followers = formatFollowers(competitor.followersCount)

  if (isDismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'border border-black rounded-[28px] sm:rounded-[40px] shadow-signature overflow-hidden transition-colors',
        isEven ? 'bg-primary-50' : 'bg-secondary-200',
        isTracked && 'ring-2 ring-secondary-300 ring-offset-2',
      )}
    >
      <div className="p-4 sm:p-6">
        {/* Avatar + identity open the full profile dossier */}
        <Link
          href={`/projects/${projectId}/competitors/${competitor.id}`}
          className="group flex items-start gap-3 sm:gap-4"
        >
          <CompetitorAvatar competitor={competitor} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-body-2 sm:text-body-1 font-semibold text-primary-900 truncate group-hover:underline underline-offset-2">
                {competitor.handle}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-alpha-10 text-caption-2 font-medium text-primary-900">
                {platformIcons[competitor.platform]}
                {competitor.platform}
              </span>
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-caption-2 font-medium', confidence.classes)}>
                {confidence.label}
              </span>
              {competitor.isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-300 border border-primary-900 text-caption-2 font-semibold text-primary-900">
                  New
                </span>
              )}
            </div>

            {/* Stats + tags */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {followers && (
                <Badge variant="outline" size="sm">{followers} followers</Badge>
              )}
              {competitor.dominantFormat !== 'Mixed' && (
                <Badge variant="outline" size="sm">{competitor.dominantFormat}</Badge>
              )}
              {competitor.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
              ))}
            </div>

            {/* Bio or inclusion reason */}
            <p className="text-caption-1 text-alpha-60 mt-2 leading-relaxed line-clamp-2">
              {competitor.biography || competitor.inclusionReason}
            </p>
          </div>

          {/* View profile affordance */}
          <span className="hidden sm:flex items-center gap-1 shrink-0 self-center text-caption-2 font-medium text-alpha-40 group-hover:text-primary-900 transition-colors">
            <span className="hidden lg:inline">View profile</span>
            <ChevronRight className="size-4" />
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 ml-0 sm:ml-14">
          <button
            type="button"
            onClick={() => onTrack(competitor.id)}
            disabled={isTracked}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-caption-1 font-medium transition-all duration-150 border',
              isTracked
                ? 'bg-secondary-300 text-primary-900 border-primary-900 cursor-default'
                : 'bg-white border-alpha-10 text-primary-900 hover:border-primary-900 hover:bg-secondary-50',
            )}
          >
            <Check className="size-3.5" strokeWidth={2.5} />
            {isTracked ? 'Tracking' : 'Add to tracking'}
          </button>
          <button
            type="button"
            onClick={() => onDismiss(competitor.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-caption-1 font-medium transition-all duration-150 border border-alpha-10 text-alpha-60 hover:border-destructive-300 hover:text-destructive-500 hover:bg-destructive-50"
          >
            <X className="size-3.5" strokeWidth={2.5} />
            Not relevant
          </button>
        </div>
      </div>
    </motion.div>
  )
}
