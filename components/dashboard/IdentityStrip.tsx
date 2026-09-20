'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Instagram, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'
import { formatCount, initialsOf } from './utils'
import type { Profile, ProfilePersona } from '@/lib/api'

const personaLabels: Record<ProfilePersona, string> = {
  ecommerce: 'E-commerce brand',
  agency: 'Agency',
  creator: 'Creator',
}

interface IdentityStripProps {
  profile: Profile
  /** When set, the strip links to the full creator profile dossier */
  profileHref?: string
  className?: string
}

export function IdentityStrip({ profile, profileHref, className }: IdentityStripProps) {
  const [broken, setBroken] = useState(false)

  const displayName = profile.entity_name || profile.full_name
  const src = avatarSrc(profile.avatar_url || profile.entity_logo_url)
  const stats = [
    profile.followers_count != null && { label: 'Followers', value: profile.followers_count },
    profile.posts_count != null && { label: 'Posts', value: profile.posts_count },
  ].filter((s): s is { label: string; value: number } => Boolean(s))

  return (
    <div
      className={cn(
        'rounded-[20px] border border-alpha-10 bg-gradient-header p-4 shadow-card sm:p-5',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
          {src && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={displayName || 'Your avatar'}
              onError={() => setBroken(true)}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-card sm:h-16 sm:w-16"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary-100 shadow-card sm:h-16 sm:w-16">
              <span className="text-body-1 font-bold text-primary-900">
                {initialsOf(displayName, profile.instagram_handle || 'Navix')}
              </span>
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-body-1 font-bold text-primary-900 sm:text-subheadline">
                {displayName || 'Your brand'}
              </p>
              {profile.is_verified && (
                <BadgeCheck className="size-4 shrink-0 text-info-500" aria-label="Verified" />
              )}
            </div>

            {profile.instagram_handle && (
              <p className="mt-0.5 flex items-center gap-1 text-caption-1 text-alpha-60">
                <Instagram className="size-3.5 shrink-0" />
                <span className="truncate">@{profile.instagram_handle}</span>
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {profile.persona && (
                <span className="inline-flex items-center rounded-full border border-primary-900 bg-secondary-300 px-2.5 py-0.5 text-caption-2 font-semibold text-primary-900">
                  {personaLabels[profile.persona]}
                </span>
              )}
              {profile.niche && (
                <span className="inline-flex items-center gap-1 rounded-full border border-alpha-10 bg-white/70 px-2.5 py-0.5 text-caption-2 font-medium text-alpha-60">
                  <Target className="size-3 shrink-0" />
                  <span className="truncate max-w-[160px]">{profile.niche}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-alpha-10 pt-3 sm:gap-6 sm:border-t-0 sm:pt-0">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-h6 font-bold leading-none text-primary-900">
                {formatCount(stat.value)}
              </p>
              <p className="mt-1 text-caption-2 text-alpha-60">{stat.label}</p>
            </div>
          ))}
          {profileHref && (
            <Link
              href={profileHref}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-primary-900 bg-white px-3.5 py-2 text-caption-1 font-semibold text-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-50 hover:shadow-[0px_3px_0px_0px_#191a23] active:translate-y-[2px] active:shadow-none"
            >
              Full profile
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
