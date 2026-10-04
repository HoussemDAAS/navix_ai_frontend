import { supabase } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` }
  }
  return {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })

  if (!res.ok) {
    // Redirect to login on auth failures
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = `/login?redirectedFrom=${encodeURIComponent(window.location.pathname)}`
      throw new Error('Session expired')
    }

    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `API error: ${res.status}`)
  }

  // 204 No Content (e.g. DELETE) has no body to parse
  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

// ── Projects ──

export interface CreateProjectPayload {
  name: string
  niche: string
  location?: string
  /** What the project is: 'ecommerce' (a brand) or 'creator'. Agencies set it per client. */
  persona?: string
  /** Uploaded logo as a data URL; the API stores it and returns a public URL */
  logo_url?: string
  website?: string
  instagram_handle?: string
  tiktok_handle?: string
  niche_description?: string
  keywords?: string[]
  seed_accounts?: string[]
}

export interface Project {
  id: string
  user_id: string
  name: string
  niche: string
  location: string | null
  persona: string | null
  website: string | null
  /** Uploaded brand logo (avatar_url below is the scraped social profile photo) */
  logo_url?: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  niche_description?: string | null
  keywords?: string[] | null
  seed_accounts?: string[] | null
  created_at: string
  /** The project a single-brand account lands on; exactly one per user. */
  is_primary: boolean
  // The brand's own social account, as last scraped
  followers_count: number | null
  following_count: number | null
  posts_count: number | null
  biography: string | null
  avatar_url: string | null
  is_verified: boolean
  last_scraped_at: string | null
  ai_insight_at: string | null
}

export function getProjects() {
  return request<{ message: string; data: Project[] }>('/projects')
}

/** Answer of a manual data refresh: the scrape runs in the background when started. */
export interface RefreshOutcome {
  started: boolean
  reason?: 'too_soon' | 'no_handle' | 'already_running' | 'failed'
  next_allowed_at?: string | null
  scrape_job_ids?: string[]
}

export function refreshProjectData(projectId: string) {
  return request<{ message: string; data: RefreshOutcome }>(`/projects/${projectId}/refresh`, {
    method: 'POST',
  })
}

export function refreshCompetitorData(projectId: string, competitorId: string) {
  return request<{ message: string; data: RefreshOutcome }>(
    `/projects/${projectId}/competitors/${competitorId}/refresh`,
    { method: 'POST' },
  )
}

/** Brand kit read off the account's own posts, with the quotes that justify it */
export interface BrandKitAutofill {
  kit: BrandKit | null
  filled_fields: string[]
  posts_used: number
  evidence: string[]
  confidence: number | null
}

export function autofillBrandKit(projectId: string, overwrite = false) {
  return request<{ message: string; data: BrandKitAutofill }>(
    `/projects/${projectId}/brand-kit/autofill${overwrite ? '?overwrite=true' : ''}`,
    { method: 'POST' },
  )
}

/* ── Studio: conversational co-creation ─────────────────────── */

export interface StudioSession {
  id: string
  project_id: string
  title: string
  /** Language the content is written in; the assistant itself talks in English */
  content_language: string
  created_at: string
  last_message_at: string
}

export interface StudioIdea {
  id?: string
  title_pillar: string
  angle: string
  format: string
  hook_suggestion: string
  cta_suggestion: string
  rationale: string
}

export interface StudioDraft {
  id?: string
  direction_id?: string
  idea_title: string
  format: string
  language: string
  caption_text: string
  video_script?: string | null
  hook_alternatives: string[]
  cta_alternatives: string[]
  tips: Record<string, string>
  revises_draft_id?: string | null
  version?: number
}

export type ReferenceKind = 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'link'

/** An example the user shared with the Studio: uploaded, read and summarized */
export interface StudioReference {
  id: string
  project_id: string
  session_id: string | null
  kind: ReferenceKind
  title: string
  source_url: string | null
  mime_type: string | null
  size_bytes: number | null
  status: 'processing' | 'ready' | 'failed'
  summary: string | null
  error: string | null
  created_at: string
}

/** A decision the assistant asks for as a small form instead of prose */
export interface StudioQuestion {
  question: string
  kind: 'single' | 'multi' | 'text'
  options: Array<{ label: string; hint?: string }>
  allow_other: boolean
}

export type StudioArtifact =
  | ({ type: 'idea' } & StudioIdea)
  | ({ type: 'draft' } & StudioDraft)
  | { type: 'reference'; id: string; title: string; kind: ReferenceKind }
  | ({ type: 'question' } & StudioQuestion)
  | { type: 'suggestions'; suggestions: string[] }

export interface StudioMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  artifacts: StudioArtifact[]
  created_at: string
}

export type StudioEvent =
  | { type: 'token'; text: string }
  | { type: 'tool'; name: string; query?: string; hits?: number }
  | { type: 'ideas'; ideas: StudioIdea[] }
  | { type: 'draft'; draft: StudioDraft }
  | { type: 'question'; question: StudioQuestion }
  | { type: 'suggestions'; suggestions: string[] }
  | { type: 'saved'; message_id: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export function listStudioSessions(projectId: string) {
  return request<{ data: StudioSession[] }>(`/projects/${projectId}/studio/sessions`)
}

export function createStudioSession(projectId: string, contentLanguage?: string) {
  return request<{ data: { session: StudioSession; messages: StudioMessage[] } }>(
    `/projects/${projectId}/studio/sessions`,
    { method: 'POST', body: JSON.stringify({ content_language: contentLanguage }) },
  )
}

export function getStudioMessages(projectId: string, sessionId: string) {
  return request<{ data: { session: StudioSession; messages: StudioMessage[] } }>(
    `/projects/${projectId}/studio/sessions/${sessionId}/messages`,
  )
}

export function listStudioReferences(projectId: string, sessionId: string) {
  return request<{ data: StudioReference[] }>(
    `/projects/${projectId}/studio/sessions/${sessionId}/references`,
  )
}

/* ── Creator memory: what Navix has learned about this brand ── */

export type MemoryKind = 'preference' | 'avoid' | 'topic' | 'format' | 'voice' | 'audience' | 'goal'

export interface CreatorMemoryItem {
  id: string
  text: string
  kind: MemoryKind | string
  source: string
  learned_at: string
}

export interface CreatorMemory {
  summary: string
  learned: CreatorMemoryItem[]
  updated_at: string | null
}

export function getCreatorMemory(projectId: string) {
  return request<{ data: CreatorMemory }>(`/projects/${projectId}/studio/memory`)
}

export function updateCreatorMemory(
  projectId: string,
  patch: { summary?: string; learned?: Array<Partial<CreatorMemoryItem> & { text: string }> },
) {
  return request<{ data: CreatorMemory }>(`/projects/${projectId}/studio/memory`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

/** Learn from the most recent sessions now instead of waiting for the next pass */
export function refreshCreatorMemory(projectId: string) {
  return request<{ data: CreatorMemory }>(`/projects/${projectId}/studio/memory/refresh`, {
    method: 'POST',
  })
}

export function createProject(data: CreateProjectPayload) {
  return request<{ message: string; data: Project }>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getProject(id: string) {
  return request<{ message: string; data: Project }>(`/projects/${id}`)
}

// ── Brand Kit ──

export interface BrandKitPayload {
  tone_of_voice?: string
  formality_level?: string
  vocab_exclude?: string
  objective?: string
  target_audience?: string
  constraints?: string[]
  preferred_cta?: string
}

export interface BrandKit {
  id: string
  project_id: string
  tone_of_voice: string | null
  formality_level: string | null
  vocab_exclude: string | null
  objective: string | null
  target_audience: string | null
  constraints: string[] | null
  preferred_cta: string | null
  updated_at: string
}

export function getBrandKit(projectId: string) {
  return request<{ message: string; data: BrandKit | null }>(`/projects/${projectId}/brand-kit`)
}

export function saveBrandKit(projectId: string, data: BrandKitPayload) {
  return request<{ message: string; data: unknown }>(`/projects/${projectId}/brand-kit`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ── Competitor Discovery ──

export interface DiscoverResult {
  message: string
  data: { runs: Array<{ query: string; platform: string; strategy: string }> }
}

export interface DiscoverPayload {
  niche: string
  location?: string
  project_id?: string
  persona?: string
  entity_name?: string
  instagram_handle?: string
  tiktok_handle?: string
  niche_description?: string
  keywords?: string[]
  target_market?: string
  seed_accounts?: string[]
}

export function discoverCompetitors(payload: DiscoverPayload) {
  return request<DiscoverResult>('/scraper/discover', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Profile Scraping ──

export interface ScrapedProfile {
  handle: string
  platform: string
  full_name: string
  biography: string
  followers_count: number
  following_count: number
  posts_count: number
  avatar_url: string
  is_verified: boolean
  is_business: boolean
  related_profiles: string[]
}

export function scrapeProfile(handle: string, platform: string) {
  return request<{ message: string; data: ScrapedProfile }>('/scraper/profile', {
    method: 'POST',
    body: JSON.stringify({ handle, platform }),
  })
}

// ── Competitors ──

export interface Competitor {
  id: string
  handle: string
  platform: string
  full_name: string | null
  biography: string | null
  followers_count: number | null
  following_count: number | null
  posts_count: number | null
  avatar_url: string | null
  confidence_score: number
  inclusion_reason: string
  discovery_method?: string | null
  validated_by_user: boolean | null
  rejected_by_user: boolean | null
  created_at?: string
  last_scraped_at?: string | null
}

export interface DiscoveryStatus {
  status: 'idle' | 'pending' | 'active' | 'completed' | 'failed'
  progress: number
  stage: string | null
  message: string | null
  expand_from: string | null
  counts: { candidates: number; enriched: number; kept: number; total: number }
  error: string | null
  updated_at: string | null
}

export function getDiscoveryStatus(projectId: string) {
  return request<{ data: DiscoveryStatus }>(`/projects/${projectId}/discovery`)
}

export function getCompetitors(projectId: string) {
  return request<{ data: Competitor[] }>(`/projects/${projectId}/competitors`)
}

/**
 * Persist a track (validatedByUser) / dismiss (rejectedByUser) decision.
 * Tracking also triggers a backend content scrape of that competitor.
 * NOTE: the backend DTO expects camelCase keys.
 */
export function updateCompetitor(
  projectId: string,
  competitorId: string,
  patch: { validatedByUser?: boolean; rejectedByUser?: boolean },
) {
  return request<{ message: string; data: Competitor }>(
    `/projects/${projectId}/competitors/${competitorId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  )
}

