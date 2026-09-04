import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOST_SUFFIXES = [
  'cdninstagram.com',
  'fbcdn.net',
  'tiktokcdn.com',
  'tiktokcdn-us.com',
  'ttwstatic.com',
  'ytimg.com',
  'googleusercontent.com',
  'supabase.co',
]

const noImage = (status: number) =>
  new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Proxies external avatar images (Instagram/TikTok block hotlinking).
 * Expired CDN links (signed URLs with an `oe=` expiry) answer 4xx upstream:
 * we return 404 — not 502 — so <img onError> fallbacks kick in quietly.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  let target: URL
  try {
    target = new URL(url)
  } catch {
    return noImage(400)
  }
  if (!ALLOWED_HOST_SUFFIXES.some((s) => target.hostname === s || target.hostname.endsWith(`.${s}`))) {
    return noImage(400)
  }

  try {
    const response = await fetch(target.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/*',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) return noImage(404)

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) return noImage(404)

    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return noImage(404)
  }
}
