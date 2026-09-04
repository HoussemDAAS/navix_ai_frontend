'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StepShell } from '@/components/onboarding/StepShell'
import { LimeButton } from '@/components/onboarding/LimeButton'
import { CountryPicker } from '@/components/onboarding/CountryPicker'
import { SocialLinksStep } from '@/components/onboarding/SocialLinksStep'
import { LogoUploader } from '@/components/onboarding/LogoUploader'
import { TransitionStep } from '@/components/onboarding/TransitionStep'
import { cn } from '@/lib/utils'
import { updateProfile, getProjects, type Profile } from '@/lib/api'
import { useOnboardingStore } from '@/stores/onboarding'

const AGENCY_NICHES = [
  'Multi-niche / General',
  'Beauty & Skincare',
  'Fashion & Apparel',
  'Food & Restaurant',
  'Real Estate',
  'Health & Fitness',
  'Tech & SaaS',
  'Travel & Hospitality',
  'Education & EdTech',
  'Finance & Fintech',
  'E-commerce (DTC)',
  'Local services',
  'B2B services',
  'Entertainment & Media',
]

type StepIdx = 0 | 1 | 2

const TOTAL_STEPS = 3

export default function AgencyOnboardingPage() {
  const router = useRouter()
  const draft = useOnboardingStore((s) => s.draft)
  const patchDraft = useOnboardingStore((s) => s.patchDraft)
  const setOnboardingStep = useOnboardingStore((s) => s.setOnboardingStep)
  const setPersona = useOnboardingStore((s) => s.setPersona)

  const [step, setStep] = useState<StepIdx>(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setPersona('agency')
  }, [setPersona])

  function clearField(name: string) {
    setErrors((prev) => (prev[name] ? { ...prev, [name]: false } : prev))
  }

  async function save(
    patch: Partial<Omit<Profile, 'id'>>,
    next: StepIdx | 'done',
  ): Promise<void> {
    setSaving(true)
    setError(null)
    try {
      await updateProfile(patch)
      if (next === 'done') {
        setOnboardingStep('completed')
      } else {
        const stepMap = ['identity', 'socials', 'scraping'] as const
        setOnboardingStep(stepMap[next])
        setStep(next)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  /* ── Step 1: Identity ────────────────────────────────────────────── */

  async function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, boolean> = {}
    if (!draft.entity_name.trim()) newErrors.entity_name = true
    if (!draft.country) newErrors.country = true
    if (!draft.niche) newErrors.niche = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await save(
      {
        persona: 'agency',
        entity_name: draft.entity_name.trim(),
        entity_logo_url: draft.entity_logo_url,
        website_url: draft.website_url.trim() || null,
        country: draft.country,
        niche: draft.niche,
        onboarding_step: 'socials',
      },
      1,
    )
  }

  /* ── Step 2: Socials ─────────────────────────────────────────────── */

  async function handleSocialsSubmit() {
    // Setting onboarding_step to 'scraping' makes the backend create the
    // agency workspace, scrape the pasted accounts and launch discovery.
    const links = draft.has_social_presence
      ? draft.social_links.map((l) => l.trim()).filter(Boolean)
      : []
    await save(
      {
        social_links: links,
        has_social_presence: draft.has_social_presence,
        niche_description: draft.niche_description.trim() || null,
        keywords: draft.keywords,
        seed_accounts: draft.seed_accounts.map((s) => s.trim()).filter(Boolean),
        onboarding_step: 'scraping',
      },
      2,
    )
  }

  async function handleTransitionComplete() {
    try {
      await updateProfile({
        onboarding_step: 'completed',
        onboarding_completed: true,
      })
      setOnboardingStep('completed')
    } catch {
      // If the final patch fails, still try to route the user forward.
    }
    try {
      const projects = await getProjects()
      const first = projects.data?.[0]
      if (first) {
        router.replace(`/projects/${first.id}/competitors`)
        return
      }
    } catch {
      // Fall through to dashboard.
    }
    router.replace('/dashboard')
  }

  return (
    <AnimatePresence mode="wait">
      {step === 0 && (
        <motion.div key="identity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <StepShell
            step={1}
            total={TOTAL_STEPS}
            title="Tell us about your agency"
            subtitle="Set up your workspace once. You'll spin up a fresh project for each client right from your dashboard."
            onBack={() => router.push('/onboarding/account-type')}
            backLabel="Change account type"
          >
            <form onSubmit={handleIdentitySubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="agency_name" className="text-caption-1 font-semibold text-primary-900">
                  Agency name
                </Label>
                <Input
                  id="agency_name"
                  size="lg"
                  placeholder="e.g. Northwind Studio"
                  value={draft.entity_name}
                  onChange={(e) => {
                    patchDraft({ entity_name: e.target.value })
                    clearField('entity_name')
                  }}
                  error={errors.entity_name}
                />
                {errors.entity_name && (
                  <p className="text-caption-2 text-destructive-500">Agency name is required</p>
                )}
              </div>

              <LogoUploader
                value={draft.entity_logo_url}
                onChange={(url) => patchDraft({ entity_logo_url: url })}
                label="Agency logo"
              />

              <div className="space-y-1.5">
                <Label htmlFor="agency_website" className="text-caption-1 font-semibold text-primary-900">
                  Website
                  <span className="ml-1 text-caption-2 font-normal text-alpha-40">Optional</span>
                </Label>
                <Input
                  id="agency_website"
                  size="lg"
                  type="url"
                  placeholder="https://yourstudio.com"
                  leadIcon={<Globe className="size-4" />}
                  value={draft.website_url}
                  onChange={(e) => patchDraft({ website_url: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption-1 font-semibold text-primary-900">
                  Country
                </Label>
                <CountryPicker
                  value={draft.country || null}
                  onChange={(code) => {
                    patchDraft({ country: code })
                    clearField('country')
                  }}
                  error={errors.country}
                />
                {errors.country && (
                  <p className="text-caption-2 text-destructive-500">Pick a country</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-caption-1 font-semibold text-primary-900">
                  Where do most of your clients live?
                </Label>
                <p className="text-caption-2 text-alpha-50 -mt-0.5 mb-1.5">
                  We use this as a starting point. You can change it per client project.
                </p>
                <div
                  className={cn(
                    'flex flex-wrap gap-1.5 rounded-[16px] border p-3 bg-alpha-5/40 transition-colors',
                    errors.niche ? 'border-destructive-200 bg-destructive-50/60' : 'border-alpha-10',
                  )}
                >
                  {AGENCY_NICHES.map((n) => {
                    const selected = draft.niche === n
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          patchDraft({ niche: n })
                          clearField('niche')
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-caption-1 font-medium transition-all duration-150 border whitespace-nowrap',
                          selected
                            ? 'bg-primary-900 text-white border-primary-900'
                            : 'bg-white border-alpha-10 text-primary-900 hover:border-primary-900',
                        )}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
                {errors.niche && (
                  <p className="text-caption-2 text-destructive-500">Pick at least one focus area</p>
                )}
              </div>

              {error && (
                <p className="text-caption-1 font-medium text-destructive-500">{error}</p>
              )}

              <div className="flex justify-end pt-2">
                <LimeButton type="submit" loading={saving}>
                  Continue
                  <ArrowRight className="size-4" />
                </LimeButton>
              </div>
            </form>
          </StepShell>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div key="socials" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <StepShell
            step={2}
            total={TOTAL_STEPS}
            title="Your agency's own channels"
            subtitle="Paste the links to your agency's profiles so we can learn from the work you publish. You'll add each client's accounts in their own project."
            onBack={() => setStep(0)}
          >
            <SocialLinksStep
              value={{
                social_links: draft.social_links,
                has_social_presence: draft.has_social_presence,
                niche_description: draft.niche_description,
                keywords: draft.keywords,
                seed_accounts: draft.seed_accounts,
              }}
              onChange={(patch) => patchDraft(patch)}
              onSubmit={handleSocialsSubmit}
              saving={saving}
              error={error}
              descriptionPlaceholder="e.g. Social media agency in Tunis for restaurants and beauty salons: reels, menu shoots, promo campaigns."
            />
          </StepShell>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <TransitionStep
            title="Setting up your agency workspace..."
            subtitle="Once you're in, hit New project to create a workspace for your first client."
            durationMs={2500}
            onComplete={handleTransitionComplete}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
