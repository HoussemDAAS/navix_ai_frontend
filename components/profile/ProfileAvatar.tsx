'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'

interface ProfileAvatarProps {
  url: string | null
  handle: string
  initials: string
  /** Tailwind sizing classes, e.g. "h-24 w-24" */
  sizeClassName?: string
  textClassName?: string
  className?: string
}

/**
 * Account avatar routed through the image proxy, with an initials circle
 * fallback — Instagram/TikTok CDN links expire and 404 without warning.
 */
export function ProfileAvatar({
  url,
  handle,
  initials,
  sizeClassName = 'h-24 w-24',
  textClassName = 'text-h6',
  className,
}: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(url)

  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={handle}
        onError={() => setBroken(true)}
        className={cn(
          sizeClassName,
          'shrink-0 rounded-full object-cover border-2 border-white shadow-card',
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        sizeClassName,
        'shrink-0 rounded-full bg-primary-100 border-2 border-white shadow-card flex items-center justify-center',
        className,
      )}
    >
      <span className={cn('font-bold text-primary-900', textClassName)}>{initials}</span>
    </div>
  )
}
