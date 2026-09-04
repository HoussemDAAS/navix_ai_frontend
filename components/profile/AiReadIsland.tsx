'use client'

import { motion } from 'framer-motion'
import { Sparkles, RefreshCw, AlertTriangle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InsightStatus } from '@/lib/api'
import { fmtDate } from '@/components/profile/utils'

interface AiReadIslandProps {
  status: InsightStatus
  /** True when a real insight payload came back and `children` can be shown */
  hasInsight: boolean
  error: string | null
  generatedAt: string | null
  /** Message for the 'no_data' state — differs per page */
  noDataMessage: string
  onRefresh: () => void
  refreshing: boolean
  /** Set when the last refresh attempt itself failed */
  refreshError?: string | null
  children: React.ReactNode
}

/** The crown island: Navix's grounded AI read of the account. Never faked. */
export function AiReadIsland({
  status,
  hasInsight,
  error,
  generatedAt,
  noDataMessage,
  onRefresh,
  refreshing,
  refreshError,
  children,
}: AiReadIslandProps) {
  const showRefresh = status !== 'no_data'

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.4 }}
      className="rounded-[20px] border border-secondary-400 bg-secondary-50 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-secondary-200 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-secondary-300 border border-primary-900">
            <Sparkles className="size-4 text-primary-900" />
          </div>
          <div className="min-w-0">
            <p className="text-body-2 font-semibold text-primary-900">Navix AI read</p>
            <p className="text-caption-2 text-alpha-60 truncate">
              {generatedAt ? `Generated ${fmtDate(generatedAt)}` : 'Grounded in this account’s scraped posts'}
            </p>
          </div>
        </div>
        {showRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-[10px] border border-alpha-10 bg-white px-3 py-1.5 text-caption-1 font-medium text-alpha-60 hover:border-primary-900 hover:text-primary-900 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">{status === 'unavailable' ? 'Retry' : 'Refresh'}</span>
          </button>
        )}
      </div>

      <div className="px-5 py-5 bg-white">
        {status === 'no_data' && (
          <div className="flex items-start gap-3">
            <Lock className="size-4 text-alpha-40 mt-0.5 shrink-0" />
            <p className="text-body-2 text-alpha-60">{noDataMessage}</p>
          </div>
        )}

        {status === 'unavailable' && (
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-warning-600 mt-0.5 shrink-0" />
            <p className="text-body-2 text-alpha-60">
              {error || 'The AI read could not be generated right now.'}
            </p>
          </div>
        )}

        {(status === 'ready' || status === 'stale') &&
          (hasInsight ? (
            <div className="space-y-5">
              {status === 'stale' && error && (
                <p className="flex items-start gap-2 rounded-[12px] border border-warning-200 bg-warning-50 px-3.5 py-2.5 text-caption-1 text-warning-700">
                  <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                  {error}
                </p>
              )}
              {children}
            </div>
          ) : (
            <p className="text-body-2 text-alpha-60">
              {error || 'No AI read is stored for this account yet.'}
            </p>
          ))}

        {refreshError && (
          <p className="mt-4 flex items-start gap-2 text-caption-1 text-destructive-600">
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
            {refreshError}
          </p>
        )}
      </div>
    </motion.section>
  )
}
