'use client'

import { cn } from '@/lib/utils'
import { PLATFORM_LABEL, type SocialPlatform } from '@/lib/social-links'
import { PLATFORM_CHIP, PLATFORM_ICON, PLATFORM_PLACEHOLDER } from './platform-icons'

interface SocialAccountRowProps {
  platform: SocialPlatform
  value: string
  onChange: (value: string) => void
  /** Flashes the row after a pasted link fills it in */
  highlighted?: boolean
  className?: string
}

/** One connected-account row: platform chip + editable @handle. */
export function SocialAccountRow({
  platform,
  value,
  onChange,
  highlighted = false,
  className,
}: SocialAccountRowProps) {
  const inputId = `social-${platform}`

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-[12px] border p-3 transition-colors sm:flex-row sm:items-center sm:gap-3',
        highlighted ? 'border-secondary-400 bg-secondary-50' : 'border-alpha-10 bg-alpha-5/40',
        className,
      )}
    >
      <label
        htmlFor={inputId}
        className="flex shrink-0 items-center gap-2 sm:w-[128px]"
      >
        <span
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-[8px] border',
            PLATFORM_CHIP[platform],
          )}
        >
          {PLATFORM_ICON[platform]}
        </span>
        <span className="text-caption-1 font-semibold text-primary-900">
          {PLATFORM_LABEL[platform]}
        </span>
      </label>

      <div className="flex h-10 min-w-0 flex-1 items-center gap-1 rounded-[10px] border border-alpha-10 bg-white px-3 shadow-card transition-shadow hover:border-alpha-20 focus-within:border-transparent focus-within:shadow-[0px_0px_0px_3px] focus-within:shadow-ring">
        <span className="select-none text-body-2 font-medium text-alpha-40">@</span>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/^@/, '').trim())}
          placeholder={PLATFORM_PLACEHOLDER[platform]}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-body-2 font-medium text-primary-900 outline-none placeholder:text-alpha-40"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 rounded-[6px] px-2 py-0.5 text-caption-2 font-medium text-alpha-60 transition-colors hover:bg-alpha-5 hover:text-primary-900"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
