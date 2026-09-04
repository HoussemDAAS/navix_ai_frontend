'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsIslandProps {
  icon: LucideIcon
  title: string
  description: string
  /** Stagger index for the entrance animation */
  index: number
  className?: string
  children: React.ReactNode
}

/**
 * White card that groups one section of the settings page.
 * Matches the island styling used on the dashboard and project pages.
 */
export function SettingsIsland({
  icon: Icon,
  title,
  description,
  index,
  className,
  children,
}: SettingsIslandProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.06, duration: 0.4 }}
      className={cn(
        'rounded-[20px] border border-alpha-10 bg-white p-5 shadow-card sm:p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-secondary-300/20">
          <Icon className="size-[18px] text-primary-900" />
        </span>
        <div className="min-w-0">
          <h2 className="text-body-1 font-semibold text-primary-900">{title}</h2>
          <p className="mt-0.5 text-caption-1 text-alpha-60">{description}</p>
        </div>
      </div>
      {children}
    </motion.section>
  )
}
