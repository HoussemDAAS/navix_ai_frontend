'use client'

import { motion } from 'framer-motion'
import { ExternalLink, BadgeCheck } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { PlatformBadge } from '@/components/profile/PlatformBadge'
import { initialsOf, profileUrl } from '@/components/profile/utils'

interface ProfileHeroProps {
  handle: string
  fullName: string | null
  platform: string | null
  avatarUrl: string | null
  biography: string | null
  /** 0–100 relevance score (competitor pages only) */
  matchScore?: number | null
  inclusionReason?: string | null
  tracked?: boolean
  /** Lime CTA rendered when the account is not tracked yet */
  action?: React.ReactNode
  /** Shown under the badges, e.g. right after a successful track */
  note?: string | null
}

export function ProfileHero({
  handle,
  fullName,
  platform,
  avatarUrl,
  biography,
  matchScore,
  inclusionReason,
  tracked = false,
  action,
  note,
}: ProfileHeroProps) {
  const clean = handle.replace(/^@/, '')
  const href = profileUrl(clean, platform)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
        <ProfileAvatar url={avatarUrl} handle={clean} initials={initialsOf(clean, fullName)} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 min-w-0"
              >
                <h1 className="text-h5 sm:text-h4 font-bold text-primary-900 truncate group-hover:underline underline-offset-4">
                  @{clean}
                </h1>
                <ExternalLink className="size-4 shrink-0 text-alpha-40 group-hover:text-primary-900 transition-colors" />
              </a>
            ) : (
              <h1 className="text-h5 sm:text-h4 font-bold text-primary-900 truncate">@{clean}</h1>
            )}

            <PlatformBadge platform={platform} />

            {matchScore != null && (
              <span className="inline-flex items-center rounded-full bg-success-50 border border-success-200 px-2.5 py-1 text-caption-2 font-semibold text-success-700 tabular-nums">
                {Math.round(matchScore)}% match
              </span>
            )}

            {tracked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-300 border border-primary-900 px-2.5 py-1 text-caption-2 font-semibold text-primary-900">
                <BadgeCheck className="size-3.5" />
                Tracked
              </span>
            ) : (
              action
            )}
          </div>

          {fullName && <p className="mt-1.5 text-body-2 font-medium text-primary-900">{fullName}</p>}

          {biography && (
            <p className="mt-2 text-body-2 text-alpha-60 leading-relaxed whitespace-pre-line">
              {biography}
            </p>
          )}

          {inclusionReason && <p className="mt-2.5 text-caption-1 text-alpha-50">{inclusionReason}</p>}

          {note && (
            <p className="mt-3 rounded-[12px] border border-secondary-200 bg-secondary-50 px-3.5 py-2.5 text-caption-1 text-primary-900">
              {note}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  )
}
