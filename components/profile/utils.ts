/**
 * Formatting helpers shared by the competitor and self deep-profile pages.
 * Every number that can be missing renders as an em dash — never a fake zero.
 */

const DASH = '—'

/** 1.2K / 3.4M style. Returns "—" when the value is missing. */
export function fmtCount(n: number | null | undefined): string {
  if (n == null) return DASH
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

/** Engagement rates arrive as a 0–1 ratio. */
export function fmtPercent(rate: number | null | undefined): string {
  if (rate == null) return DASH
  return `${(rate * 100).toFixed(1)}%`
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return DASH
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return DASH
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** 47 → "0:47", 128 → "2:08". Null when there is no duration. */
export function fmtDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || seconds <= 0) return null
  const total = Math.round(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/** Public URL of the real account, per platform. Null for unknown platforms. */
export function profileUrl(handle: string, platform: string | null | undefined): string | null {
  const h = handle.replace(/^@/, '')
  if (!h) return null
  switch ((platform ?? '').toLowerCase()) {
    case 'instagram':
      return `https://www.instagram.com/${h}/`
    case 'tiktok':
      return `https://www.tiktok.com/@${h}`
    case 'youtube':
      return `https://www.youtube.com/@${h}`
    case 'facebook':
      return `https://www.facebook.com/${h}`
    default:
      return null
  }
}

export function platformLabel(platform: string | null | undefined): string {
  switch ((platform ?? '').toLowerCase()) {
    case 'instagram':
      return 'Instagram'
    case 'tiktok':
      return 'TikTok'
    case 'youtube':
      return 'YouTube'
    case 'facebook':
      return 'Facebook'
    default:
      return 'Social'
  }
}

export function initialsOf(handle: string, fullName: string | null | undefined): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
    if (letters) return letters
  }
  return handle.replace(/^@/, '').slice(0, 2).toUpperCase() || '?'
}
