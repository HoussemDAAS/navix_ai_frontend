import type { AccountAnalytics, FieldAnalytics, ProfilePost } from '@/lib/api'

/**
 * Navix Creator Score — a transparent 0–100 read of an account computed
 * ONLY from scraped data (no AI): engagement vs the field, cadence,
 * posting consistency, format diversity and reach efficiency.
 * Every pillar carries a rule-based hint when it drags the score down.
 */

export interface ScorePillar {
  key: 'engagement' | 'cadence' | 'consistency' | 'diversity' | 'reach'
  label: string
  weight: number
  /** 0–100 within the pillar */
  score: number
  /** weight × score/100 */
  earned: number
  /** Human value shown next to the bar */
  display: string
  hint: string | null
}

export interface CreatorScore {
  total: number
  grade: string
  pillars: ScorePillar[]
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))

function gradeOf(total: number): string {
  if (total >= 85) return 'A'
  if (total >= 75) return 'A-'
  if (total >= 65) return 'B+'
  if (total >= 55) return 'B'
  if (total >= 45) return 'C+'
  if (total >= 35) return 'C'
  return 'D'
}

function datedTimes(posts: ProfilePost[]): number[] {
  return posts
    .map((p) => (p.published_at ? new Date(p.published_at).getTime() : NaN))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b)
}

export function computeCreatorScore(
  stats: AccountAnalytics,
  posts: ProfilePost[],
  field: FieldAnalytics | null,
): CreatorScore | null {
  if (!stats || stats.posts === 0) return null
  const pillars: ScorePillar[] = []

  // 1. Engagement vs the field (30)
  {
    const er = stats.engagement_rate
    const fieldEr = field?.field.avg_engagement_rate ?? null
    const ratio = er != null && fieldEr != null && fieldEr > 0 ? er / fieldEr : null
    const score =
      ratio != null ? clamp01(ratio / 1.2) * 100 : er != null ? clamp01(er / 0.08) * 100 : 50
    pillars.push({
      key: 'engagement',
      label: 'Engagement',
      weight: 30,
      score,
      earned: (30 * score) / 100,
      display: er != null ? `${(er * 100).toFixed(1)}% per view` : 'no view data',
      hint:
        score < 60
          ? ratio != null
            ? `Your engagement runs at ${Math.round(ratio * 100)}% of your field's — study your top posts' hooks and make more like them.`
            : 'Engagement is below a healthy bar — stronger hooks in the first line lift it fastest.'
          : null,
    })
  }

  // 2. Cadence vs the field (25)
  {
    const ppw = stats.posts_per_week
    const fieldPpw = field?.field.posts_per_week ?? null
    const score =
      ppw != null && fieldPpw != null && fieldPpw > 0
        ? clamp01(ppw / fieldPpw) * 100
        : ppw != null
          ? clamp01(ppw / 3) * 100
          : 20
    pillars.push({
      key: 'cadence',
      label: 'Cadence',
      weight: 25,
      score,
      earned: (25 * score) / 100,
      display: ppw != null ? `${ppw} posts/week` : 'irregular',
      hint:
        score < 60
          ? fieldPpw != null
            ? `The field posts ${fieldPpw}/week; you post ${ppw ?? 0}. One fixed post a week moves this pillar the most.`
            : 'Posting is too rare to compound — one fixed post a week changes everything.'
          : null,
    })
  }

  // 3. Consistency of posting gaps (15)
  {
    const times = datedTimes(posts)
    let score = 40
    let display = 'not enough dated posts'
    if (times.length >= 5) {
      const gaps: number[] = []
      for (let i = 1; i < times.length; i++) gaps.push((times[i] - times[i - 1]) / 86_400_000)
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
      const std = Math.sqrt(gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length)
      const cv = mean > 0 ? std / mean : 2
      score = clamp01((2 - cv) / 1.5) * 100
      display = `~every ${Math.max(1, Math.round(mean))} days`
    }
    pillars.push({
      key: 'consistency',
      label: 'Consistency',
      weight: 15,
      score,
      earned: (15 * score) / 100,
      display,
      hint:
        score < 60
          ? 'Your gaps between posts swing wildly — a fixed weekly slot beats bursts followed by silence.'
          : null,
    })
  }

  // 4. Format diversity (15)
  {
    const mix = stats.format_mix.filter((m) => m.count > 0)
    const total = mix.reduce((a, m) => a + m.count, 0)
    let score = 25
    if (mix.length > 1 && total > 0) {
      const H = -mix.reduce((a, m) => {
        const p = m.count / total
        return a + p * Math.log(p)
      }, 0)
      const hMax = Math.log(Math.min(mix.length, 4))
      score = hMax > 0 ? clamp01(H / hMax) * 100 : 25
    }
    const dominant = stats.dominant_format
    pillars.push({
      key: 'diversity',
      label: 'Format mix',
      weight: 15,
      score,
      earned: (15 * score) / 100,
      display: mix.length > 1 ? `${mix.length} formats` : dominant ? `${dominant} only` : '—',
      hint:
        score < 60 && dominant
          ? `Almost everything you post is ${dominant} — your field splits across image, carousel and video; try one carousel a week.`
          : null,
    })
  }

  // 5. Reach efficiency (15)
  {
    const followers = stats.followers_count
    let score = 50
    let display = 'no follower data'
    if (followers && followers > 0) {
      if (stats.avg_views > 0) {
        const vpf = stats.avg_views / followers
        score = clamp01(vpf / 0.3) * 100
        display = `${Math.max(1, Math.round(vpf * 100))}% of followers view a post`
      } else if (stats.avg_likes > 0) {
        const lpf = stats.avg_likes / followers
        score = clamp01(lpf / 0.05) * 100
        display = `${(lpf * 100).toFixed(1)}% like rate`
      }
    }
    pillars.push({
      key: 'reach',
      label: 'Reach',
      weight: 15,
      score,
      earned: (15 * score) / 100,
      display,
      hint:
        score < 60
          ? 'Only a slice of your audience sees each post — reels and a strong first two seconds widen reach.'
          : null,
    })
  }

  const total = Math.round(pillars.reduce((a, p) => a + p.earned, 0))
  return { total, grade: gradeOf(total), pillars }
}

