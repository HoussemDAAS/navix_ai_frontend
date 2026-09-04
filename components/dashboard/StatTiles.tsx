'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCount } from './utils'

export interface StatTileData {
  key: string
  label: string
  value: number
  hint: string
  icon: LucideIcon
}

interface StatTilesProps {
  tiles: StatTileData[]
  /** True while the per-project fan-out is still running. */
  loading: boolean
  /** How many shimmer tiles to draw while loading. */
  skeletonCount?: number
  className?: string
}

function TileSkeleton() {
  return (
    <div className="rounded-[16px] border border-alpha-10 bg-white p-4 shadow-card">
      <div className="h-8 w-8 animate-pulse rounded-[8px] bg-alpha-10" />
      <div className="mt-3 h-7 w-14 animate-pulse rounded bg-alpha-10" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-alpha-5" />
    </div>
  )
}

export function StatTiles({ tiles, loading, skeletonCount = 4, className }: StatTilesProps) {
  if (!loading && tiles.length === 0) return null

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4', className)}>
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <TileSkeleton key={i} />)
        : tiles.map((tile, index) => {
            const TileIcon = tile.icon
            return (
              <motion.div
                key={tile.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.05, duration: 0.35 }}
                className="rounded-[16px] border border-alpha-10 bg-white p-4 shadow-card"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-alpha-5">
                  <TileIcon className="size-4 text-alpha-60" />
                </div>
                <p className="mt-3 text-h6 font-bold leading-none text-primary-900 sm:text-h5">
                  {formatCount(tile.value)}
                </p>
                <p className="mt-1.5 text-caption-2 font-medium text-primary-900">{tile.label}</p>
                <p className="mt-0.5 text-caption-2 text-alpha-60">{tile.hint}</p>
              </motion.div>
            )
          })}
    </div>
  )
}
