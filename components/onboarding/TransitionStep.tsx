'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransitionStepProps {
  /** Big headline. e.g. "Studying your brand..." */
  title: string
  /** Optional sub-headline */
  subtitle?: string
  /** Tips cycled while waiting */
  tips?: { title: string; body: string }[]
  /** Fires once the simulated work completes */
  onComplete: () => void
  /** How long the transition runs before firing onComplete (ms). Default 4500. */
  durationMs?: number
}

const DEFAULT_TIPS = [
  {
    title: 'Looking for your voice',
    body: 'We study how you write, what you post, and who follows you to learn your tone.',
  },
  {
    title: 'Scanning the field',
    body: 'Navix maps the most relevant accounts in your niche before showing you the winners.',
  },
  {
    title: 'Spotting the patterns',
    body: 'Hooks, formats, and posting cadence. We surface what is actually working.',
  },
]

/**
 * Final "we&apos;re setting things up" splash screen with rotating tips.
 *
 * Lives at the end of every persona flow. Once `durationMs` elapses (or the
 * caller flips a flag externally by re-rendering with `durationMs: 0`) the
 * `onComplete` callback fires. That is where the page navigates the user
 * to the dashboard.
 */
export function TransitionStep({
  title,
  subtitle,
  tips = DEFAULT_TIPS,
  onComplete,
  durationMs = 4500,
}: TransitionStepProps) {
  const [tipIdx, setTipIdx] = useState(0)
  const [progress, setProgress] = useState(8)
  const [done, setDone] = useState(false)
  const startedAt = useRef<number>(Date.now())
  const completedRef = useRef(false)

  // Rotate tips
  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % tips.length), 3200)
    return () => clearInterval(t)
  }, [tips.length])

  // Drive progress + completion
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      const ratio = Math.min(elapsed / durationMs, 1)
      const pct = 8 + ratio * 92
      setProgress(pct)
      if (ratio >= 1 && !completedRef.current) {
        completedRef.current = true
        setDone(true)
        setTimeout(onComplete, 800)
      }
    }, 80)
    return () => clearInterval(tick)
  }, [durationMs, onComplete])

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 pt-10 sm:pt-16 pb-12">
      <div className="w-full max-w-[560px]">
        {/* Animated visual */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto mb-8 h-32 w-32 sm:h-40 sm:w-40"
        >
          {/* Pulsing rings */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-secondary-300/60"
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                delay: i * 0.85,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Core */}
          <motion.div
            animate={{ scale: done ? 1.1 : [1, 1.04, 1] }}
            transition={{
              duration: done ? 0.4 : 2,
              repeat: done ? 0 : Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-3 rounded-full bg-secondary-300 border border-primary-900 shadow-signature flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 14 }}
                >
                  <Check className="size-10 text-primary-900" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="size-9 text-primary-900 animate-spin" strokeWidth={2.2} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-h5 sm:text-h4 font-bold text-primary-900 mb-2">
            {done ? 'All set' : title}
          </h2>
          {subtitle && !done && (
            <p className="text-body-2 text-alpha-60 max-w-md mx-auto">{subtitle}</p>
          )}
          {done && (
            <p className="text-body-2 text-alpha-60">Taking you to your dashboard...</p>
          )}
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="h-1.5 w-full rounded-full bg-alpha-10 overflow-hidden mb-6"
        >
          <motion.div
            className={cn(
              'h-full rounded-full transition-colors',
              done ? 'bg-success-500' : 'bg-secondary-400',
            )}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>

        {/* Rotating tip card */}
        {!done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-[20px] border border-alpha-10 bg-white shadow-card p-5"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-9 w-9 rounded-[10px] bg-secondary-50 border border-secondary-200 flex items-center justify-center">
                <Sparkles className="size-4 text-primary-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-caption-2 font-semibold uppercase tracking-wider text-alpha-40 mb-1">
                  While you wait
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
      </div>
    </div>
  )
}
