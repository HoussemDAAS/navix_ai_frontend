'use client'

import { Instagram, Youtube, Facebook } from 'lucide-react'
import { TikTokIcon } from '@/components/settings/platform-icons'
import { platformLabel } from '@/components/profile/utils'

/** Platform pill (icon + name) used in profile heroes. */
export function PlatformBadge({ platform }: { platform: string | null }) {
  const key = (platform ?? '').toLowerCase()
  const icon =
    key === 'instagram' ? <Instagram className="size-3.5" /> :
    key === 'tiktok' ? <TikTokIcon className="size-3.5" /> :
    key === 'youtube' ? <Youtube className="size-3.5" /> :
    key === 'facebook' ? <Facebook className="size-3.5" /> :
    null

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-alpha-5 border border-alpha-10 px-2.5 py-1 text-caption-2 font-medium text-primary-900">
      {icon}
      {platformLabel(platform)}
    </span>
  )
}
