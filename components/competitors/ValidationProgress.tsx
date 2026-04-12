'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ValidationProgressProps {
  validated: number
  total: number
  celebrate: boolean
  className?: string
}

export function ValidationProgress({
  validated,
  total,
  celebrate,
  className,
}: ValidationProgressProps) {
  const percent = total > 0 ? Math.round((validated / total) * 100) : 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-caption-1 font-medium text-primary-900">
          {validated} of {total} competitors validated
        </span>
        <span className="text-caption-2 font-medium text-alpha-40">
          {percent}%
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-alpha-10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-secondary-300"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Celebration pulse on 3rd validation */}
        {celebrate && (
          <motion.div
            className="absolute inset-0 rounded-full bg-secondary-300"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0, scale: [1, 1.5] }}
            transition={{ duration: 0.8 }}
          />
        )}
      </div>
    </div>
  )
}
