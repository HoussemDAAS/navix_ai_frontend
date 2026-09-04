'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, FolderOpen, Globe, Loader2, MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PIPELINE_STEPS, completedSteps } from './utils'
import type { ProjectStats } from './types'
import type { Project } from '@/lib/api'

interface ProjectCardProps {
  project: Project
  /** Pipeline state — null when this project is outside the fetched window. */
  stats: ProjectStats | null
  /** True while this project's stats are still loading. */
  statsPending: boolean
  index: number
}

export function ProjectCard({ project, stats, statsPending, index }: ProjectCardProps) {
  const platforms = [
    project.instagram_handle && 'Instagram',
    project.tiktok_handle && 'TikTok',
    project.youtube_handle && 'YouTube',
  ].filter((p): p is string => Boolean(p))

  const completed = stats ? completedSteps(stats) : null
  const doneCount = completed ? PIPELINE_STEPS.filter((s) => completed[s.key]).length : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.4 }}
    >
      <Link
        href={`/projects/${project.id}`}
        className="group flex h-full flex-col justify-between rounded-[20px] border border-alpha-10 bg-white p-5 shadow-card transition-all duration-200 hover:border-alpha-20 hover:shadow-md sm:p-6"
      >
        <div>
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary-300/20">
              <FolderOpen className="size-5 text-primary-900" />
            </div>
            <ArrowRight className="size-4 text-alpha-30 transition-all group-hover:translate-x-0.5 group-hover:text-primary-900" />
          </div>

          <h3 className="mb-1 text-subheadline font-semibold text-primary-900">{project.name}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 px-2.5 py-1 text-caption-2 font-medium text-alpha-60">
              <Globe className="size-3 shrink-0" />
              {project.niche}
            </span>
            {project.location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 px-2.5 py-1 text-caption-2 font-medium text-alpha-60">
                <MapPin className="size-3 shrink-0" />
                {project.location}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          {statsPending && (
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="h-3.5 w-24 animate-pulse rounded bg-alpha-5" />
              <div className="h-3.5 w-14 animate-pulse rounded bg-alpha-5" />
            </div>
          )}

          {!statsPending && stats && completed && (
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-caption-2 font-medium text-alpha-60">
                {stats.discoveryRunning ? (
                  <>
                    <Loader2 className="size-3 shrink-0 animate-spin" />
                    Discovering…
                  </>
                ) : (
                  <>
                    <Users className="size-3 shrink-0" />
                    {stats.competitorsTracked > 0
                      ? `${stats.competitorsTracked} tracked`
                      : `${stats.competitorsFound} found`}
                  </>
                )}
              </span>

              <span
                className="flex items-center gap-1.5"
                aria-label={`${doneCount} of ${PIPELINE_STEPS.length} steps complete`}
              >
                {PIPELINE_STEPS.map((step) => (
                  <span
                    key={step.key}
                    title={step.label}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      completed[step.key] ? 'bg-secondary-400' : 'bg-alpha-20',
                    )}
                  />
                ))}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-alpha-10 pt-3">
            <div className="flex items-center gap-1.5">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full bg-alpha-5 px-2 py-0.5 text-caption-2 text-alpha-60"
                >
                  {platform}
                </span>
              ))}
            </div>
            <span className="shrink-0 text-caption-2 text-alpha-30">
              {new Date(project.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
