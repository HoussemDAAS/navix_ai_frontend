'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  FolderOpen,
  MapPin,
  Plus,
  Store,
  Target,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { invalidateWorkspace, useWorkspace } from '@/components/layout/WorkspaceContext'
import { LogoUploader } from '@/components/onboarding/LogoUploader'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { avatarSrc } from '@/lib/avatar'
import { createProject, type Project } from '@/lib/api'
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

const secondaryClasses =
  'inline-flex items-center gap-2 rounded-[12px] border border-alpha-10 bg-white px-4 py-2.5 text-caption-1 font-medium text-primary-900 transition-colors hover:border-primary-900'

/** What a client project IS. The AI reads the field and writes in that voice. */
type ClientType = 'ecommerce' | 'creator'

const CLIENT_TYPES: Array<{ value: ClientType; label: string; hint: string; icon: LucideIcon }> = [
  { value: 'ecommerce', label: 'Brand', hint: 'A business, a store, a company', icon: Store },
  { value: 'creator', label: 'Creator', hint: 'A person with an audience', icon: UserRound },
]

/** Prefilled values, e.g. when an agency adds itself as a client */
interface ProjectDraft {
  name?: string
  logo_url?: string | null
  website?: string | null
  location?: string | null
  persona?: ClientType
}

