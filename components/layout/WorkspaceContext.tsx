'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getProfile, getProjects, type Profile, type Project, type ProfilePersona } from '@/lib/api'

/**
 * Account-level state shared by the shell: who is signed in, the persona they
 * chose at signup, and their projects. The persona decides the shape of the app:
 * single-brand accounts (creator, e-commerce) live inside one project, agencies
 * switch between clients.
 */
export interface Workspace {
  profile: Profile | null
  projects: Project[]
  primaryProject: Project | null
  persona: ProfilePersona | null
  singleBrand: boolean
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const WorkspaceContext = createContext<Workspace | null>(null)

// Shared across shell mounts: every project page mounts its own shell, so the
// sidebar paints instantly from the last answer and revalidates in the background.
let cache: { profile: Profile | null; projects: Project[] } | null = null

export function isSingleBrand(persona: ProfilePersona | null | undefined): boolean {
  return persona === 'creator' || persona === 'ecommerce'
}

/** Drop the shared cache, e.g. after the persona changes or a project is created. */
export function invalidateWorkspace() {
  cache = null
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(cache)
  const [loading, setLoading] = useState(cache === null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [profileRes, projectsRes] = await Promise.all([
        // A missing profile must never blank the shell
        getProfile().catch(() => ({ data: null as Profile | null })),
        getProjects(),
      ])
      cache = { profile: profileRes.data ?? null, projects: projectsRes.data ?? [] }
      setData(cache)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your workspace.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<Workspace>(() => {
    const projects = data?.projects ?? []
    const persona = data?.profile?.persona ?? null
    return {
      profile: data?.profile ?? null,
      projects,
      primaryProject: projects.find((p) => p.is_primary) ?? projects[0] ?? null,
      persona,
      singleBrand: isSingleBrand(persona),
      loading,
      error,
      refresh,
    }
  }, [data, loading, error, refresh])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): Workspace {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside DashboardShell')
  return ctx
}
