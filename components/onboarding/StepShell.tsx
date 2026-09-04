'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepShellProps {
  /** Current step index (1-based) */
  step: number
  /** Total step count */
  total: number
  /** Headline shown above the island */
  title: string
  /** Optional subhead under the headline */
  subtitle?: string
  /** Optional back handler. Renders a back link when provided */
  onBack?: () => void
  /** Backlink label, defaults to "Back" */
  backLabel?: string
  className?: string
  children: React.ReactNode
}

/**
 * Onboarding step layout shell.
 *
 * Renders the framed island card with staggered animation, step indicator,
 * a back link, the headline + subtitle, and the form/content children.
 *
 * Matches the visual quality of `app/projects/[id]/brand-kit/page.tsx`.
 */
export function StepShell({
  step,
  total,
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  className,
  children,
}: StepShellProps) {
  const percent = (step / total) * 100

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 pt-2 sm:pt-6 pb-12">
      <div className="w-full max-w-[640px]">
        {/* Top bar. Back link + step pill */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-caption-1 font-medium text-alpha-60 hover:text-primary-900 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {backLabel}
            </button>
          ) : (
            <span />
          )}
          <span className="text-caption-2 font-medium text-alpha-40 tabular-nums">
            Step {step} of {total}
          </span>
        </div>

        {/* Mini progress dots */}
        <div className="flex items-center gap-1.5 mb-6 sm:mb-8">
          {Array.from({ length: total }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: i < step ? 1 : 0.2 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'h-1 rounded-full flex-1 transition-colors duration-300',
                i < step ? 'bg-primary-900' : 'bg-alpha-10',
              )}
            />
          ))}
        </div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 sm:mb-7"
        >
          <h1 className="text-h5 sm:text-h4 font-bold text-primary-900 mb-1.5 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-body-2 text-alpha-60 max-w-[520px]">{subtitle}</p>
          )}
        </motion.div>

        {/* Island card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'rounded-[24px] sm:rounded-[28px] border border-alpha-10 bg-white shadow-card',
            'p-5 sm:p-8',
            className,
          )}
        >
          {children}
        </motion.div>

        {/* Faint progress hint */}
        <p className="text-caption-2 text-alpha-30 text-center mt-4">
          {Math.round(percent)}% complete
        </p>
      </div>
    </div>
  )
}
