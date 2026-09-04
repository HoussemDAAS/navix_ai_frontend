'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'
import { initialsOf } from './utils'
import type { Competitor } from '@/lib/api'

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
} as const

interface StackedAvatarProps {
  competitor: Competitor
  size: keyof typeof sizeClasses
  onDark: boolean
}

function StackedAvatar({ competitor, size, onDark }: StackedAvatarProps) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(competitor.avatar_url)
  const ring = onDark ? 'border-primary-900' : 'border-white'

  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`@${competitor.handle}`}
        title={`@${competitor.handle}`}
        onError={() => setBroken(true)}
        className={cn(sizeClasses[size], ring, 'rounded-full border-2 object-cover')}
      />
    )
  }

  return (
    <div
      title={`@${competitor.handle}`}
      className={cn(
        sizeClasses[size],
        ring,
        'flex items-center justify-center rounded-full border-2 bg-primary-100',
      )}
    >
      <span className="text-caption-2 font-bold text-primary-900">
        {initialsOf(competitor.full_name, competitor.handle)}
      </span>
    </div>
  )
}

interface CompetitorAvatarStackProps {
  competitors: Competitor[]
  size?: keyof typeof sizeClasses
  /** Draws the separating ring in the dark island colour instead of white. */
  onDark?: boolean
  className?: string
}

export function CompetitorAvatarStack({
  competitors,
  size = 'md',
  onDark = false,
  className,
}: CompetitorAvatarStackProps) {
  if (competitors.length === 0) return null

  return (
    <div className={cn('flex items-center', className)}>
      {competitors.map((competitor, index) => (
        <div key={competitor.id} className={cn(index > 0 && '-ml-2.5')}>
          <StackedAvatar competitor={competitor} size={size} onDark={onDark} />
        </div>
      ))}
    </div>
  )
}
