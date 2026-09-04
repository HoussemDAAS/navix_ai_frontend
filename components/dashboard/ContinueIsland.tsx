'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Calendar, FileText, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CompetitorAvatarStack } from './CompetitorAvatarStack'
import { resolveNextStep, stepHref } from './utils'
import type { PipelineStepKey, ProjectStats } from './types'
import type { Project } from '@/lib/api'

const stepCopy: Record<
  PipelineStepKey,
  { icon: LucideIcon; title: string; description: string; cta: string }
> = {
  competitors: {
    icon: Users,
    title: 'Find your competitors',
    description: 'Discover the accounts competing for your audience and pick who to track.',
    cta: 'Discover competitors',
  },
  analysis: {
    icon: BarChart3,
    title: 'Analyze your market',
    description: 'Turn the accounts you track into formats, hooks and opportunity gaps.',
    cta: 'Run market analysis',
  },
  drafts: {
    icon: FileText,
    title: 'Write your drafts',
    description: 'Co-create brand-consistent posts from your strongest content directions.',
    cta: 'Open drafts',
  },
  calendar: {
    icon: Calendar,
    title: 'Plan your calendar',
    description: 'Schedule the drafts you approved and export your editorial calendar.',
    cta: 'Open calendar',
  },
}

interface ContinueIslandProps {
  project: Project
  stats: ProjectStats
  className?: string
}

export function ContinueIsland({ project, stats, className }: ContinueIslandProps) {
  const step = resolveNextStep(stats)
  const copy = stepCopy[step]
  const StepIcon = copy.icon
  const running = stats.discoveryRunning

  const competitorCount =
    stats.competitorsTracked > 0 ? stats.competitorsTracked : stats.competitorsFound
  const competitorWord = stats.competitorsTracked > 0 ? 'tracked' : 'found'

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className={cn(
        'rounded-[20px] border border-primary-900 bg-white p-5 shadow-signature sm:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-caption-2 font-semibold uppercase tracking-wide text-alpha-50">
            Continue where you left off
          </p>

          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-primary-900 bg-secondary-300">
              <StepIcon className="size-4 text-primary-900" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-subheadline font-bold text-primary-900">{project.name}</p>
              <p className="text-caption-1 font-semibold text-secondary-700">
                {running ? 'Discovering competitors…' : `Next: ${copy.title}`}
              </p>
            </div>
          </div>

          <p className="mt-3 max-w-xl text-caption-1 leading-relaxed text-alpha-60">
            {running
              ? stats.discoveryMessage || 'Navix is scanning your niche for real competitor accounts.'
              : copy.description}
          </p>

          {running && (
            <div className="mt-3 max-w-xs">
              <Progress value={stats.discoveryProgress} />
              <p className="mt-1.5 text-caption-2 text-alpha-60">
                {Math.round(stats.discoveryProgress)}% complete
              </p>
            </div>
          )}

          {!running && competitorCount > 0 && stats.topCompetitors.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5">
              <CompetitorAvatarStack competitors={stats.topCompetitors} size="sm" />
              <span className="text-caption-2 text-alpha-60">
                {competitorCount} competitor{competitorCount === 1 ? '' : 's'} {competitorWord}
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          <Link
            href={stepHref(project.id, running ? 'competitors' : step)}
            className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
          >
            {running ? 'View discovery progress' : copy.cta}
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-[12px] border border-alpha-10 px-4 py-2.5 text-caption-1 font-medium text-alpha-60 transition-colors hover:border-primary-900 hover:text-primary-900"
          >
            Project overview
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
