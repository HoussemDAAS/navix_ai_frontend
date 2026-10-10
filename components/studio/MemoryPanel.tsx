'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Brain, Plus, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/relative-time'
import { Spinner } from '@/components/ui/spinner'
import {
  getCreatorMemory,
  refreshCreatorMemory,
  updateCreatorMemory,
  type CreatorMemory,
  type CreatorMemoryItem,
  type MemoryKind,
} from '@/lib/api'

const KIND_LABEL: Record<MemoryKind, string> = {
  preference: 'Prefers',
  avoid: 'Avoid',
  topic: 'Recurring topics',
  format: 'Formats',
  voice: 'Voice',
  audience: 'Audience',
  goal: 'Goals',
}
const KIND_ORDER: MemoryKind[] = ['preference', 'avoid', 'voice', 'format', 'topic', 'audience', 'goal']

const quiet =
  'inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-alpha-10 bg-white px-3 py-1.5 text-caption-1 font-medium text-alpha-60 transition-colors hover:border-primary-900 hover:text-primary-900 disabled:opacity-50 disabled:pointer-events-none'

/**
 * What Navix has learned about this creator across sessions. Fully editable:
 * every item can be removed, the user can teach it something, and a pass can
 * be forced instead of waiting for the next exchanges.
 */
export function MemoryPanel({ projectId }: { projectId: string }) {
  const [memory, setMemory] = useState<CreatorMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'refresh' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null)
  const [teach, setTeach] = useState('')
  const [teachKind, setTeachKind] = useState<MemoryKind>('preference')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCreatorMemory(projectId)
      setMemory(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load what Navix knows.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(
    async (patch: { summary?: string; learned?: CreatorMemoryItem[] }) => {
      setBusy('save')
      setError(null)
      try {
        const res = await updateCreatorMemory(projectId, patch)
        setMemory(res.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save.')
      } finally {
        setBusy(null)
      }
    },
    [projectId],
  )

  const refresh = useCallback(async () => {
    setBusy('refresh')
    setError(null)
    try {
      const res = await refreshCreatorMemory(projectId)
      setMemory(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the memory.')
    } finally {
      setBusy(null)
    }
  }, [projectId])

  const grouped = useMemo(() => {
    const items = memory?.learned ?? []
    return KIND_ORDER.map((kind) => ({ kind, items: items.filter((i) => i.kind === kind) })).filter((g) => g.items.length > 0)
  }, [memory])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  const learnedAgo = relativeTime(memory?.updated_at)
  const isEmpty = !memory?.summary && (memory?.learned.length ?? 0) === 0

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-primary-900 text-secondary-300">
            <Brain className="size-3.5" />
          </span>
          <div>
            <p className="text-caption-1 font-semibold text-primary-900">What Navix knows about you</p>
            <p className="text-caption-2 text-alpha-60">{learnedAgo ? `Learned ${learnedAgo}` : 'Nothing learned yet'}</p>
          </div>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={busy !== null} className={quiet} title="Learn from the latest sessions now">
          <RefreshCw className={cn('size-3.5', busy === 'refresh' && 'animate-spin')} />
          {busy === 'refresh' ? 'Learning' : 'Update now'}
        </button>
      </div>

      {error && (
        <p className="rounded-[10px] border border-destructive-200 bg-destructive-50 px-3 py-2 text-caption-2 text-destructive-600">{error}</p>
      )}

      {isEmpty ? (
        <p className="rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-3 py-4 text-caption-1 text-alpha-60">
          Navix learns after a couple of exchanges and from every draft you approve or reject. You can also teach it something below.
        </p>
      ) : (
        <>
          {/* Summary — click to edit */}
          <div>
            <p className="mb-1 text-caption-2 font-semibold uppercase tracking-wide text-alpha-40">Summary</p>
            {summaryDraft === null ? (
              <button
                type="button"
                onClick={() => setSummaryDraft(memory?.summary ?? '')}
                className="w-full rounded-[10px] border border-transparent px-2 py-1 text-left text-caption-1 leading-relaxed text-primary-900 hover:border-alpha-10 hover:bg-alpha-5"
                title="Click to edit"
              >
                {memory?.summary || 'No summary yet. Click to write one.'}
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={summaryDraft}
                  onChange={(e) => setSummaryDraft(e.target.value)}
                  rows={3}
                  maxLength={600}
                  className="w-full resize-none rounded-[10px] border border-alpha-10 bg-white px-3 py-2 text-caption-1 text-primary-900 outline-none focus:border-primary-900"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void save({ summary: summaryDraft })
                      setSummaryDraft(null)
                    }}
                    disabled={busy !== null}
                    className={cn(quiet, 'border-primary-900 text-primary-900')}
                  >
                    Save
                  </button>
                  <button type="button" onClick={() => setSummaryDraft(null)} className={quiet}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {grouped.map((group) => (
            <div key={group.kind}>
              <p className="mb-1 text-caption-2 font-semibold uppercase tracking-wide text-alpha-40">{KIND_LABEL[group.kind]}</p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id} className="group flex items-start gap-2 rounded-[10px] px-2 py-1 hover:bg-alpha-5">
                    <span className="min-w-0 flex-1 text-caption-1 leading-relaxed text-primary-900">
                      {item.text}
                      {item.source && <span className="ml-1 text-caption-2 text-alpha-40">· {item.source}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => void save({ learned: (memory?.learned ?? []).filter((i) => i.id !== item.id) })}
                      disabled={busy !== null}
                      className="mt-0.5 shrink-0 rounded-full p-0.5 text-alpha-40 opacity-0 transition-opacity hover:bg-white hover:text-destructive-600 group-hover:opacity-100 focus:opacity-100"
                      aria-label={`Forget: ${item.text}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Teach Navix */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const text = teach.trim()
          if (!text) return
          const now = new Date().toISOString()
          void save({
            learned: [
              ...(memory?.learned ?? []),
              { id: '', text, kind: teachKind, source: 'you', learned_at: now },
            ],
          })
          setTeach('')
        }}
        className="rounded-[12px] border border-alpha-10 bg-alpha-5/50 p-3"
      >
        <p className="mb-2 text-caption-2 font-semibold uppercase tracking-wide text-alpha-40">Teach Navix something</p>
        <input
          value={teach}
          onChange={(e) => setTeach(e.target.value)}
          maxLength={160}
          placeholder="e.g. Never use the word “grind”. Always end reels with a question."
          className="w-full rounded-[10px] border border-alpha-10 bg-white px-3 py-2 text-caption-1 text-primary-900 outline-none placeholder:text-alpha-30 focus:border-primary-900"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <select
            value={teachKind}
            onChange={(e) => setTeachKind(e.target.value as MemoryKind)}
            className="rounded-[8px] border border-alpha-10 bg-white px-2 py-1 text-caption-2 font-medium text-primary-900 outline-none focus:border-primary-900"
          >
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy !== null || !teach.trim()} className={cn(quiet, 'border-primary-900 text-primary-900')}>
            <Plus className="size-3.5" />
            Remember this
          </button>
        </div>
      </form>
    </div>
  )
}