// ── AI Insights (project overview widget) ──

export interface ProjectInsights {
  available: boolean
  reason?: string
  generated_at?: string
  thin_data?: boolean
  top_competitors?: Competitor[]
  headline?: string
  profile_insight?: string
  competitor_insights?: Array<{ handle: string; insight: string }>
  opportunity?: string
}

export function getProjectInsights(projectId: string, refresh = false) {
  return request<{ message: string; data: ProjectInsights }>(
    `/projects/${projectId}/insights${refresh ? '?refresh=true' : ''}`,
  )
}

// ── Content Directions ──

export interface ContentDirection {
  id: string
  brief_id: string
  title_pillar: string
  angle: string | null
  format: string | null
  rationale: string | null
  hook_suggestion?: string | null
  cta_suggestion?: string | null
  selected?: boolean
  /** 'studio' when it came out of a conversation, 'generated' from the batch job */
  source?: 'studio' | 'generated' | string
  session_id?: string | null
  created_at: string
}

export function getDirections(projectId: string) {
  return request<{ data: ContentDirection[] }>(`/projects/${projectId}/directions`)
}

export function generateDirections(
  projectId: string,
  briefId?: string,
  numDirections = 6,
) {
  return request<{ jobId: string }>(`/projects/${projectId}/directions/generate`, {
    method: 'POST',
    body: JSON.stringify({ brief_id: briefId, num_directions: numDirections }),
  })
}

