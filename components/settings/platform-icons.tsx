'use client'

import { Instagram, Youtube, Facebook } from 'lucide-react'
import type { SocialPlatform } from '@/lib/social-links'

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.27 8.27 0 0 0 4.85 1.56V6.64a4.84 4.84 0 0 1-1.09.05Z" />
    </svg>
  )
}

export const PLATFORM_ICON: Record<SocialPlatform, React.ReactNode> = {
  instagram: <Instagram className="size-4" />,
  tiktok: <TikTokIcon className="size-4" />,
  youtube: <Youtube className="size-4" />,
  facebook: <Facebook className="size-4" />,
}

/** Branded tint for each platform's icon chip. Tokens only. */
export const PLATFORM_CHIP: Record<SocialPlatform, string> = {
  instagram: 'bg-destructive-50 border-destructive-200 text-destructive-500',
  tiktok: 'bg-alpha-5 border-alpha-10 text-primary-900',
  youtube: 'bg-destructive-50 border-destructive-200 text-destructive-600',
  facebook: 'bg-info-50 border-info-200 text-info-500',
}

export const PLATFORM_PLACEHOLDER: Record<SocialPlatform, string> = {
  instagram: 'username',
  tiktok: 'username',
  youtube: 'channel',
  facebook: 'page',
}
