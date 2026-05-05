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

  return res.json()
}

// ── Projects ──

export interface CreateProjectPayload {
  name: string
  niche: string
  location?: string
  persona?: string
  website?: string
  instagram_handle?: string
  tiktok_handle?: string
  youtube_handle?: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  niche: string
  location: string | null
  persona: string | null
  website: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_handle: string | null
  created_at: string
}

export function getProjects() {
  return request<{ message: string; data: Project[] }>('/projects')
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
  data: { runs: Array<{ query: string; platform: string; strategy: string; runId: string }> }
}

export interface DiscoverPayload {
  niche: string
  location?: string
  project_id?: string
  persona?: string
  instagram_handle?: string
  tiktok_handle?: string
  youtube_handle?: string
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
}

export function getCompetitors(projectId: string) {
  return request<{ data: Competitor[] }>(`/projects/${projectId}/competitors`)
}

// ── Profile ──

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  biography: string | null
  persona: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_handle: string | null
  followers_count: number | null
  following_count: number | null
  posts_count: number | null
  is_verified: boolean
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
