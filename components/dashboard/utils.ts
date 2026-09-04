import {
  getAnalysis,
  getCalendar,
  getCompetitors,
  getDiscoveryStatus,
  getDrafts,
} from '@/lib/api'
import type { PipelineStepKey, ProjectStats } from './types'

/** 1234 → "1.2K", 1_400_000 → "1.4M". Returns "—" for missing values. */
export function formatCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 10_000) return `${Math.round(value / 1_000)}K`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(value)
}

/** Two-letter initials from a display name, falling back to a handle. */
export function initialsOf(name: string | null | undefined, fallback: string): string {
  const source = (name?.trim() || fallback.replace(/^@/, '').trim()).replace(/[^\p{L}\p{N} ]/gu, '')
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export const PIPELINE_STEPS: ReadonlyArray<{ key: PipelineStepKey; label: string }> = [
  { key: 'competitors', label: 'Competitors' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'calendar', label: 'Calendar' },
]

export function stepHref(projectId: string, step: PipelineStepKey): string {
  return `/projects/${projectId}/${step}`
}

/** Which stages already have real data behind them. */
export function completedSteps(stats: ProjectStats): Record<PipelineStepKey, boolean> {
  return {
    competitors: stats.competitorsFound > 0,
    analysis: stats.hasAnalysis,
    drafts: stats.draftsTotal > 0,
    calendar: stats.calendarItems > 0,
  }
}

/** The first stage that still needs the user. */
export function resolveNextStep(stats: ProjectStats): PipelineStepKey {
  if (stats.competitorsFound === 0) return 'competitors'
  if (!stats.hasAnalysis) return 'analysis'
  if (stats.draftsTotal === 0) return 'drafts'
  return 'calendar'
}

/**
 * Fans out the per-project pipeline reads. Every call is caught individually so
 * a single failing endpoint degrades one number instead of blanking the page.
 */
export async function fetchProjectStats(projectId: string): Promise<ProjectStats> {
  const [competitorsRes, discoveryRes, analysisRes, draftsRes, calendarRes] = await Promise.all([
    getCompetitors(projectId).catch(() => null),
    getDiscoveryStatus(projectId).catch(() => null),
    getAnalysis(projectId).catch(() => null),
    getDrafts(projectId).catch(() => null),
    getCalendar(projectId).catch(() => null),
  ])

  const competitors = (competitorsRes?.data ?? []).filter((c) => !c.rejected_by_user)
  const tracked = competitors.filter((c) => c.validated_by_user)
  const topCompetitors = [...(tracked.length > 0 ? tracked : competitors)]
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 3)

  const drafts = draftsRes?.data ?? []
  const discovery = discoveryRes?.data ?? null

  return {
    projectId,
    competitorsOk: competitorsRes !== null,
    draftsOk: draftsRes !== null,
    competitorsFound: competitors.length,
    competitorsTracked: tracked.length,
    topCompetitors,
    hasAnalysis: Boolean(analysisRes?.data),
    draftsTotal: drafts.length,
    draftsReady: drafts.filter((d) => d.status !== 'REJECTED').length,
    calendarItems: calendarRes?.data?.length ?? 0,
    discoveryRunning: discovery?.status === 'pending' || discovery?.status === 'active',
    discoveryProgress: discovery?.progress ?? 0,
    discoveryMessage: discovery?.message ?? null,
  }
}
