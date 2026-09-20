'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime, relativeTimeUntil } from '@/lib/relative-time'
import type { RefreshOutcome } from '@/lib/api'

const POLL_EVERY_MS = 10_000
const POLL_MAX_TRIES = 24 // ~4 minutes: an Apify profile + posts run normally lands well within

type Phase = 'idle' | 'starting' | 'refreshing' | 'done' | 'notice' | 'error'

interface FreshnessChipProps {
  /** When the account's data was last scraped */
  lastScrapedAt: string | null | undefined
  /** Starts a refresh; the scrape itself finishes in the background */
  onRefresh: () => Promise<RefreshOutcome>
  /** Re-reads the current last-scraped timestamp so the chip knows when the scrape landed */
  poll: () => Promise<string | null | undefined>
  /** Called once fresh data is in — the page reloads its numbers */
  onRefreshed: () => void
  className?: string
}

/**
 * Every number on a dossier is a snapshot. This chip says how old it is and
 * lets the user ask for a fresh one — honesty as a feature.
 */
export function FreshnessChip({
  lastScrapedAt,
  onRefresh,
  poll,
  onRefreshed,
  className,
}: FreshnessChipProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  const waitForFreshData = useCallback(
    async (previous: string | null | undefined) => {
      for (let attempt = 0; attempt < POLL_MAX_TRIES; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_EVERY_MS))
        if (cancelled.current) return
        try {
          const current = await poll()
          if (current && current !== previous) {
            setPhase('done')
            setMessage('Fresh data is in.')
            onRefreshed()
            return
          }
        } catch {
          // transient — keep polling
        }
      }
      if (!cancelled.current) {
        setPhase('notice')
        setMessage('Still refreshing in the background — check back in a minute.')
      }
    },
    [poll, onRefreshed],
  )

  const handleRefresh = useCallback(async () => {
    if (phase === 'starting' || phase === 'refreshing') return
    setPhase('starting')
    setMessage(null)
    try {
      const outcome = await onRefresh()
      if (cancelled.current) return
      if (outcome.started) {
        setPhase('refreshing')
        setMessage('Reading the account now — this takes about a minute.')
        void waitForFreshData(lastScrapedAt)
        return
      }
      setPhase('notice')
      const nextAt = relativeTimeUntil(outcome.next_allowed_at)
      setMessage(
        outcome.reason === 'too_soon'
          ? `Refreshed recently — you can refresh again ${nextAt ?? 'soon'}.`
          : outcome.reason === 'already_running'
            ? 'A refresh is already running for this account.'
            : outcome.reason === 'no_handle'
              ? 'No social handle to refresh — add one in settings.'
              : 'Could not start a refresh right now.',
      )
    } catch (err) {
      if (cancelled.current) return
      setPhase('error')
      setMessage(err instanceof Error ? err.message : 'Could not start a refresh.')
    }
  }, [phase, onRefresh, waitForFreshData, lastScrapedAt])

  const busy = phase === 'starting' || phase === 'refreshing'
  const updated = relativeTime(lastScrapedAt)

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-alpha-10 bg-white/70 px-3 py-1 text-caption-2 text-alpha-60">
        <Clock className="size-3 shrink-0" />
        {updated ? `Data updated ${updated}` : 'No scraped data yet'}
        <span aria-hidden className="mx-1 h-3 w-px bg-alpha-10" />
        <button
          type="button"
          onClick={handleRefresh}
          disabled={busy}
          className="inline-flex items-center gap-1 font-semibold text-primary-900 transition-colors hover:text-primary-btn disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={cn('size-3', busy && 'animate-spin')} />
          {busy ? 'Refreshing' : 'Refresh'}
        </button>
      </span>
      {message && (
        <span
          role="status"
          className={cn(
            'text-caption-2',
            phase === 'error' ? 'text-destructive-600' : 'text-alpha-60',
          )}
        >
          {message}
        </span>
      )}
    </div>
  )
}
