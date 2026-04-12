'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Instagram, Youtube, ArrowRight, Check, Search, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboarding'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import {
  scrapeProfile,
  createProject,
  discoverCompetitors,
  getCompetitors,
  updateProfile,
  type ScrapedProfile,
} from '@/lib/api'

/* ── Icons ── */

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.27 8.27 0 0 0 4.85 1.56V6.64a4.84 4.84 0 0 1-1.09.05Z" />
    </svg>
  )
}

/* ── Platform config ── */

type Platform = 'instagram' | 'tiktok' | 'youtube'

interface PlatformInfo {
  id: Platform
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  placeholder: string
}

const platforms: PlatformInfo[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="size-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200 hover:border-pink-400',
    placeholder: '@yourhandle',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: <TikTokIcon className="size-5" />,
    color: 'text-primary-900',
    bgColor: 'bg-alpha-5 border-alpha-10 hover:border-primary-900',
    placeholder: '@yourhandle',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: <Youtube className="size-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200 hover:border-red-400',
    placeholder: '@yourchannel',
  },
]

/* ── Niche data ── */

const creatorNiches = [
  'Fashion & Style', 'Beauty & Makeup', 'Fitness & Health', 'Travel',
  'Food & Cooking', 'Tech & Reviews', 'Gaming', 'Comedy',
  'Education', 'Lifestyle', 'Business', 'Art & Design',
  'Music', 'Parenting', 'Pets', 'Sports',
]

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Spain', 'Italy', 'Brazil', 'India', 'Japan', 'South Korea',
  'Mexico', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Switzerland', 'Austria', 'Belgium', 'Portugal', 'Ireland', 'Poland',
  'Turkey', 'Saudi Arabia', 'UAE', 'Egypt', 'South Africa', 'Nigeria',
  'Morocco', 'Tunisia', 'Argentina', 'Colombia', 'Chile', 'Indonesia',
  'Philippines', 'Thailand', 'Vietnam', 'Malaysia', 'Singapore', 'New Zealand',
]

/* ── Tips shown during discovery ── */

const tips = [
  { title: 'Post consistently', body: 'Accounts that post 4-7x per week grow 2x faster than those posting once.' },
  { title: 'Hook in 1 second', body: 'The first frame decides if people watch. Start with movement, text, or a question.' },
  { title: 'Reply to comments', body: 'Replying within the first hour boosts your post in the algorithm by up to 40%.' },
  { title: 'Use trending audio', body: 'Posts with trending sounds get 3x more reach on both TikTok and Reels.' },
  { title: 'Carousel > Single image', body: 'Instagram carousels get 1.4x more reach and 3.1x more engagement than single photos.' },
  { title: 'Optimal posting times', body: 'Tue-Thu 10am-1pm and 7-9pm are peak engagement windows for most niches.' },
]

/* ── Collapsed step pill ── */

function CollapsedStep({ label, index }: { label: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="w-full"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-alpha-5 border border-alpha-10">
        <div className="w-5 h-5 rounded-full bg-secondary-300 border border-primary-900 flex items-center justify-center shrink-0">
          <Check className="size-3 text-primary-900" strokeWidth={3} />
        </div>
        <span className="text-caption-1 font-medium text-alpha-60">
          Step {index + 1}: {label}
        </span>
      </div>
    </motion.div>
  )
}

/* ── Step card wrapper ── */

function StepCard({ children, active }: { children: React.ReactNode; active: boolean }) {
  if (!active) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div className="border border-black rounded-[28px] sm:rounded-[40px] shadow-signature bg-white p-5 sm:p-8">
        {children}
      </div>
    </motion.div>
  )
}

/* ── CTA Button ── */

function NextButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] disabled:opacity-40 disabled:pointer-events-none"
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="size-4 border-2 border-primary-900 border-t-transparent rounded-full"
        />
      ) : (
        children
      )}
    </button>
  )
}

/* ── Page ── */

