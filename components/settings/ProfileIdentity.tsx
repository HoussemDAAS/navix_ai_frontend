'use client'

import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'

/** 1234 → "1.2K", 2_500_000 → "2.5M" */
export function formatCount(value: number | null): string | null {
  if (value === null || value < 0) return null
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return `${parts[0][0]}${parts[1]?.[0] ?? ''}`.toUpperCase()
}

interface ProfileIdentityProps {
  avatarUrl: string | null
  name: string
  followersCount: number | null
  followingCount: number | null
  postsCount: number | null
  isVerified: boolean
  className?: string
}

/**
 * 80px avatar with the scraped audience stats underneath.
 * External CDN avatar links expire, so we fall back to initials.
 */
export function ProfileIdentity({
  avatarUrl,
  name,
  followersCount,
  followingCount,
  postsCount,
  isVerified,
  className,
}: ProfileIdentityProps) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(avatarUrl)

  const stats: { label: string; value: string }[] = [
    { label: 'Followers', value: formatCount(followersCount) ?? '' },
    { label: 'Following', value: formatCount(followingCount) ?? '' },
    { label: 'Posts', value: formatCount(postsCount) ?? '' },
  ].filter((s) => s.value !== '')

  return (
    <div className={cn('flex flex-col items-center gap-3 sm:items-start', className)}>
      <div className="relative">
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name || 'Profile avatar'}
            onError={() => setBroken(true)}
            className="size-20 rounded-full border border-alpha-10 object-cover"
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full border border-primary-900 bg-secondary-300 text-h6 font-bold text-primary-900">
            {initialsOf(name)}
          </span>
        )}
        {isVerified && (
          <span
            title="Verified account"
            className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-white"
          >
            <BadgeCheck className="size-5 text-info-500" />
          </span>
        )}
      </div>

      {stats.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <span className="block text-body-2 font-semibold text-primary-900">
                {stat.value}
              </span>
              <span className="block text-caption-2 text-alpha-60">{stat.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="max-w-[160px] text-center text-caption-2 text-alpha-40 sm:text-left">
          Stats appear once we scrape your account.
        </p>
      )}
    </div>
  )
}