/* ── Extra profile intelligence, all computed from posts ── */

export interface MonthBucket {
  label: string
  posts: number
  avgLikes: number
}

/** Average likes per month for the (up to) last 8 months that have posts. */
export function monthlyMomentum(posts: ProfilePost[]): MonthBucket[] {
  const buckets = new Map<string, { t: number; likes: number[]; label: string }>()
  for (const p of posts) {
    if (!p.published_at) continue
    const d = new Date(p.published_at)
    if (isNaN(d.getTime())) continue
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    const entry = buckets.get(key) ?? {
      t: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1),
      likes: [],
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }
    entry.likes.push(p.likes_count ?? 0)
    buckets.set(key, entry)
  }
  return [...buckets.values()]
    .sort((a, b) => a.t - b.t)
    .slice(-8)
    .map((b) => ({
      label: b.label,
      posts: b.likes.length,
      avgLikes: Math.round(b.likes.reduce((x, y) => x + y, 0) / b.likes.length),
    }))
}

export interface CaptionInsight {
  shortAvg: number
  longAvg: number
  /** long/short engagement ratio */
  ratio: number
  winner: 'short' | 'long'
}

/** Do short (<120 chars) or long captions earn more engagement? Needs 3+ of each. */
export function captionInsight(posts: ProfilePost[]): CaptionInsight | null {
  const eng = (p: ProfilePost) => (p.likes_count ?? 0) + (p.comments_count ?? 0)
  const short = posts.filter((p) => (p.caption ?? '').length > 0 && (p.caption ?? '').length < 120)
  const long = posts.filter((p) => (p.caption ?? '').length >= 120)
  if (short.length < 3 || long.length < 3) return null
  const shortAvg = short.reduce((a, p) => a + eng(p), 0) / short.length
  const longAvg = long.reduce((a, p) => a + eng(p), 0) / long.length
  if (shortAvg === 0 && longAvg === 0) return null
  return {
    shortAvg: Math.round(shortAvg),
    longAvg: Math.round(longAvg),
    ratio: shortAvg > 0 ? longAvg / shortAvg : 99,
    winner: longAvg >= shortAvg ? 'long' : 'short',
  }
}

export function bestPost(posts: ProfilePost[]): ProfilePost | null {
  if (posts.length === 0) return null
  return [...posts].sort(
    (a, b) => (b.likes_count ?? 0) + (b.comments_count ?? 0) - ((a.likes_count ?? 0) + (a.comments_count ?? 0)),
  )[0]
}

export function mostDiscussedPost(posts: ProfilePost[]): ProfilePost | null {
  if (posts.length === 0) return null
  return [...posts].sort((a, b) => (b.comments_count ?? 0) - (a.comments_count ?? 0))[0]
}

export function daysSinceLastPost(posts: ProfilePost[]): number | null {
  const times = datedTimes(posts)
  if (times.length === 0) return null
  return Math.floor((Date.now() - times[times.length - 1]) / 86_400_000)
}

export function bestPostingDay(posts: ProfilePost[]): string | null {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const eng = new Map<number, number>()
  for (const p of posts) {
    if (!p.published_at) continue
    const d = new Date(p.published_at)
    if (isNaN(d.getTime())) continue
    eng.set(d.getUTCDay(), (eng.get(d.getUTCDay()) ?? 0) + (p.likes_count ?? 0) + (p.comments_count ?? 0))
  }
  if (eng.size === 0) return null
  const [best] = [...eng.entries()].sort((a, b) => b[1] - a[1])[0]
  return days[best]
}

export function topOwnHashtags(posts: ProfilePost[], limit = 10): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>()
  for (const p of posts) {
    for (const h of p.hashtags ?? []) {
      const tag = h.toLowerCase()
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
