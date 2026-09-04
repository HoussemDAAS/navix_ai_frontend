'use client'

import { Instagram, Youtube } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube'

interface SocialHandleInputProps {
  platform: SocialPlatform
  value: string
  onChange: (value: string) => void
  optional?: boolean
  className?: string
}

const meta: Record<
  SocialPlatform,
  { label: string; placeholder: string; iconBg: string; iconColor: string }
> = {
  instagram: {
    label: 'Instagram',
    placeholder: '@username',
    iconBg: 'bg-pink-50 border-pink-200',
    iconColor: 'text-pink-600',
  },
  tiktok: {
    label: 'TikTok',
    placeholder: '@username',
    iconBg: 'bg-alpha-5 border-alpha-10',
    iconColor: 'text-primary-900',
  },
  youtube: {
    label: 'YouTube',
    placeholder: '@channel',
    iconBg: 'bg-destructive-50 border-destructive-200',
    iconColor: 'text-destructive-600',
  },
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.27 8.27 0 0 0 4.85 1.56V6.64a4.84 4.84 0 0 1-1.09.05Z" />
    </svg>
  )
}

const icons: Record<SocialPlatform, React.ReactNode> = {
  instagram: <Instagram className="size-4" />,
  tiktok: <TikTokIcon className="size-4" />,
  youtube: <Youtube className="size-4" />,
}

/**
 * Single-line social handle input with branded icon prefix.
 *
 * Strips a leading "@" from display but keeps the user's typed value as-is so
 * the form stays controlled. Use one per platform.
 */
export function SocialHandleInput({
  platform,
  value,
  onChange,
  optional = true,
  className,
}: SocialHandleInputProps) {
  const m = meta[platform]
  const Icon = icons[platform]

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="flex items-center justify-between text-caption-1 font-semibold text-primary-900">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-[7px] border',
              m.iconBg,
              m.iconColor,
            )}
          >
            {Icon}
          </span>
          {m.label}
        </span>
        {optional && (
          <span className="text-caption-2 font-normal text-alpha-40">Optional</span>
        )}
      </label>
      <div
        className={cn(
          'flex items-center w-full h-12 rounded-[12px] bg-white border border-alpha-10 shadow-card pl-3 pr-4 gap-2 transition-shadow',
          'hover:border-alpha-20',
          'focus-within:border-transparent focus-within:shadow-[0px_0px_0px_3px] focus-within:shadow-ring',
        )}
      >
        <span className="text-alpha-40 text-body-2 font-medium select-none">@</span>
        <input
          type="text"
          value={value.replace(/^@/, '')}
          onChange={(e) => onChange(e.target.value.replace(/^@/, '').trim())}
          placeholder={m.placeholder.replace(/^@/, '')}
          className="flex-1 min-w-0 bg-transparent outline-none text-body-2 font-medium text-primary-900 placeholder:text-alpha-40"
        />
      </div>
    </div>
  )
}