export default function CreatorOnboardingPage() {
  const router = useRouter()
  const persona = useOnboardingStore((s) => s.persona)
  const setProjectId = useOnboardingStore((s) => s.setProjectId)
  const setRunIds = useOnboardingStore((s) => s.setRunIds)
  const setStep = useOnboardingStore((s) => s.setStep)

  const [step, setLocalStep] = useState(0) // 0-4
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set())
  const [handles, setHandles] = useState<Record<Platform, string>>({ instagram: '', tiktok: '', youtube: '' })
  const [niche, setNiche] = useState<string | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [profile, setProfile] = useState<ScrapedProfile | null>(null)
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [discovering, setDiscovering] = useState(false)
  const [competitorCount, setCompetitorCount] = useState(0)
  const [discoveryDone, setDiscoveryDone] = useState(false)
  const [tipIdx, setTipIdx] = useState(0)
  const [discoveryProgress, setDiscoveryProgress] = useState(10)
  const projectIdRef = useRef<string | null>(null)
  const discoveryStartRef = useRef(Date.now())

  useEffect(() => {
    if (!persona) router.replace('/onboarding/role')
  }, [persona, router])

  // Tip rotation during discovery
  useEffect(() => {
    if (step !== 4) return
    const timer = setInterval(() => setTipIdx((i) => (i + 1) % tips.length), 5000)
    return () => clearInterval(timer)
  }, [step])

  // Discovery progress animation
  useEffect(() => {
    if (step !== 4) return
    discoveryStartRef.current = Date.now()
    const timer = setInterval(() => {
      const elapsed = (Date.now() - discoveryStartRef.current) / 1000
      setDiscoveryProgress(Math.min(10 + (elapsed / 90) * 80, 90))
    }, 500)
    return () => clearInterval(timer)
  }, [step])

  // Poll competitors during discovery — triggered by discoveryProjectId state
  const [discoveryProjectId, setDiscoveryProjectId] = useState<string | null>(null)

  useEffect(() => {
    if (!discoveryProjectId) return
    const start = Date.now()
    const poll = setInterval(async () => {
      try {
        const result = await getCompetitors(discoveryProjectId)
        if (result.data && result.data.length > 0) {
          setCompetitorCount(result.data.length)
          if (result.data.length >= 5 || (Date.now() - start > 60_000)) {
            setDiscoveryDone(true)
            setDiscoveryProgress(100)
            clearInterval(poll)
            setTimeout(() => {
              router.push(`/projects/${discoveryProjectId}/competitors`)
            }, 2000)
          }
        }
      } catch { /* keep polling */ }
    }, 4000)
    return () => clearInterval(poll)
  }, [discoveryProjectId, router])

  if (!persona) return null

  // Get the primary handle (first selected platform)
  const primaryPlatform = [...selectedPlatforms][0]
  const primaryHandle = primaryPlatform ? handles[primaryPlatform] : ''

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  function normalizeHandle(h: string): string {
    // Extract handle from URL or clean up
    let handle = h.trim()
    // Handle full URLs
    try {
      const url = new URL(handle)
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts.length > 0) handle = parts[parts.length - 1]
    } catch {
      // Not a URL, use as-is
    }
    return handle.replace(/^@/, '')
  }

  async function handleScrapeProfile() {
    if (!primaryPlatform || !primaryHandle) return
    // Go to niche step first, scrape in background
    setLocalStep(2)
  }

  async function handleNicheNext() {
    if (!niche || !country) return
    setScraping(true)
    setScrapeError(null)
    setLocalStep(3)

    // Now scrape the profile
    try {
      const handle = normalizeHandle(primaryHandle)
      const result = await scrapeProfile(handle, primaryPlatform!)
      setProfile(result.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Profile scrape failed:', msg)
      setScrapeError(`Could not find this profile: ${msg}`)
    } finally {
      setScraping(false)
    }
  }

  async function handleStartDiscovery() {
    if (!niche || !country) return
    setLocalStep(4)
    setDiscovering(true)
    setStep(2)

    const nicheStr = niche
    try {
      const { data: project } = await createProject({
        name: profile?.full_name || normalizeHandle(primaryHandle),
        niche: nicheStr,
        location: country,
        persona: 'creator',
        instagram_handle: handles.instagram || undefined,
        tiktok_handle: handles.tiktok || undefined,
        youtube_handle: handles.youtube || undefined,
      })

      projectIdRef.current = project.id
      setProjectId(project.id)

      // Save profile BEFORE starting discovery polling to avoid race condition
      await updateProfile({
        persona: 'creator',
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        biography: profile?.biography || null,
        instagram_handle: handles.instagram || null,
        tiktok_handle: handles.tiktok || null,
        youtube_handle: handles.youtube || null,
        followers_count: profile?.followers_count || null,
        following_count: profile?.following_count || null,
        posts_count: profile?.posts_count || null,
        is_verified: profile?.is_verified || false,
        onboarding_completed: true,
      })

      const discovery = await discoverCompetitors({
        niche: nicheStr,
        location: country,
        project_id: project.id,
        persona: 'creator',
        instagram_handle: handles.instagram || undefined,
        tiktok_handle: handles.tiktok || undefined,
        youtube_handle: handles.youtube || undefined,
      })

      setRunIds(discovery.data.runs.map((r) => ({ runId: r.runId, platform: r.platform })))

      // Start polling AFTER profile is saved — polling redirect needs onboarding_completed=true
      setDiscoveryProjectId(project.id)
      setStep(3)
    } catch (err) {
      console.warn('Discovery failed:', err)
    }
  }

  function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  const stepLabels = ['Platforms', 'Your profiles', 'Niche & country', 'Confirm profile', 'Finding competitors']
  const progress = step === 4 ? discoveryProgress : (step / 4) * 80 + 10

  return (
    <>
      <ProgressBar percent={progress} />

      <div className="flex flex-col items-center px-4 sm:px-6 pt-4 sm:pt-8 pb-8">
        <div className="w-full max-w-[520px]">
          {/* Completed steps */}
          <div className="space-y-2 mb-4">
            {Array.from({ length: step }).map((_, i) => (
              <CollapsedStep key={i} label={stepLabels[i]} index={i} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 0: Platform selection ── */}
            <StepCard key="step-0" active={step === 0}>
              <h2 className="text-h5 font-bold text-primary-btn mb-1">
                Which platforms do you use?
              </h2>
              <p className="text-caption-1 text-alpha-60 mb-5">
                Select all that apply
              </p>

              <div className="space-y-2 mb-6">
                {platforms.map((p) => {
                  const isSelected = selectedPlatforms.has(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-3 rounded-[14px] border transition-all duration-150',
                        isSelected
                          ? 'bg-secondary-300 border-primary-900'
                          : p.bgColor,
                      )}
                    >
                      <span className={p.color}>{p.icon}</span>
                      <span className="text-body-2 font-medium text-primary-900 flex-1 text-left">
                        {p.label}
                      </span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-primary-900 flex items-center justify-center"
                        >
                          <Check className="size-3 text-secondary-300" strokeWidth={3} />
                        </motion.div>
                      )}
                    </button>
                  )
                })}
              </div>

              <NextButton
                onClick={() => setLocalStep(1)}
                disabled={selectedPlatforms.size === 0}
              >
                Continue <ArrowRight className="size-4" />
              </NextButton>
            </StepCard>

            {/* ── STEP 1: Profile links ── */}
            <StepCard key="step-1" active={step === 1}>
              <h2 className="text-h5 font-bold text-primary-btn mb-1">
                Link your profiles
              </h2>
              <p className="text-caption-1 text-alpha-60 mb-5">
                Paste your handle or profile URL
              </p>

              <div className="space-y-3 mb-6">
                {platforms.filter((p) => selectedPlatforms.has(p.id)).map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <span className={p.color}>{p.icon}</span>
                      {p.label}
                    </Label>
                    <Input
                      size="lg"
                      placeholder={p.placeholder}
                      value={handles[p.id]}
                      onChange={(e) => setHandles((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <NextButton
                onClick={handleScrapeProfile}
                disabled={!primaryHandle.trim()}
                loading={scraping}
              >
                {scraping ? 'Getting your profile...' : (
                  <>Continue <ArrowRight className="size-4" /></>
                )}
              </NextButton>

              {scrapeError && (
                <p className="text-caption-1 text-destructive-500 text-center mt-3">
                  {scrapeError}
                </p>
              )}
            </StepCard>

            {/* ── STEP 2: Niche & Country ── */}
            <StepCard key="step-2" active={step === 2}>
              <h2 className="text-h5 font-bold text-primary-btn mb-1">
                Tell us about your content
              </h2>
              <p className="text-caption-1 text-alpha-60 mb-5">
                This helps us find your real competitors
              </p>

              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <Label>What do you create?</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {creatorNiches.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNiche(n)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-caption-1 font-medium border transition-all duration-150',
                          niche === n
                            ? 'bg-primary-btn text-white border-primary-btn'
                            : 'border-alpha-10 text-primary-900 hover:border-primary-btn hover:bg-alpha-5',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Target country</Label>
                  <Select value={country || ''} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <NextButton
                onClick={handleNicheNext}
                disabled={!niche || !country}
              >
                Continue <ArrowRight className="size-4" />
              </NextButton>
            </StepCard>

            {/* ── STEP 3: Profile confirmation ── */}
            <StepCard key="step-3" active={step === 3}>
              {scraping ? (
                <div className="flex flex-col items-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="size-10 border-3 border-secondary-300 border-t-primary-btn rounded-full mb-4"
                  />
                  <p className="text-body-2 font-medium text-primary-btn">Getting your profile...</p>
                  <p className="text-caption-1 text-alpha-40 mt-1">This takes a few seconds</p>
                </div>
              ) : scrapeError ? (
                <div className="flex flex-col items-center py-6">
                  <p className="text-body-2 text-destructive-500 mb-4 text-center">{scrapeError}</p>
                  <NextButton onClick={() => { setScrapeError(null); setLocalStep(1) }}>
                    Try again
                  </NextButton>
                </div>
              ) : (
                <>
              <h2 className="text-h5 font-bold text-primary-btn mb-1 text-center">
                Is this you?
              </h2>
              <p className="text-caption-1 text-alpha-60 mb-6 text-center">
                We found your profile
              </p>

              {profile && (
                <div className="flex flex-col items-center mb-6">
                  {/* Avatar with glow */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-secondary-300 blur-xl opacity-60 scale-125" />
                    <div className="absolute inset-0 rounded-full bg-secondary-300/40 blur-2xl scale-150" />
                    {profile.avatar_url ? (
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(profile.avatar_url)}`}
                        alt={profile.handle}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-white shadow-lg"
                      />
                    ) : (
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary-btn flex items-center justify-center text-white text-h4 font-bold border-2 border-white shadow-lg">
                        {profile.handle.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {profile.is_verified && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white">
                        <Check className="size-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Profile info */}
                  <h3 className="text-body-1 font-bold text-primary-900">
                    {profile.full_name || `@${profile.handle}`}
                  </h3>
                  <p className="text-caption-1 text-alpha-60 mb-3">
                    @{profile.handle}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-6 mb-3">
                    <div className="text-center">
                      <p className="text-body-2 font-bold text-primary-900">
                        {formatCount(profile.followers_count)}
                      </p>
                      <p className="text-caption-2 text-alpha-40">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-body-2 font-bold text-primary-900">
                        {formatCount(profile.following_count)}
                      </p>
                      <p className="text-caption-2 text-alpha-40">Following</p>
                    </div>
                    <div className="text-center">
                      <p className="text-body-2 font-bold text-primary-900">
                        {formatCount(profile.posts_count)}
                      </p>
                      <p className="text-caption-2 text-alpha-40">Posts</p>
                    </div>
                  </div>

                  {profile.biography && (
                    <p className="text-caption-1 text-alpha-60 text-center max-w-xs line-clamp-2">
                      {profile.biography}
                    </p>
                  )}
                </div>
              )}

              <NextButton onClick={handleStartDiscovery}>
                <Search className="size-4" />
                Find My Competitors
              </NextButton>
                </>
              )}
            </StepCard>

            {/* ── STEP 4: Discovery with tips ── */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-5"
              >
                {/* Radar animation */}
                <div className="border border-black rounded-[28px] sm:rounded-[40px] shadow-signature bg-white p-6 sm:p-8">
                  <div className="flex flex-col items-center">
                    {/* Radar */}
                    <div className="relative w-28 h-28 mb-6">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-full border border-secondary-300/40"
                          initial={{ scale: 0.3, opacity: 0.8 }}
                          animate={{ scale: 1.3, opacity: 0 }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
                        />
                      ))}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="w-14 h-14 rounded-full bg-secondary-300 flex items-center justify-center border border-primary-900"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {discoveryDone ? (
                            <Check className="size-6 text-primary-btn" strokeWidth={3} />
                          ) : (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            >
                              <Search className="size-6 text-primary-btn" />
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                    </div>

                    {discoveryDone ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                        <h3 className="text-h5 font-bold text-primary-btn mb-1">
                          Found {competitorCount} competitors!
                        </h3>
                        <p className="text-body-2 text-alpha-60">Taking you to your results...</p>
                      </motion.div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-300 opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-secondary-300" />
                          </span>
                          <span className="text-body-2 font-medium text-primary-btn">
                            Scanning for competitors...
                          </span>
                        </div>
                        {competitorCount > 0 && (
                          <p className="text-caption-1 text-alpha-60">
                            {competitorCount} found so far
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tip card */}
                {!discoveryDone && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="border border-alpha-10 rounded-[20px] bg-primary-50 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-300 flex items-center justify-center shrink-0 border border-primary-900">
                        <Sparkles className="size-4 text-primary-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-caption-2 text-alpha-40 mb-1 uppercase tracking-wider font-medium">
                          Creator tip
                        </p>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={tipIdx}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p className="text-body-2 font-semibold text-primary-900 mb-0.5">
                              {tips[tipIdx].title}
                            </p>
                            <p className="text-caption-1 text-alpha-60 leading-relaxed">
                              {tips[tipIdx].body}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
