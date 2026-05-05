'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Palette,
  BarChart3,
  Lightbulb,
  FileText,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Lock,
  MapPin,
  Target,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { getProject, getCompetitors, type Project, type Competitor } from '@/lib/api'

interface PipelineStep {
  label: string
  href: (id: string) => string
  icon: React.ElementType
  status: 'completed' | 'current' | 'locked'
}

interface QuickLink {
  label: string
  description: string
  href: (id: string) => string
  icon: React.ElementType
}

const quickLinks: QuickLink[] = [
  { label: 'Competitors', description: 'View and manage tracked competitors', href: (id) => `/projects/${id}/competitors`, icon: Users },
  { label: 'Brand Kit', description: 'Define your voice, tone, and identity', href: (id) => `/projects/${id}/brand-kit`, icon: Palette },
  { label: 'Analysis', description: 'Market insights and opportunity gaps', href: (id) => `/projects/${id}/analysis`, icon: BarChart3 },
  { label: 'Co-creation', description: 'Generate creative directions', href: (id) => `/projects/${id}/co-creation`, icon: Lightbulb },
  { label: 'Drafts', description: 'Edit and refine your content', href: (id) => `/projects/${id}/drafts`, icon: FileText },
  { label: 'Calendar', description: 'Plan and export your editorial calendar', href: (id) => `/projects/${id}/calendar`, icon: Calendar },
]

export default function ProjectOverviewPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, competitorsRes] = await Promise.all([
          getProject(projectId),
          getCompetitors(projectId).catch(() => ({ data: [] as Competitor[] })),
        ])
        setProject(projectRes.data)
        setCompetitors(competitorsRes.data || [])
      } catch (err) {
        console.error('Failed to load project:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [projectId])

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardShell>
    )
  }

  if (!project) {
    return (
      <DashboardShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center px-5">
          <h2 className="text-h5 font-bold text-primary-900">Project not found</h2>
          <p className="text-body-2 text-alpha-60">This project doesn&apos;t exist or you don&apos;t have access.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-5 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 active:translate-y-[2px]"
          >
            Back to Dashboard
          </Link>
        </div>
      </DashboardShell>
    )
  }

  const hasCompetitors = competitors.length > 0
  const platforms = [...new Set(competitors.map((c) => c.platform?.toLowerCase()).filter(Boolean))]

  const pipelineSteps: PipelineStep[] = [
    { label: 'Competitors', href: (id) => `/projects/${id}/competitors`, icon: Users, status: hasCompetitors ? 'completed' : 'current' },
    { label: 'Brand Kit', href: (id) => `/projects/${id}/brand-kit`, icon: Palette, status: hasCompetitors ? 'current' : 'locked' },
    { label: 'Analysis', href: (id) => `/projects/${id}/analysis`, icon: BarChart3, status: 'locked' },
    { label: 'Co-creation', href: (id) => `/projects/${id}/co-creation`, icon: Lightbulb, status: 'locked' },
    { label: 'Drafts', href: (id) => `/projects/${id}/drafts`, icon: FileText, status: 'locked' },
    { label: 'Calendar', href: (id) => `/projects/${id}/calendar`, icon: Calendar, status: 'locked' },
  ]

  return (
    <DashboardShell>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-h5 sm:text-h4 font-bold text-primary-900">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {project.niche && (
                <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 border border-alpha-10 px-3 py-1 text-caption-2 font-medium text-alpha-60">
                  <Target className="size-3" />
                  {project.niche}
                </span>
              )}
              {project.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 border border-alpha-10 px-3 py-1 text-caption-2 font-medium text-alpha-60">
                  <MapPin className="size-3" />
                  {project.location}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Progress Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-[16px] border border-alpha-10 bg-white p-4 sm:p-6 shadow-card overflow-x-auto">
            <p className="text-caption-1 font-semibold text-alpha-60 mb-4 uppercase tracking-wide">
              Project Pipeline
            </p>
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              {pipelineSteps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div key={step.label} className="flex items-center gap-2 sm:gap-3">
                    <Link
                      href={step.status !== 'locked' ? step.href(projectId) : '#'}
                      onClick={(e) => { if (step.status === 'locked') e.preventDefault() }}
                      className={cn(
                        'flex items-center gap-2 rounded-[10px] px-3 py-2 text-caption-1 font-medium transition-all',
                        step.status === 'completed' && 'bg-success-50 text-success-700 border border-success-200',
                        step.status === 'current' && 'bg-secondary-300/20 text-primary-900 border border-secondary-400',
                        step.status === 'locked' && 'bg-alpha-5 text-alpha-30 cursor-not-allowed border border-transparent'
                      )}
                    >
                      {step.status === 'completed' && <CheckCircle2 className="size-3.5" />}
                      {step.status === 'current' && <StepIcon className="size-3.5" />}
                      {step.status === 'locked' && <Lock className="size-3.5" />}
                      <span className="hidden sm:inline">{step.label}</span>
                    </Link>
                    {index < pipelineSteps.length - 1 && (
                      <div className={cn(
                        'w-4 sm:w-6 h-px',
                        index < pipelineSteps.findIndex((s) => s.status === 'current')
                          ? 'bg-success-300'
                          : 'bg-alpha-10'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          <div className="rounded-[16px] border border-alpha-10 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-info-50">
                <Users className="size-5 text-info-500" />
              </div>
              <div>
                <p className="text-caption-1 text-alpha-60 font-medium">Competitors Tracked</p>
                <p className="text-h6 font-bold text-primary-900">{competitors.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] border border-alpha-10 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary-50">
                <Target className="size-5 text-primary-900" />
              </div>
              <div>
                <p className="text-caption-1 text-alpha-60 font-medium">Platforms</p>
                {platforms.length > 0 ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    {platforms.map((p) => (
                      <span key={p} className="text-caption-1 font-semibold text-primary-900 capitalize">{p}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-h6 font-bold text-primary-900">-</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Step CTA */}
        {hasCompetitors && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-8"
          >
            <div className="rounded-[16px] border border-secondary-400 bg-secondary-50 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-secondary-300/30">
                    <Palette className="size-5 text-primary-900" />
                  </div>
                  <div>
                    <h3 className="text-subheadline font-semibold text-primary-900">
                      Set up your Brand Kit
                    </h3>
                    <p className="text-body-2 text-alpha-60 mt-1">
                      Define your brand voice, tone, and identity to generate content that sounds like you.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/projects/${projectId}/brand-kit`}
                  className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-5 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] shrink-0"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <h2 className="text-subheadline font-semibold text-primary-900 mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const LinkIcon = link.icon
              return (
                <Link key={link.label} href={link.href(projectId)}>
                  <div className="rounded-[12px] border border-alpha-10 bg-white p-4 shadow-card hover:border-secondary-400 hover:shadow-sm transition-all duration-200 group h-full">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-alpha-5 group-hover:bg-secondary-300/20 transition-colors">
                        <LinkIcon className="size-4 text-alpha-60 group-hover:text-primary-900 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-caption-1 font-semibold text-primary-900">{link.label}</p>
                        <p className="text-caption-2 text-alpha-60 mt-0.5">{link.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
