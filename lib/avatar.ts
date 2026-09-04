/**
 * Resolves the <img src> for an external avatar.
 * Avatars persisted in our Supabase Storage bucket are served directly;
 * anything else (Instagram/TikTok CDN) goes through the image proxy, which
 * answers 404 when the upstream link has expired so the UI can fall back.
 */
export function avatarSrc(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.includes('/storage/v1/object/public/')) return url
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}