export function selectDirection(
  projectId: string,
  directionId: string,
  selected: boolean,
) {
  return request<{ data: ContentDirection }>(
    `/projects/${projectId}/directions/${directionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ selected }),
    },
  )
}

// ── Drafts ──

export type DraftStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** How a posted draft did against the account's own averages at the last scrape */
export interface DraftPerformance {
  likes: number
  comments: number
  views: number
  avg_likes: number
  avg_comments: number
  avg_views: number
  vs_avg_likes: number | null
  vs_avg_interactions: number | null
  measured_at: string
}

export interface Draft {
  id: string
  direction_id: string
  caption_text: string | null
  video_script: string | null
  user_feedback_notes: string | null
  status: DraftStatus
  created_at: string
  hook_alternatives?: string[]
  cta_alternatives?: string[]
  /** Studio provenance: version chain, coaching tips, content language */
  version?: number
  parent_draft_id?: string | null
  tips?: Record<string, string>
  language?: string | null
  session_id?: string | null
  /** Performance loop: set once the real post was matched to this draft */
  published_content_id?: string | null
  published_at?: string | null
  performance?: DraftPerformance | null
  /** Joined from content_directions when available */
  direction?: Pick<ContentDirection, 'id' | 'title_pillar' | 'angle' | 'format'>
}

export function getDrafts(projectId: string) {
  return request<{ data: Draft[] }>(`/projects/${projectId}/drafts`)
}

export function generateDrafts(projectId: string, directionIds: string[]) {
  return request<{ jobId: string }>(`/projects/${projectId}/drafts/generate`, {
    method: 'POST',
    // GenerateDraftsDto is camelCase — snake_case here was refused with 400
    body: JSON.stringify({ directionIds }),
  })
}

export function updateDraft(
  projectId: string,
  draftId: string,
  patch: Partial<Pick<Draft, 'caption_text' | 'video_script' | 'user_feedback_notes' | 'status'>>,
) {
  return request<{ data: Draft }>(`/projects/${projectId}/drafts/${draftId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export type FeedbackAction = 'approved' | 'rejected' | 'edited'

export function submitDraftFeedback(
  projectId: string,
  draftId: string,
  action: FeedbackAction,
  notes?: string,
) {
  return request<{ data: { id: string } }>(
    `/projects/${projectId}/drafts/${draftId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    },
  )
}

// ── Calendar ──
// Backed by the calendar module (src/calendar) — requires the calendar_items
// migration (apps/backend-navix/src/calendar/migration.sql) applied in Supabase.

export type CalendarPlatform = 'instagram' | 'tiktok'
export type CalendarStatus = 'planned' | 'published' | 'cancelled'

export interface CalendarItem {
  id: string
  project_id: string
  draft_id: string | null
  title: string
  scheduled_at: string
  platform: CalendarPlatform
  status: CalendarStatus
  notes: string | null
  created_at?: string
}

export interface CreateCalendarItemPayload {
  draft_id?: string
  title: string
  scheduled_at: string
  platform: CalendarPlatform
  notes?: string
}

/** Approve → schedule: one draft onto the next best slot for this account's field (or a given date). */
export function scheduleDraft(
  projectId: string,
  draftId: string,
  opts: { scheduled_at?: string; platform?: CalendarPlatform } = {},
) {
  return request<{ data: { item: CalendarItem; reason: string; already: boolean } }>(
    `/projects/${projectId}/calendar/schedule-draft`,
    { method: 'POST', body: JSON.stringify({ draft_id: draftId, ...opts }) },
  )
}

/** Every approved, unscheduled draft gets a slot over the coming days, best days first. */
export function planWeek(projectId: string, draftIds?: string[]) {
  return request<{ data: { items: CalendarItem[]; reasons: string[]; skipped: number } }>(
    `/projects/${projectId}/calendar/plan-week`,
    { method: 'POST', body: JSON.stringify(draftIds ? { draft_ids: draftIds } : {}) },
  )
}

export function getCalendar(projectId: string, from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return request<{ data: CalendarItem[] }>(
    `/projects/${projectId}/calendar${qs ? `?${qs}` : ''}`,
  )
}

export function createCalendarItem(
  projectId: string,
  data: CreateCalendarItemPayload,
) {
  // The calendar DTOs are camelCase and reject unknown keys; the UI works in snake_case
  return request<{ data: CalendarItem }>(`/projects/${projectId}/calendar`, {
    method: 'POST',
    body: JSON.stringify({
      draftId: data.draft_id,
      title: data.title,
      scheduledAt: data.scheduled_at,
      platform: data.platform,
      notes: data.notes,
    }),
  })
}

export function updateCalendarItem(
  projectId: string,
  itemId: string,
  patch: Partial<Pick<CalendarItem, 'title' | 'scheduled_at' | 'platform' | 'status' | 'notes'>>,
) {
  const { scheduled_at, ...rest } = patch
  const body: Record<string, unknown> = { ...rest }
  if (scheduled_at !== undefined) body.scheduledAt = scheduled_at
  return request<{ data: CalendarItem }>(
    `/projects/${projectId}/calendar/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
}

export function deleteCalendarItem(projectId: string, itemId: string) {
  // Backend returns 204 No Content
  return request<void>(`/projects/${projectId}/calendar/${itemId}`, {
    method: 'DELETE',
  })
}

// ── Jobs ──

export interface JobStatus<TOutput = unknown> {
  id?: string
  type?: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  progress: number
  output: TOutput | null
  error: string | null
}

// The backend wraps every response in { message, data } — unwrap here so
// callers can read status/progress/output directly.
export async function getJobStatus<TOutput = unknown>(jobId: string): Promise<JobStatus<TOutput>> {
  const res = await request<{ data: JobStatus<TOutput> }>(`/jobs/${jobId}/status`)
  return {
    ...res.data,
    progress: res.data.progress ?? 0,
    output: res.data.output ?? null,
    error: res.data.error ?? null,
  }
}

// ── Market analysis ──

export interface AnalysisFormat {
  format: string
  frequency: string
  avg_engagement: string
  examples: string[]
}

export interface AnalysisHook {
  hook_text: string
  pattern: string
  effectiveness: string
}

export interface AnalysisOpportunity {
  area: string
  reasoning: string
  confidence: number
}

export interface AnalysisBrief {
  id?: string
  dominant_formats: AnalysisFormat[]
  winning_hooks: AnalysisHook[]
  whitespace_opportunities: AnalysisOpportunity[]
  content_cadence: string | null
  key_takeaways: string[]
  generated_at?: string
  /** How current the brief is against the competitor posts collected since it was written */
  freshness?: {
    generated_at: string | null
    new_posts_since: number
    age_days: number
    stale: boolean
  }
}

export function getAnalysis(projectId: string) {
  return request<{ data: AnalysisBrief | null }>(`/projects/${projectId}/analysis`)
}

export function runAnalysis(projectId: string) {
  return request<{ data: { jobId: string } }>(`/projects/${projectId}/analysis/run`, {
    method: 'POST',
  })
}

// ── Field analytics (computed from scraped posts, no AI) ──

export interface FieldTopPost {
  post_url: string | null
  thumbnail_url: string | null
  caption: string | null
  content_type: string | null
  likes_count: number | null
  comments_count: number
  views_count: number
  published_at: string | null
}

export interface AccountAnalytics {
  id: string | null
  handle: string
  platform: string
  avatar_url: string | null
  followers_count: number | null
  tracked: boolean
  posts: number
  avg_likes: number
  avg_comments: number
  avg_views: number
  engagement_rate: number | null
  posts_per_week: number | null
  dominant_format: string | null
  format_mix: Array<{ format: string; count: number }>
  top_posts: FieldTopPost[]
}

export interface FieldAnalytics {
  generated_from: {
    posts: number
    self_posts: number
    competitors_with_content: number
    oldest_post: string | null
    newest_post: string | null
  }
  field: {
    avg_engagement_rate: number | null
    posts_per_week: number | null
    format_mix: Array<{ format: string; count: number; share: number }>
    top_hashtags: Array<{ tag: string; count: number }>
    posting_days: Array<{ day: string; count: number }>
    posting_hours: Array<{ hour: number; count: number }>
  }
  competitors: AccountAnalytics[]
  self: AccountAnalytics | null
  comparison: {
    engagement_vs_field: number | null
    cadence_vs_field: number | null
  }
}

export function getFieldAnalytics(projectId: string) {
  return request<{ data: FieldAnalytics }>(`/projects/${projectId}/analysis/field`)
}

// ── Weekly digest (Home): what moved, what stood out, what to make next ──

export interface DigestPost {
  post_url: string | null
  thumbnail_url: string | null
  caption: string | null
  content_type: string | null
  likes_count: number | null
  comments_count: number
  views_count: number
  published_at: string | null
  /** This post's interactions over the account's usual interactions */
  vs_avg: number | null
}

export interface DigestIdea {
  title: string
  why: string
  format: string | null
  studio_prompt: string
}

export interface WeeklyDigest {
  period: { from: string; to: string; days: number }
  account: {
    followers_now: number | null
    followers_delta: number | null
    engagement_now: number | null
    engagement_delta: number | null
    since: string | null
    snapshots: number
  }
  you: {
    posts: number
    /** 7 when they posted this week, else 30 */
    window_days: number
    days_since_last_post: number | null
    best_post: DigestPost | null
  }
  field: {
    posts: number
    window_days: number
    accounts_posted: number
    most_active: { handle: string; posts: number } | null
    /** 7 when a post really broke out this week, else the month's best is shown */
    breakout_window_days: number
    breakout: (DigestPost & { competitor_id: string; handle: string; avatar_url: string | null }) | null
  }
  pipeline: {
    pending_review: number
    scheduled: number
    next: { title: string; scheduled_at: string; platform: string } | null
    posted: Array<{ caption: string | null; vs_avg_interactions: number | null; published_at: string | null }>
  }
  ai: {
    headline: string | null
    idea: DigestIdea | null
    generated_at: string | null
    stale: boolean
  }
}

export function getWeeklyDigest(projectId: string, refresh = false) {
  return request<{ data: WeeklyDigest }>(
    `/projects/${projectId}/analysis/digest${refresh ? '?refresh=true' : ''}`,
  )
}

// ── Deep profiles (competitor / self): posts + stats + grounded AI read ──

export interface ProfilePost {
  id: string
  post_url: string | null
  thumbnail_url: string | null
  caption: string | null
  content_type: string | null
  hashtags: string[] | null
  likes_count: number | null
  comments_count: number | null
  views_count: number | null
  shares_count: number | null
  saves_count: number | null
  engagement_rate: number | null
  duration_seconds: number | null
  published_at: string | null
  /** What the post says (video transcript) and shows (vision description), once read */
  transcript?: string | null
  visual_summary?: string | null
  media_language?: string | null
}

export interface CompetitorInsight {
  summary: string
  what_works: string[]
  weaknesses: string[]
  threat: { level: 'low' | 'medium' | 'high'; reason: string }
  steal: string[]
}

export interface SelfInsight {
  summary: string
  voice: string
  what_works: string[]
  gaps: string[]
  next_moves: string[]
}

export type InsightStatus = 'ready' | 'stale' | 'unavailable' | 'no_data'

export interface CompetitorProfile {
  competitor: Competitor
  stats: AccountAnalytics
  posting_days: Array<{ day: string; count: number }>
  posts: ProfilePost[]
  insight: CompetitorInsight | null
  insight_status: InsightStatus
  insight_error: string | null
  insight_generated_at: string | null
}

export interface SelfProfileData {
  /** The user's profile merged with the project's own-account data (source of truth) */
  profile: Profile & { last_scraped_at?: string | null }
  stats: AccountAnalytics
  posting_days: Array<{ day: string; count: number }>
  posts: ProfilePost[]
  insight: SelfInsight | null
  insight_status: InsightStatus
  insight_error: string | null
  insight_generated_at: string | null
}

/** Manual add: paste a profile link or @handle → enriched, tracked competitor */
export function addCompetitor(projectId: string, link: string) {
  return request<{ data: Competitor }>(`/projects/${projectId}/competitors`, {
    method: 'POST',
    body: JSON.stringify({ link }),
  })
}

export function getCompetitorProfile(projectId: string, competitorId: string, refresh = false) {
  return request<{ data: CompetitorProfile }>(
    `/projects/${projectId}/competitors/${competitorId}/profile${refresh ? '?refresh=true' : ''}`,
  )
}

export function getSelfProfile(projectId: string, refresh = false) {
  return request<{ data: SelfProfileData }>(
    `/projects/${projectId}/self-profile${refresh ? '?refresh=true' : ''}`,
  )
}

// ── Profile ──

export type ProfilePersona = 'ecommerce' | 'agency' | 'creator'

export type ProfileOnboardingStep =
  | 'account_type'
  | 'identity'
  | 'socials'
  | 'scraping'
  | 'competitors'
  | 'brand_kit'
  | 'completed'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  biography: string | null

  persona: ProfilePersona | null

  // Entity / brand
  entity_name: string | null
  entity_logo_url: string | null
  country: string | null
  website_url: string | null

  // Niche / market
  niche: string | null
  target_market: string | null
  product_category: string | null
  product_subcategory: string | null
  languages: string[] | null

  // Socials
  instagram_handle: string | null
  tiktok_handle: string | null
  /** Write-only: full profile links, parsed server-side into the handles above */
  social_links?: string[]
  has_social_presence: boolean
  niche_description: string | null
  keywords: string[]
  /** "platform:handle" benchmark accounts */
  seed_accounts: string[]

  // Scraped stats (creator)
  followers_count: number | null
  following_count: number | null
  posts_count: number | null
  is_verified: boolean

  // Onboarding gate
  onboarding_step: ProfileOnboardingStep | null
  onboarding_completed: boolean
}

export function getProfile() {
  return request<{ message: string; data: Profile }>('/profiles/me')
}

export function updateProfile(data: Partial<Omit<Profile, 'id'>>) {
  return request<{ message: string; data: Profile }>('/profiles/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
