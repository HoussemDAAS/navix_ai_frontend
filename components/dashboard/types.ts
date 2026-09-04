import type { Competitor } from '@/lib/api'

/** The four pipeline stages surfaced on the dashboard home. */
export type PipelineStepKey = 'competitors' | 'analysis' | 'drafts' | 'calendar'

/**
 * Aggregated per-project pipeline state, built from the real API responses.
 * The `*Ok` flags say whether that slice actually loaded — the UI must never
 * render a count derived from a failed request.
 */
export interface ProjectStats {
  projectId: string
  competitorsOk: boolean
  draftsOk: boolean
  /** Discovered competitors the user has not dismissed. */
  competitorsFound: number
  /** Competitors explicitly validated by the user. */
  competitorsTracked: number
  /** Up to 3 competitors, tracked ones first, ranked by confidence. */
  topCompetitors: Competitor[]
  hasAnalysis: boolean
  draftsTotal: number
  /** Drafts still in play (pending review or approved). */
  draftsReady: number
  calendarItems: number
  discoveryRunning: boolean
  discoveryProgress: number
  discoveryMessage: string | null
}
