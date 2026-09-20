'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: { tile: 'size-7 rounded-[8px]', icon: 'size-3.5' },
  md: { tile: 'size-9 rounded-[10px]', icon: 'size-4' },
  lg: { tile: 'size-11 rounded-[12px]', icon: 'size-5' },
} as const

/** The green stroke of the Navix mark, cropped from logo_navix_ico.svg. */
export function NavixSwoosh({ className }: { className?: string }) {
  return (
    <svg viewBox="326 22 108 98" aria-hidden className={className} fill="currentColor">
      <path d="M430 24.8C431.5 25.1 430.8 24.8 431.9 26.1C432.2 33.7 420.8 58.2 416.5 65.6L411.5 55.7C396.6 70.8 381.3 88.1 366.9 103.8L351.8 89.1C341.5 100 338.2 103.4 330.9 116.4L329.6 117.1L328.4 116.3C327.5 111.6 328 101.8 328.1 96.6C335.9 89.5 344.6 79.9 351.6 72L366.4 86.7C373.2 81 397 54.4 403.9 46.9L393.5 44.2C399.4 39.2 422.7 26.8 430 24.8Z" />
    </svg>
  )
}

interface AiMarkProps {
  size?: keyof typeof SIZES
  /** Slow rotation while Navix is working */
  spinning?: boolean
  className?: string
}

/**
 * The mark for everything Navix Intelligence produced: the brand's own green
 * stroke on a navy tile. Replaces the generic sparkle-in-a-lime-square.
 */
export function AiMark({ size = 'md', spinning = false, className }: AiMarkProps) {
  const s = SIZES[size]
  const swoosh = <NavixSwoosh className={s.icon} />
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-primary-900 text-secondary-300 shadow-card',
        s.tile,
        className,
      )}
    >
      {spinning ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          className="inline-flex"
        >
          {swoosh}
        </motion.span>
      ) : (
        swoosh
      )}
    </span>
  )
}
