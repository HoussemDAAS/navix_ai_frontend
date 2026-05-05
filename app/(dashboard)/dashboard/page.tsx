'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FolderOpen, Plus, ArrowRight, MapPin, Instagram, Globe, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getProjects, getProfile, type Project, type Profile } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const platforms = [
    project.instagram_handle && 'Instagram',
    project.tiktok_handle && 'TikTok',
    project.youtube_handle && 'YouTube',
  ].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.4 }}
    >
      <Link
        href={`/projects/${project.id}`}
        className="group flex flex-col justify-between rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card transition-all duration-200 hover:border-alpha-20 hover:shadow-md h-full"
      >
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary-300/20">
              <FolderOpen className="size-5 text-primary-900" />
            </div>
            <ArrowRight className="size-4 text-alpha-30 group-hover:text-primary-900 group-hover:translate-x-0.5 transition-all" />
          </div>

          <h3 className="text-subheadline font-semibold text-primary-900 mb-1">
            {project.name}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 px-2.5 py-1 text-caption-2 font-medium text-alpha-60">
              <Globe className="size-3" />
              {project.niche}
            </span>
            {project.location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 px-2.5 py-1 text-caption-2 font-medium text-alpha-60">
                <MapPin className="size-3" />
                {project.location}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-alpha-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full bg-alpha-5 px-2 py-0.5 text-caption-2 text-alpha-60"
              >
                {p}
              </span>
            ))}
          </div>
          <span className="text-caption-2 text-alpha-30">
            {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, profileRes] = await Promise.all([
          getProjects(),
          getProfile(),
        ])
        setProjects(projectsRes.data)
        setProfile(profileRes.data)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8 sm:mb-10"
      >
        <div>
          <h1 className="text-h5 sm:text-h4 font-bold text-primary-900">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-body-2 text-alpha-60">
            {projects.length > 0
              ? `You have ${projects.length} active project${projects.length > 1 ? 's' : ''}`
              : "Let's get started with your first project"}
          </p>
        </div>
        {projects.length > 0 && (
          <Link
            href="/projects"
            className="hidden sm:inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
          >
            <Plus className="size-4" />
            New Project
          </Link>
        )}
      </motion.div>

      {/* Projects grid or empty state */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      ) : (
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
      )}
    </div>
  )
}
