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
import { ProductCategoryPicker } from '@/components/onboarding/ProductCategoryPicker'
import { SocialLinksStep } from '@/components/onboarding/SocialLinksStep'
import { LogoUploader } from '@/components/onboarding/LogoUploader'
import { TransitionStep } from '@/components/onboarding/TransitionStep'
import { updateProfile, getProjects, type Profile } from '@/lib/api'
import { useOnboardingStore } from '@/stores/onboarding'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tr', label: 'Turkish' },
  { code: 'pl', label: 'Polish' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'hi', label: 'Hindi' },
]

type StepIdx = 0 | 1 | 2 | 3

const TOTAL_STEPS = 4

export default function EcommerceOnboardingPage() {
  const router = useRouter()
  const draft = useOnboardingStore((s) => s.draft)
  const patchDraft = useOnboardingStore((s) => s.patchDraft)
  const setOnboardingStep = useOnboardingStore((s) => s.setOnboardingStep)
  const setPersona = useOnboardingStore((s) => s.setPersona)

  const [step, setStep] = useState<StepIdx>(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Keep the local store persona aligned in case the user landed here directly
  useEffect(() => {
    setPersona('ecommerce')
  }, [setPersona])

  function clearField(name: string) {
    setErrors((prev) => (prev[name] ? { ...prev, [name]: false } : prev))
  }

  /** Validates and PATCHes the profile. Rolls back local state on failure. */
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
        // The TransitionStep handles the actual redirect to the dashboard.
      } else {
        // Track in store for resume
        const onboardingStepMap = ['identity', 'identity', 'socials', 'scraping'] as const
        setOnboardingStep(onboardingStepMap[next])
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
    if (draft.languages.length === 0) newErrors.languages = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await save(
      {
        persona: 'ecommerce',
        entity_name: draft.entity_name.trim(),
        entity_logo_url: draft.entity_logo_url, // data URL. backend can swap later
        website_url: draft.website_url.trim() || null,
        country: draft.country,
        languages: draft.languages,
        onboarding_step: 'identity',
      },
      1,
    )
  }

  /* ── Step 2: Product ─────────────────────────────────────────────── */

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, boolean> = {}
    if (!draft.product_category) newErrors.product_category = true
    if (!draft.target_market.trim()) newErrors.target_market = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await save(
      {
        product_category: draft.product_category,
        product_subcategory: draft.product_subcategory || null,
        target_market: draft.target_market.trim(),
        niche: [draft.product_category, draft.product_subcategory]
          .filter(Boolean)
          .join(' / '),
        onboarding_step: 'socials',
      },
      2,
    )
  }

  /* ── Step 3: Socials ─────────────────────────────────────────────── */

  async function handleSocialsSubmit() {
    // Setting onboarding_step to 'scraping' makes the backend create the
    // project, scrape the pasted accounts and launch competitor discovery.
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
      3,
    )
  }

  /* ── Step 4: Transition ──────────────────────────────────────────── */

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
        <motion.div
          key="identity"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <StepShell
            step={1}
            total={TOTAL_STEPS}
            title="Tell us about your brand"
            subtitle="The basics. We use this to scope your competitor search and tailor every recommendation."
            onBack={() => router.push('/onboarding/account-type')}
            backLabel="Change account type"
          >
            <form onSubmit={handleIdentitySubmit} className="space-y-5">
              {/* Brand name */}
              <div className="space-y-1.5">
                <Label htmlFor="entity_name" className="text-caption-1 font-semibold text-primary-900">
                  Brand name
                </Label>
                <Input
                  id="entity_name"
                  size="lg"
                  placeholder="e.g. Bloom Cosmetics"
                  value={draft.entity_name}
                  onChange={(e) => {
                    patchDraft({ entity_name: e.target.value })
                    clearField('entity_name')
                  }}
                  error={errors.entity_name}
                />
                {errors.entity_name && (
                  <p className="text-caption-2 text-destructive-500">Brand name is required</p>
                )}
              </div>

              {/* Logo */}
              <LogoUploader
                value={draft.entity_logo_url}
                onChange={(url) => patchDraft({ entity_logo_url: url })}
              />

              {/* Website */}
              <div className="space-y-1.5">
                <Label htmlFor="website_url" className="text-caption-1 font-semibold text-primary-900">
                  Website
                  <span className="ml-1 text-caption-2 font-normal text-alpha-40">Optional</span>
                </Label>
                <Input
                  id="website_url"
                  size="lg"
                  type="url"
                  placeholder="https://yourbrand.com"
                  leadIcon={<Globe className="size-4" />}
                  value={draft.website_url}
                  onChange={(e) => patchDraft({ website_url: e.target.value })}
                />
              </div>

              {/* Country + language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-caption-1 font-semibold text-primary-900">
                    Primary market
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
                    Primary language
                  </Label>
                  <LanguagePicker
                    value={draft.languages[0] ?? 'en'}
                    onChange={(code) => {
                      patchDraft({ languages: [code] })
                      clearField('languages')
                    }}
                  />
                </div>
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
        <motion.div
          key="product"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <StepShell
            step={2}
            total={TOTAL_STEPS}
            title="What are you selling?"
            subtitle="Helps us pull the right competitors and find content that resonates with buyers like yours."
            onBack={() => setStep(0)}
          >
            <form onSubmit={handleProductSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-caption-1 font-semibold text-primary-900">
                  Product category
                </Label>
                <ProductCategoryPicker
                  category={draft.product_category || null}
                  subcategory={draft.product_subcategory || null}
                  onCategoryChange={(label) => {
                    patchDraft({ product_category: label, product_subcategory: '' })
                    clearField('product_category')
                  }}
                  onSubcategoryChange={(label) => patchDraft({ product_subcategory: label })}
                  error={errors.product_category}
                />
                {errors.product_category && (
                  <p className="text-caption-2 text-destructive-500">Pick a category to continue</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="target_market"
                  className="text-caption-1 font-semibold text-primary-900"
                >
                  Who&apos;s buying from you?
                </Label>
                <textarea
                  id="target_market"
                  rows={3}
                  value={draft.target_market}
                  onChange={(e) => {
                    patchDraft({ target_market: e.target.value })
                    clearField('target_market')
                  }}
                  placeholder="e.g. Women 22-35 in urban US cities who care about clean beauty and shop on Instagram."
                  className={cnTextarea(errors.target_market)}
                />
                {errors.target_market && (
                  <p className="text-caption-2 text-destructive-500">
                    Tell us who your ideal customer is
                  </p>
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

      {step === 2 && (
        <motion.div
          key="socials"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <StepShell
            step={3}
            total={TOTAL_STEPS}
            title="Where does your brand post?"
            subtitle="Paste the links to your profiles. We read your recent posts to learn your voice and find the accounts competing for your buyers."
            onBack={() => setStep(1)}
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
              descriptionPlaceholder="e.g. Handmade natural skincare for women 25–40 in Tunisia: routines, ingredient breakdowns, before/after results, launches."
            />
          </StepShell>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          key="transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <TransitionStep
            title="Studying your brand..."
            subtitle="We're analyzing your category and pulling the freshest competitor signals."
            durationMs={2500}
            onComplete={handleTransitionComplete}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function cnTextarea(error?: boolean): string {
  return [
    'w-full rounded-[12px] border bg-white px-4 py-3 text-body-2 text-primary-900 placeholder:text-alpha-40 outline-none transition-all resize-none shadow-card',
    error
      ? 'border-destructive-200 bg-destructive-50'
      : 'border-alpha-10 hover:border-alpha-20 focus:border-transparent focus:shadow-[0px_0px_0px_3px] focus:shadow-ring',
  ].join(' ')
}

/* ── Inline language picker ──────────────────────────────────────────── */

function LanguagePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (code: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none flex h-12 w-full items-center justify-between gap-2 rounded-[12px] border bg-white pl-4 pr-10 py-3 text-body-2 font-medium text-primary-900 border-alpha-10 shadow-card hover:border-alpha-20 focus:outline-none focus:border-transparent focus:shadow-[0px_0px_0px_3px] focus:shadow-ring"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-4 text-alpha-60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 8l4 4 4-4" />
      </svg>
    </div>
  )
}
