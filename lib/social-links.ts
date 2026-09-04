/**
 * Client-side mirror of the backend social link parser
 * (apps/backend-navix/src/common/social-links.ts). Keep both in sync.
 * Share links (vm.tiktok.com/…, facebook.com/share/…) are accepted here and
 * resolved by the backend when the profile is saved.
 */
export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'facebook'

export interface ParsedSocialLink {
  platform: SocialPlatform
  handle: string
  url: string
}

const IG_RESERVED = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv', 'share'])
const FB_RESERVED = new Set([
  'share', 'reel', 'reels', 'watch', 'photo', 'photos', 'posts', 'videos', 'groups',
  'events', 'marketplace', 'stories', 'story.php', 'permalink.php', 'people', 'pages',
  'login', 'sharer', 'sharer.php', 'dialog', 'hashtag',
])
const TT_RESERVED = new Set(['share', 'video', 'tag', 'discover', 'search', 'music', 'foryou', 'explore', 't'])
const YT_PREFIXES = new Set(['c', 'user', 'channel'])
const HANDLE_RE = /^[A-Za-z0-9._-]{1,64}$/
const SHARE_HOSTS = /^(vm|vt)\.tiktok\.com$|^fb\.watch$|^l\.instagram\.com$/i

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
  return first === 'share' && (site === 'facebook.com' || site === 'instagram.com' || site === 'tiktok.com' || site === 'fb.com')
}

/** Platform guessed from the host of a share link (for the UI chip only). */
export function shareLinkPlatform(raw: string): SocialPlatform | null {
  const url = toUrl(raw)
  if (!url) return null
  const host = url.hostname.toLowerCase()
  if (host.includes('tiktok')) return 'tiktok'
  if (host.includes('facebook') || host.includes('fb.')) return 'facebook'
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

  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') {
    if (!first) return null
    if (first.startsWith('@')) {
      const handle = first.slice(1)
      if (!HANDLE_RE.test(handle)) return null
      return { platform: 'youtube', handle, url: `https://www.youtube.com/@${handle}` }
    }
    if (YT_PREFIXES.has(first.toLowerCase()) && segments[1]) {
      const handle = `${first.toLowerCase()}/${segments[1]}`
      return { platform: 'youtube', handle, url: `https://www.youtube.com/${handle}` }
    }
    return null
  }

  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.com') {
    if (!first) return null
    if (first.toLowerCase() === 'profile.php') {
      const id = url.searchParams.get('id')
      if (!id || !/^\d+$/.test(id)) return null
      return { platform: 'facebook', handle: `profile.php?id=${id}`, url: `https://www.facebook.com/profile.php?id=${id}` }
    }
    if (FB_RESERVED.has(first.toLowerCase())) return null
    const handle = first.replace(/^@/, '')
    if (!HANDLE_RE.test(handle)) return null
    return { platform: 'facebook', handle, url: `https://www.facebook.com/${handle}` }
  }

  return null
}

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
}
