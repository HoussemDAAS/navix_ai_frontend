'use client'

import { useState } from 'react'
import { AlertCircle, Link2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { isShareLink, parseSocialLink, type SocialPlatform } from '@/lib/social-links'

const SHARE_LINK_MESSAGE =
  'That is a share link. Open it, then paste the full profile URL shown in the address bar.'
const INVALID_MESSAGE =
  'We could not read a profile from that link. Paste a full Instagram, TikTok, YouTube or Facebook profile URL.'

interface PasteLinkInputProps {
  onResolved: (platform: SocialPlatform, handle: string) => void
  className?: string
}

/** Paste any profile URL and it fills the matching handle field below. */
export function PasteLinkInput({ onResolved, className }: PasteLinkInputProps) {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const input = raw.trim()
    if (!input) return
    if (isShareLink(input)) {
      setError(SHARE_LINK_MESSAGE)
      return
    }
    const parsed = parseSocialLink(input)
    if (!parsed) {
      setError(INVALID_MESSAGE)
      return
    }
    onResolved(parsed.platform, parsed.handle)
    setRaw('')
    setError(null)
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Paste a profile link, e.g. instagram.com/yourbrand"
          aria-label="Paste a profile link"
          error={!!error}
          leadIcon={<Link2 className="size-4" />}
          className="sm:flex-1"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!raw.trim()}
          className="h-[40px] shrink-0 rounded-[12px] border border-alpha-10 bg-white px-4 text-caption-1 font-medium text-primary-900 shadow-card transition-colors hover:border-alpha-20 hover:bg-alpha-5 disabled:pointer-events-none disabled:opacity-50"
        >
          Fill field
        </button>
      </div>
      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-caption-2 text-destructive-500">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