function NewProjectModal({
  isAgency,
  initial,
  onClose,
  onCreated,
}: {
  isAgency: boolean
  initial?: ProjectDraft
  onClose: () => void
  onCreated: (project: Project) => void
}) {
  const [type, setType] = useState<ClientType>(initial?.persona ?? 'ecommerce')
  const [name, setName] = useState(initial?.name ?? '')
  const [logo, setLogo] = useState<string | null>(initial?.logo_url ?? null)
  const [niche, setNiche] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [seeds, setSeeds] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const noun = isAgency ? 'client' : 'project'

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
      // The API creates the project, reads its accounts and starts the discovery
      const res = await createProject({
        name: name.trim(),
        niche: niche.trim(),
        niche_description: description.trim() || undefined,
        location: location.trim() || undefined,
        instagram_handle: toHandle(instagram),
        tiktok_handle: toHandle(tiktok),
        seed_accounts: seedAccounts.length ? seedAccounts : undefined,
        persona: isAgency ? type : undefined,
        logo_url: logo ?? undefined,
        website: initial?.website?.trim() || undefined,
      })
      onCreated(res.data)
    } catch (err) {
      setError((err as Error).message || `Failed to create ${noun}.`)
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
        className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-[16px] border border-alpha-10 bg-white shadow-card"
      >
        <div className="flex items-center justify-between border-b border-alpha-10 px-5 py-4">
          <h2 className="text-subheadline font-semibold text-primary-900">
            {isAgency ? 'New client' : 'New project'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-alpha-60 hover:bg-alpha-5 hover:text-primary-900 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-5 py-5">
          {isAgency && (
            <div>
              <label className="mb-1.5 block text-caption-1 font-medium text-primary-900">
                This client is a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CLIENT_TYPES.map((opt) => {
                  const selected = type === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      aria-pressed={selected}
                      className={cn(
                        'flex items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-left transition-colors',
                        selected
                          ? 'border-primary-900 bg-secondary-300/20'
                          : 'border-alpha-10 bg-white hover:border-primary-900',
                      )}
                    >
                      <opt.icon className="size-4 shrink-0 text-primary-900" />
                      <span className="min-w-0">
                        <span className="block text-caption-1 font-semibold text-primary-900">{opt.label}</span>
                        <span className="block truncate text-caption-2 text-alpha-60">{opt.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-caption-1 font-medium text-primary-900">
              {isAgency ? 'Client name' : 'Project name'}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAgency ? 'e.g. Nexgen Studios' : 'e.g. My skincare brand'}
              className={inputClasses}
              autoFocus
            />
          </div>
          <LogoUploader value={logo} onChange={setLogo} label="Logo" />
          <div>
            <label className="mb-1.5 block text-caption-1 font-medium text-primary-900">
              Niche <span className="font-normal text-alpha-60">(be specific: better competitors)</span>
            </label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Organic skincare, natural cosmetics"
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-caption-1 font-medium text-primary-900">
              What is this {type === 'creator' && isAgency ? 'creator' : 'brand'} about?{' '}
              <span className="font-normal text-alpha-60">(optional, improves matches)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Handmade natural skincare for women 25 to 40, sold online in Tunisia"
              className={inputClasses + ' resize-none'}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-caption-1 font-medium text-primary-900">
              Country <span className="font-normal text-alpha-60">(optional)</span>
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
              <label className="mb-1.5 block text-caption-1 font-medium text-primary-900">
                Instagram <span className="font-normal text-alpha-60">(optional)</span>
              </label>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="link or @handle"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-caption-1 font-medium text-primary-900">
                TikTok <span className="font-normal text-alpha-60">(optional)</span>
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
            <label className="mb-1.5 block text-caption-1 font-medium text-primary-900">
              Accounts to benchmark{' '}
              <span className="font-normal text-alpha-60">(optional: links or @handles, one per line)</span>
            </label>
            <textarea
              value={seeds}
              onChange={(e) => setSeeds(e.target.value)}
              rows={2}
              placeholder={'https://instagram.com/competitor-one\n@competitor_two'}
              className={inputClasses + ' resize-none'}
            />
          </div>

          {error && <p className="text-caption-1 text-destructive-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] px-4 py-2.5 text-caption-1 font-medium text-alpha-60 transition-colors hover:text-primary-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={ctaClasses + ' disabled:opacity-60 disabled:pointer-events-none'}
            >
              {submitting ? <Spinner size="sm" /> : <Plus className="size-4" />}
              {submitting ? 'Creating...' : 'Create & find competitors'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ProjectThumb({ project }: { project: Project }) {
  const [broken, setBroken] = useState(false)
  const src = avatarSrc(project.logo_url || project.avatar_url)
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={project.name}
        onError={() => setBroken(true)}
        className="size-11 shrink-0 rounded-[12px] border border-alpha-10 object-cover"
      />
    )
  }
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-primary-900 text-caption-1 font-bold text-secondary-300">
      {project.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('') || 'C'}
    </span>
  )
}

function ProjectsContent() {
  const router = useRouter()
  const { projects, profile, loading, error, refresh, persona, singleBrand, primaryProject } =
    useWorkspace()
  const [modal, setModal] = useState<{ open: boolean; initial?: ProjectDraft }>({ open: false })

  // Single-brand accounts have exactly one project and never pick from a list.
  const redirectTo = singleBrand && primaryProject ? `/projects/${primaryProject.id}` : null
  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  const isAgency = persona === 'agency'
  const noun = isAgency ? 'client' : 'project'

  function openNew() {
    setModal({ open: true })
  }

  // The agency's own accounts, as one more client: nothing automatic, one click
  function openSelfAsClient() {
    setModal({
      open: true,
      initial: {
        name: profile?.entity_name ?? '',
        logo_url: profile?.entity_logo_url ?? null,
        website: profile?.website_url ?? null,
        location: profile?.country ?? null,
        persona: 'ecommerce',
      },
    })
  }

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
      <div className="max-w-[1100px] px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-h5 font-bold text-primary-900 sm:text-h4">
              {isAgency ? 'Your clients' : 'Your projects'}
            </h1>
            <p className="mt-1.5 text-body-2 text-alpha-60">
              {isAgency
                ? 'The brands and creators you run content for, one workspace each.'
                : 'Manage your competitive intelligence projects'}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {isAgency && (
              <button type="button" onClick={openSelfAsClient} className={secondaryClasses}>
                <Building2 className="size-4" />
                Add my agency as a client
              </button>
            )}
            <button type="button" onClick={openNew} className={ctaClasses}>
              <Plus className="size-4" />
              New {noun}
            </button>
          </div>
        </motion.div>

        {loading && (
          <div className="flex h-[40vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[12px] border border-alpha-10 bg-alpha-5/50 p-8 text-center">
            <p className="mb-4 text-body-2 text-alpha-60">Couldn&apos;t load your {noun}s.</p>
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
                  ? 'Tell Navix who the client is and where they post. It reads their accounts, finds their competitors, and every AI feature speaks in their voice.'
                  : 'Start by setting up a project to discover competitors and generate content for your brand.'
              }
              action={
                <button type="button" onClick={openNew} className={ctaClasses}>
                  <Plus className="size-4" />
                  New {noun}
                  <ArrowRight className="size-4" />
                </button>
              }
            />
          </motion.div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
              >
                <Link href={`/projects/${project.id}`}>
                  <div className="group h-full rounded-[16px] border border-alpha-10 bg-white p-5 shadow-card transition-all duration-200 hover:border-secondary-400">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <ProjectThumb project={project} />
                        <div className="min-w-0">
                          <p className="truncate text-subheadline font-semibold text-primary-900">
                            {project.name}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {isAgency && (
                              <span className="inline-flex items-center rounded-full border border-primary-900 bg-secondary-300 px-2.5 py-0.5 text-caption-2 font-semibold text-primary-900">
                                {project.persona === 'creator' ? 'Creator' : 'Brand'}
                              </span>
                            )}
                            {project.niche && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-alpha-10 bg-alpha-5 px-2.5 py-0.5 text-caption-2 font-medium text-alpha-60">
                                <Target className="size-3" />
                                {project.niche}
                              </span>
                            )}
                            {project.location && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-alpha-10 bg-alpha-5 px-2.5 py-0.5 text-caption-2 font-medium text-alpha-60">
                                <MapPin className="size-3" />
                                {project.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-alpha-30 transition-all group-hover:translate-x-0.5 group-hover:text-primary-900" />
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
          onClick={openNew}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full border border-primary-900 bg-secondary-300 text-primary-900 shadow-signature sm:hidden"
          aria-label={`New ${noun}`}
        >
          <Plus className="size-6" />
        </button>

        {modal.open && (
          <NewProjectModal
            isAgency={isAgency}
            initial={modal.initial}
            onClose={() => setModal({ open: false })}
            onCreated={handleCreated}
          />
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
