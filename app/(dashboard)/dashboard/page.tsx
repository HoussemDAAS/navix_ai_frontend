'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getProfile, getProjects, type Profile, type Project } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { ContinueIsland } from '@/components/dashboard/ContinueIsland'
import { IdentityStrip } from '@/components/dashboard/IdentityStrip'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { StatTiles, type StatTileData } from '@/components/dashboard/StatTiles'
import { fetchProjectStats } from '@/components/dashboard/utils'
import type { ProjectStats } from '@/components/dashboard/types'

/** Per-project fan-out is capped so the dashboard stays a handful of requests. */
const STATS_WINDOW = 6

const ctaClasses =
  'inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Record<string, ProjectStats>>({})
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [projectsRes, profileRes] = await Promise.all([
          getProjects(),
          // A missing profile must never blank the page — the rest still renders.
          getProfile().catch(() => ({ data: null as Profile | null })),
        ])
        if (cancelled) return
        setProjects(projectsRes.data ?? [])
        setProfile(profileRes.data ?? null)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Something went wrong loading your dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const recentProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [projects],
  )

  const statsWindow = useMemo(
    () => recentProjects.slice(0, STATS_WINDOW),
    [recentProjects],
  )

  useEffect(() => {
    if (loading) return
    if (statsWindow.length === 0) {
      setStats({})
      setStatsLoading(false)
      return
    }

    let cancelled = false
    setStatsLoading(true)

    Promise.all(statsWindow.map((p) => fetchProjectStats(p.id)))
      .then((results) => {
        if (cancelled) return
        setStats(Object.fromEntries(results.map((s) => [s.projectId, s])))
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load project stats:', err)
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [statsWindow, loading])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  const loadedStats = useMemo(() => Object.values(stats), [stats])

  // Tiles are built only from slices that actually came back — a failed request
  // hides its tile rather than reporting a zero the user would read as truth.
  const tiles = useMemo<StatTileData[]>(() => {
    const list: StatTileData[] = [
      {
        key: 'projects',
        label: 'Projects',
        value: projects.length,
        hint: projects.length === 1 ? 'workspace' : 'workspaces',
        icon: FolderOpen,
      },
    ]

    const competitorStats = loadedStats.filter((s) => s.competitorsOk)
    if (competitorStats.length > 0) {
      list.push({
        key: 'tracked',
        label: 'Competitors tracked',
        value: competitorStats.reduce((sum, s) => sum + s.competitorsTracked, 0),
        hint: 'validated by you',
        icon: Users,
      })
      list.push({
        key: 'found',
        label: 'Competitors found',
        value: competitorStats.reduce((sum, s) => sum + s.competitorsFound, 0),
        hint: 'discovered by Navix',
        icon: Search,
      })
    }

    const draftStats = loadedStats.filter((s) => s.draftsOk)
    if (draftStats.length > 0) {
      list.push({
        key: 'drafts',
        label: 'Drafts ready',
        value: draftStats.reduce((sum, s) => sum + s.draftsReady, 0),
        hint: 'awaiting review or approved',
        icon: FileText,
      })
    }

    return list
  }, [projects.length, loadedStats])

  const currentProject = recentProjects[0] ?? null
  const currentStats = currentProject ? (stats[currentProject.id] ?? null) : null

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hasProjects = projects.length > 0

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5 flex items-start justify-between gap-4 sm:mb-6"
      >
        <div className="min-w-0">
          <h1 className="text-h5 font-bold text-primary-900 sm:text-h4">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-body-2 text-alpha-60">
            {hasProjects
              ? `You have ${projects.length} active project${projects.length > 1 ? 's' : ''}`
              : "Let's get started with your first project"}
          </p>
        </div>
        {hasProjects && (
          <Link href="/projects" className={cn(ctaClasses, 'hidden shrink-0 sm:inline-flex')}>
            <Plus className="size-4" />
            New Project
          </Link>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col gap-3 rounded-[16px] border border-destructive-200 bg-destructive-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive-600" />
            <div>
              <p className="text-body-2 font-semibold text-destructive-700">
                We couldn&apos;t load your dashboard
              </p>
              <p className="mt-0.5 text-caption-1 text-destructive-600">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={retry}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] border border-destructive-200 bg-white px-4 py-2.5 text-caption-1 font-medium text-destructive-700 transition-colors hover:border-destructive-600"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        </motion.div>
      )}

      {/* Identity strip */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.4 }}
          className="mb-5 sm:mb-6"
        >
          <IdentityStrip profile={profile} />
        </motion.div>
      )}

      {hasProjects && (
        <>
          {/* Stat tiles */}
          <StatTiles
            tiles={tiles}
            loading={statsLoading}
            skeletonCount={4}
            className="mb-5 sm:mb-6"
          />

          {/* Continue where you left off */}
          {currentProject && currentStats && (
            <ContinueIsland
              project={currentProject}
              stats={currentStats}
              className="mb-7 sm:mb-8"
            />
          )}
          {currentProject && !currentStats && statsLoading && (
            <div className="mb-7 h-[168px] animate-pulse rounded-[20px] border border-alpha-10 bg-alpha-5 sm:mb-8" />
          )}
        </>
      )}

      {/* Projects grid or empty state */}
      {hasProjects ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16, duration: 0.4 }}
            className="mb-4 flex items-center justify-between gap-3"
          >
            <h2 className="text-subheadline font-semibold text-primary-900">Your projects</h2>
            {/* The header CTA is desktop-only — keep one reachable on small screens. */}
            <Link href="/projects" className={cn(ctaClasses, 'shrink-0 sm:hidden')}>
              <Plus className="size-4" />
              New
            </Link>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {recentProjects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                stats={stats[project.id] ?? null}
                statsPending={
                  statsLoading && statsWindow.some((p) => p.id === project.id)
                }
              />
            ))}
          </div>
        </>
      ) : (
        !error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-[20px] border border-alpha-10 bg-alpha-5/50 p-8"
          >
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Start by creating a project to discover competitors and generate content for your brand."
              action={
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-5 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
                >
                  <Plus className="size-4" />
                  Create Project
                  <ArrowRight className="size-4" />
                </Link>
              }
            />
          </motion.div>
        )
      )}
    </div>
  )
}
