'use client'

import { Lock, BarChart3, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MarketBriefSidebarProps {
  validatedCount: number
  requiredCount: number
  isUnlocked: boolean
  className?: string
}

export function MarketBriefSidebar({
  validatedCount,
  requiredCount,
  isUnlocked,
  className,
}: MarketBriefSidebarProps) {
  const progress = Math.min((validatedCount / requiredCount) * 100, 100)

  return (
    <div
      className={cn(
        'border border-black rounded-[28px] sm:rounded-[40px] shadow-signature overflow-hidden bg-white',
        className,
      )}
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-[10px] bg-primary-50 flex items-center justify-center">
            <BarChart3 className="size-4.5 text-primary-900" />
          </div>
          <h3 className="text-body-2 font-semibold text-primary-900">Market Brief</h3>
        </div>

        {isUnlocked ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-caption-1 text-alpha-60">
              Your market brief is ready. Continue to see a full breakdown of competitor strategies, content gaps, and opportunities.
            </p>
            <div className="h-1.5 rounded-full bg-secondary-300 w-full" />
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-3 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
            >
              View Market Brief
              <ArrowRight className="size-3.5" />
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Locked state */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-alpha-5">
              <Lock className="size-3.5 text-alpha-30" />
              <span className="text-caption-2 font-medium text-alpha-40">
                Validate {requiredCount} competitors to unlock
              </span>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-caption-2 font-medium text-alpha-60">
                  {validatedCount} of {requiredCount} validated
                </span>
                <span className="text-caption-2 font-medium text-alpha-30">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-alpha-10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-secondary-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Teaser bullets */}
            <div className="space-y-2 opacity-50 pointer-events-none select-none">
              {['Dominant formats breakdown', 'Best posting times', 'Content gap opportunities'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-alpha-20" />
                  <span className="text-caption-2 text-alpha-40">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
