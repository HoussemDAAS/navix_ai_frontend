'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Instagram, Youtube } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboarding'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { getCompetitors } from '@/lib/api'

/* ── Platform icons ── */

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.27 8.27 0 0 0 4.85 1.56V6.64a4.84 4.84 0 0 1-1.09.05Z" />
    </svg>
  )
}

/* ── Crawler step data ── */

interface CrawlerStep {
  platform: string
  icon: React.ReactNode
  color: string
  bgColor: string
  messages: string[]
}

const crawlerSteps: CrawlerStep[] = [
  {
    platform: 'Instagram',
    icon: <Instagram className="size-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    messages: [
      'Searching niche profiles...',
      'Scanning hashtag posts...',
      'Extracting related accounts...',
    ],
  },
  {
    platform: 'TikTok',
    icon: <TikTokIcon className="size-5" />,
    color: 'text-primary-900',
    bgColor: 'bg-alpha-5 border-alpha-10',
    messages: [
      'Searching niche creators...',
      'Loading profile data...',
      'Analyzing content...',
    ],
  },
  {
    platform: 'YouTube',
    icon: <Youtube className="size-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    messages: [
      'Matching channels...',
    ],
  },
]

/* ── Animated dots ── */

function Dots() {
  return (
    <span className="inline-flex gap-0.5 ml-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1 h-1 rounded-full bg-current"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </span>
  )
}

/* ── Single crawler row ── */

function CrawlerRow({
  step,
  status,
  message,
  delay,
}: {
  step: CrawlerStep
  status: 'waiting' | 'active' | 'done'
  message: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[16px] border transition-all duration-300',
        status === 'active' && step.bgColor,
        status === 'done' && 'bg-success-50 border-success-200',
        status === 'waiting' && 'bg-white border-alpha-10 opacity-50',
      )}
    >
      {/* Icon */}
      <div className={cn(
        'shrink-0 transition-colors',
        status === 'done' ? 'text-success-600' : step.color,
      )}>
        {status === 'done' ? <Check className="size-5" strokeWidth={2.5} /> : step.icon}
      </div>

      {/* Platform + message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-caption-1 font-semibold text-primary-900">
            {step.platform}
          </span>
          {status === 'active' && (
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-300 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-secondary-400" />
            </span>
          )}
        </div>
        <p className="text-caption-2 text-alpha-60 truncate">
          {status === 'waiting' && 'Queued'}
          {status === 'active' && <>{message}<Dots /></>}
          {status === 'done' && 'Done'}
        </p>
      </div>
    </motion.div>
  )
}

/* ── Page ── */

export default function LoadingPage() {
  const router = useRouter()
  const runIds = useOnboardingStore((s) => s.runIds)
  const projectId = useOnboardingStore((s) => s.projectId)
  const setStep = useOnboardingStore((s) => s.setStep)

  const [progress, setProgress] = useState(10)
  const [competitorCount, setCompetitorCount] = useState(0)
  const [complete, setComplete] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [messageIdx, setMessageIdx] = useState(0)
  const [stepStatuses, setStepStatuses] = useState<('waiting' | 'active' | 'done')[]>(
    ['active', 'waiting', 'waiting'],
  )
  const hasCompleted = useRef(false)
  const startTime = useRef(Date.now())

  // Route guard
  useEffect(() => {
    if (!runIds || runIds.length === 0) router.replace('/onboarding/setup')
  }, [runIds, router])

  const handleComplete = useCallback((count: number) => {
    if (hasCompleted.current) return
    hasCompleted.current = true
    setCompetitorCount(count)
    setComplete(true)
    setProgress(100)
    setStepStatuses(['done', 'done', 'done'])
    setStep(3)
    setTimeout(() => router.push(`/projects/${projectId}/competitors`), 2000)
  }, [projectId, router, setStep])

  // Poll for real competitors
  useEffect(() => {
    if (!projectId || !runIds) return

    const poll = setInterval(async () => {
      try {
        const result = await getCompetitors(projectId)
        if (result.data && result.data.length > 0) {
          setCompetitorCount(result.data.length)
          // Don't complete until we've had results for a bit (wait for all webhooks)
          if (result.data.length >= 5 || (Date.now() - startTime.current > 60_000)) {
            handleComplete(result.data.length)
          }
        }
      } catch {
        // API not ready yet
      }
    }, 4000)

    return () => clearInterval(poll)
  }, [projectId, runIds, handleComplete])

  // Animate crawler steps
  useEffect(() => {
    // Cycle messages within active step
    const msgTimer = setInterval(() => {
      setMessageIdx((prev) => prev + 1)
    }, 2500)

    // Progress through platforms
    const stepTimer = setInterval(() => {
      setActiveStep((prev) => {
        const next = Math.min(prev + 1, crawlerSteps.length - 1)
        setStepStatuses((statuses) =>
          statuses.map((s, i) => {
            if (i < next) return 'done'
            if (i === next) return 'active'
            return 'waiting'
          }),
        )
        setMessageIdx(0)
        return next
      })
    }, 8000)

    // Progress bar
    const progressTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000
      setProgress(Math.min(10 + (elapsed / 90) * 80, 90))
    }, 500)

    return () => {
      clearInterval(msgTimer)
      clearInterval(stepTimer)
      clearInterval(progressTimer)
    }
  }, [])

  if (!runIds || runIds.length === 0) return null

  const currentStep = crawlerSteps[activeStep]
  const currentMessage = currentStep?.messages[messageIdx % currentStep.messages.length] || ''

  return (
    <>
      <ProgressBar percent={progress} />

      <div className="flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-16 pb-8">
        <span className="text-caption-2 font-medium text-alpha-30 mb-6">Step 3 of 3</span>

        {/* Title */}
        <AnimatePresence mode="wait">
          {complete ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8"
            >
              <div className="w-14 h-14 rounded-full bg-success-100 border border-success-300 flex items-center justify-center mx-auto mb-4">
                <Check className="size-7 text-success-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-h5 font-bold text-primary-btn mb-1">
                Found {competitorCount} competitor{competitorCount !== 1 ? 's' : ''}!
              </h2>
              <p className="text-body-2 text-alpha-60">Taking you to your results...</p>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h2 className="text-h5 font-bold text-primary-btn mb-1">
                Crawling for competitors
              </h2>
              <p className="text-body-2 text-alpha-60">
                Navix is scanning social platforms in your niche
              </p>
              {competitorCount > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-caption-1 font-medium text-secondary-500 mt-2"
                >
                  {competitorCount} found so far...
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crawler status card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-[400px] border border-black rounded-[24px] shadow-signature bg-white p-4 space-y-2"
        >
          {crawlerSteps.map((step, i) => (
            <CrawlerRow
              key={step.platform}
              step={step}
              status={stepStatuses[i]}
              message={i === activeStep ? currentMessage : step.messages[0]}
              delay={i * 0.1}
            />
          ))}
        </motion.div>

        {/* Subtle hint */}
        {!complete && (
          <p className="text-caption-2 text-alpha-30 mt-6 text-center">
            Usually takes 30-90 seconds
          </p>
        )}
      </div>
    </>
  )
}
