/**
 * Client-side mirror of the backend social link parser
 * (apps/backend-navix/src/common/social-links.ts). Keep both in sync.
 * Navix supports Instagram and TikTok. Share links (vm.tiktok.com/…,
 * instagram.com/share/…) are accepted here and resolved by the backend when
 * the profile is saved.
 */
export type SocialPlatform = 'instagram' | 'tiktok'
export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = ['instagram', 'tiktok']

export interface ParsedSocialLink {
  platform: SocialPlatform
  handle: string
  url: string
}

const IG_RESERVED = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv', 'share'])
const TT_RESERVED = new Set(['share', 'video', 'tag', 'discover', 'search', 'music', 'foryou', 'explore', 't'])
const HANDLE_RE = /^[A-Za-z0-9._-]{1,64}$/
const SHARE_HOSTS = /^(vm|vt)\.tiktok\.com$|^l\.instagram\.com$/i

function toUrl(raw: string): URL | null {
  const input = (raw ?? '').trim()
  if (!input) return null
  try {
    return new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
  } catch {
    return null
  }
}

function cleanHost(host: string): string {
  return host.toLowerCase().replace(/^(www|m|mobile|web|business)\./, '')
}

/** Redirect-style share link: valid input, resolved server-side on save. */
export function isShareLink(raw: string): boolean {
  const url = toUrl(raw)
  if (!url) return false
  const host = url.hostname.toLowerCase()
  if (SHARE_HOSTS.test(host)) return true
  const first = url.pathname.split('/').filter(Boolean)[0]?.toLowerCase()
  const site = cleanHost(host)
  return first === 'share' && (site === 'instagram.com' || site === 'tiktok.com')
}

/** Platform guessed from the host of a share link (for the UI chip only). */
export function shareLinkPlatform(raw: string): SocialPlatform | null {
  const url = toUrl(raw)
  if (!url) return null
  const host = url.hostname.toLowerCase()
  if (host.includes('tiktok')) return 'tiktok'
  if (host.includes('instagram')) return 'instagram'
  return null
}

export function parseSocialLink(raw: string): ParsedSocialLink | null {
  const url = toUrl(raw)
  if (!url) return null
  if (SHARE_HOSTS.test(url.hostname.toLowerCase())) return null

  const host = cleanHost(url.hostname)
  const segments = url.pathname.split('/').filter(Boolean)
  const first = segments[0]

  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    if (!first || IG_RESERVED.has(first.toLowerCase())) return null
    const handle = first.replace(/^@/, '').toLowerCase()
    if (!HANDLE_RE.test(handle)) return null
    return { platform: 'instagram', handle, url: `https://www.instagram.com/${handle}/` }
  }

  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    const at = segments.find((s) => s.startsWith('@'))
    const candidate = at ?? first
    if (!candidate || (!at && TT_RESERVED.has(candidate.toLowerCase()))) return null
    const handle = candidate.replace(/^@/, '').toLowerCase()
    if (!HANDLE_RE.test(handle)) return null
    return { platform: 'tiktok', handle, url: `https://www.tiktok.com/@${handle}` }
  }

  return null
}

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
}
