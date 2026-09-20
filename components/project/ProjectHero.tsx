'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Clock, Instagram, MapPin, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'
import { formatCount, initialsOf } from '@/components/dashboard/utils'
import type { ProfilePersona, Project } from '@/lib/api'

const personaLabels: Record<ProfilePersona, string> = {
  ecommerce: 'E-commerce brand',
  agency: 'Client',
  creator: 'Creator',
}

/** "3 days ago" style label for the last data refresh. */
export function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const diffMs = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return null
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

interface ProjectHeroProps {
  project: Project
  persona: ProfilePersona | null
  className?: string
}

/**
 * The brand under analysis, as last scraped: photo, handle, audience size and
 * how fresh that data is. The same card serves a creator's own brand, a store,
 * or an agency's client — only the persona chip changes.
 */
export function ProjectHero({ project, persona, className }: ProjectHeroProps) {
  const [broken, setBroken] = useState(false)

  const src = avatarSrc(project.avatar_url || project.logo_url)
  const handle = project.instagram_handle || project.tiktok_handle
  const updated = relativeTime(project.last_scraped_at)
  const stats = [
    project.followers_count != null && { label: 'Followers', value: project.followers_count },
    project.posts_count != null && { label: 'Posts', value: project.posts_count },
  ].filter((s): s is { label: string; value: number } => Boolean(s))

  return (
    <div
      className={cn(
        'rounded-[20px] border border-alpha-10 bg-gradient-header p-4 shadow-card sm:p-5',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
          {src && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={project.name}
              onError={() => setBroken(true)}
              className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-card sm:h-16 sm:w-16"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary-100 shadow-card sm:h-16 sm:w-16">
              <span className="text-body-1 font-bold text-primary-900">
                {initialsOf(project.name, handle || 'Navix')}
              </span>
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-body-1 font-bold text-primary-900 sm:text-subheadline">
                {project.name}
              </p>
              {project.is_verified && (
                <BadgeCheck className="size-4 shrink-0 text-info-500" aria-label="Verified" />
              )}
            </div>

            {handle && (
              <p className="mt-0.5 flex items-center gap-1 text-caption-1 text-alpha-60">
                <Instagram className="size-3.5 shrink-0" />
                <span className="truncate">@{handle}</span>
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {persona && (
                <span className="inline-flex items-center rounded-full border border-primary-900 bg-secondary-300 px-2.5 py-0.5 text-caption-2 font-semibold text-primary-900">
                  {personaLabels[persona]}
                </span>
              )}
              {project.niche && (
                <span className="inline-flex items-center gap-1 rounded-full border border-alpha-10 bg-white/70 px-2.5 py-0.5 text-caption-2 font-medium text-alpha-60">
                  <Target className="size-3 shrink-0" />
                  <span className="max-w-[160px] truncate">{project.niche}</span>
                </span>
              )}
              {project.location && (
                <span className="inline-flex items-center gap-1 rounded-full border border-alpha-10 bg-white/70 px-2.5 py-0.5 text-caption-2 font-medium text-alpha-60">
                  <MapPin className="size-3 shrink-0" />
                  {project.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-alpha-10 pt-3 sm:gap-6 sm:border-t-0 sm:pt-0">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-h6 font-bold leading-none text-primary-900">
                {formatCount(stat.value)}
              </p>
              <p className="mt-1 text-caption-2 text-alpha-60">{stat.label}</p>
            </div>
          ))}
          <Link
            href={`/projects/${project.id}/profile`}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-primary-900 bg-white px-3.5 py-2 text-caption-1 font-semibold text-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-50 hover:shadow-[0px_3px_0px_0px_#191a23] active:translate-y-[2px] active:shadow-none"
          >
            Full profile
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Honesty line: every number above is a snapshot, and this says how old it is */}
      <p className="mt-3 flex items-center gap-1.5 text-caption-2 text-alpha-60">
        <Clock className="size-3 shrink-0" />
        {updated ? `Data updated ${updated}` : 'No scraped data yet'}
      </p>
    </div>
  )
}
