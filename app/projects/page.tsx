'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, Plus, ArrowRight, MapPin, Target, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { invalidateWorkspace, useWorkspace } from '@/components/layout/WorkspaceContext'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import {
  createProject,
  discoverCompetitors,
  type Project,
} from '@/lib/api'
import { parseSocialLink } from '@/lib/social-links'

/** Accepts a full profile link or a bare @handle */
function toHandle(input: string): string | undefined {
  const v = input.trim()
  if (!v) return undefined
  const parsed = parseSocialLink(v)
  if (parsed) return parsed.handle
  return v.replace(/^@/, '')
}

const ctaClasses =
  'inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]'

function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (project: Project) => void
}) {
  const [name, setName] = useState('')
  const [niche, setNiche] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [seeds, setSeeds] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !niche.trim()) {
      setError('Name and niche are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const seedAccounts = seeds
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5)
      const res = await createProject({
        name: name.trim(),
        niche: niche.trim(),
        niche_description: description.trim() || undefined,
        location: location.trim() || undefined,
        instagram_handle: toHandle(instagram),
        tiktok_handle: toHandle(tiktok),
        seed_accounts: seedAccounts.length ? seedAccounts : undefined,
      })
      const project = res.data
      // Kick off competitor discovery right away so the competitors page
      // has something to poll for.
      discoverCompetitors({
        niche: project.niche,
        location: project.location ?? undefined,
        project_id: project.id,
        entity_name: project.name,
        niche_description: project.niche_description ?? undefined,
        instagram_handle: project.instagram_handle ?? undefined,
        tiktok_handle: project.tiktok_handle ?? undefined,
        seed_accounts: project.seed_accounts ?? undefined,
      }).catch(() => { /* non-fatal — user can retry from the competitors page */ })
      onCreated(project)
    } catch (err) {
      setError((err as Error).message || 'Failed to create project.')
      setSubmitting(false)
    }
  }

  const inputClasses =
    'w-full rounded-[10px] border border-alpha-10 bg-white px-3.5 py-2.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:outline-none focus:border-primary-900 transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-900/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-[16px] bg-white border border-alpha-10 shadow-card"
      >
        <div className="flex items-center justify-between border-b border-alpha-10 px-5 py-4">
          <h2 className="text-subheadline font-semibold text-primary-900">New Project</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-alpha-60 hover:bg-alpha-5 hover:text-primary-900 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-caption-1 font-medium text-primary-900 mb-1.5">
              Project name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client X — Skincare brand"
              className={inputClasses}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-caption-1 font-medium text-primary-900 mb-1.5">
              Niche <span className="text-alpha-60 font-normal">(be specific — better competitors)</span>
            </label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Organic skincare — natural cosmetics"
              className={inputClasses}
            />
          </div>
          <div>
            <label className="block text-caption-1 font-medium text-primary-900 mb-1.5">
              What is this brand about? <span className="text-alpha-60 font-normal">(optional, improves matches)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Handmade natural skincare for women 25–40, sold online in Tunisia"
              className={inputClasses + ' resize-none'}
            />
          </div>
          <div>
            <label className="block text-caption-1 font-medium text-primary-900 mb-1.5">
              Country <span className="text-alpha-60 font-normal">(optional)</span>
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Tunisia"
              className={inputClasses}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption-1 font-medium text-primary-900 mb-1.5">
                Instagram <span className="text-alpha-60 font-normal">(optional)</span>
              </label>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@handle"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-caption-1 font-medium text-primary-900 mb-1.5">
                TikTok <span className="text-alpha-60 font-normal">(optional)</span>
              </label>
              <input
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="link or @handle"
                className={inputClasses}
              />
            </div>
          </div>
          <div>
            <label className="block text-caption-1 font-medium text-primary-900 mb-1.5">
              Accounts to benchmark <span className="text-alpha-60 font-normal">(optional — links or @handles, one per line)</span>
            </label>
            <textarea
              value={seeds}
              onChange={(e) => setSeeds(e.target.value)}
              rows={2}
              placeholder={'https://instagram.com/competitor-one\n@competitor_two'}
              className={inputClasses + ' resize-none'}
            />
          </div>

          {error && (
            <p className="text-caption-1 text-destructive-600">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] px-4 py-2.5 text-caption-1 font-medium text-alpha-60 hover:text-primary-900 transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={ctaClasses + ' disabled:opacity-60 disabled:pointer-events-none'}>
              {submitting ? <Spinner size="sm" /> : <Plus className="size-4" />}
              {submitting ? 'Creating...' : 'Create & find competitors'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ProjectsContent() {
  const router = useRouter()
  const { projects, loading, error, refresh, persona, singleBrand, primaryProject } = useWorkspace()
  const [showModal, setShowModal] = useState(false)

  // Single-brand accounts have exactly one project and never pick from a list.
  const redirectTo = singleBrand && primaryProject ? `/projects/${primaryProject.id}` : null
  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  const isAgency = persona === 'agency'
  const noun = isAgency ? 'client' : 'project'

  function handleCreated(project: Project) {
    invalidateWorkspace()
    void refresh()
    router.push(`/projects/${project.id}/competitors`)
  }

  if (redirectTo) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-h5 sm:text-h4 font-bold text-primary-900">
              {isAgency ? 'Your clients' : 'Your projects'}
            </h1>
            <p className="mt-1.5 text-body-2 text-alpha-60">
              {isAgency
                ? 'The brands you run content for — one workspace each.'
                : 'Manage your competitive intelligence projects'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={'hidden sm:inline-flex ' + ctaClasses}
          >
            <Plus className="size-4" />
            New {noun}
          </button>
        </motion.div>

        {loading && (
          <div className="flex h-[40vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[12px] border border-alpha-10 bg-alpha-5/50 p-8 text-center">
            <p className="text-body-2 text-alpha-60 mb-4">Couldn&apos;t load your {noun}s.</p>
            <button
              type="button"
              onClick={() => {
                void refresh()
              }}
              className={ctaClasses}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-[12px] border border-alpha-10 bg-alpha-5/50"
          >
            <EmptyState
              icon={FolderOpen}
              title={isAgency ? 'Add your first client' : 'Create your first project'}
              description={
                isAgency
                  ? 'Each client gets its own workspace: competitors, analysis, directions and calendar.'
                  : 'Start by setting up a project to discover competitors and generate content for your brand.'
              }
              action={
                <button type="button" onClick={() => setShowModal(true)} className={ctaClasses}>
                  <Plus className="size-4" />
                  New {noun}
                  <ArrowRight className="size-4" />
                </button>
              }
            />
          </motion.div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
              >
                <Link href={`/projects/${project.id}`}>
                  <div className="rounded-[16px] border border-alpha-10 bg-white p-5 shadow-card hover:border-secondary-400 transition-all duration-200 group h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-subheadline font-semibold text-primary-900 truncate">
                          {project.name}
                        </p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {project.niche && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 border border-alpha-10 px-2.5 py-0.5 text-caption-2 font-medium text-alpha-60">
                              <Target className="size-3" />
                              {project.niche}
                            </span>
                          )}
                          {project.location && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 border border-alpha-10 px-2.5 py-0.5 text-caption-2 font-medium text-alpha-60">
                              <MapPin className="size-3" />
                              {project.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-alpha-30 group-hover:text-primary-900 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Mobile FAB */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-6 sm:hidden flex h-14 w-14 items-center justify-center rounded-full bg-secondary-300 border border-primary-900 shadow-signature text-primary-900"
          aria-label="New project"
        >
          <Plus className="size-6" />
        </button>

        {showModal && (
          <NewProjectModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
        )}
      </div>
    </>
  )
}

export default function ProjectsPage() {
  return (
    <DashboardShell>
      <ProjectsContent />
    </DashboardShell>
  )
}
