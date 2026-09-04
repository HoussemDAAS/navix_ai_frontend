'use client'

import { useState } from 'react'
import { AlertCircle, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface ChipInputProps {
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
  /** Shown when the list is empty */
  emptyHint: string
  max: number
  /** Returns the value to store, or null when the entry is not valid */
  normalize: (raw: string) => string | null
  invalidMessage: string
  className?: string
}

/** Removable chips plus an add field. Enter or comma commits an entry. */
export function ChipInput({
  values,
  onChange,
  placeholder,
  emptyHint,
  max,
  normalize,
  invalidMessage,
  className,
}: ChipInputProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isFull = values.length >= max

  function add() {
    const entries = draft.split(/[,\n]/).map((part) => part.trim()).filter(Boolean)
    if (entries.length === 0) return

    const accepted: string[] = []
    let rejected = false
    for (const entry of entries) {
      const value = normalize(entry)
      if (value) accepted.push(value)
      else rejected = true
    }

    if (accepted.length > 0) {
      onChange([...new Set([...values, ...accepted])].slice(0, max))
    }
    setDraft(rejected && accepted.length === 0 ? draft : '')
    setError(rejected ? invalidMessage : null)
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-alpha-10 bg-alpha-5 py-1 pl-3 pr-1.5 text-caption-1 font-medium text-primary-900"
            >
              <span className="truncate">{value}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                aria-label={`Remove ${value}`}
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-alpha-60 transition-colors hover:bg-alpha-10 hover:text-primary-900"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-caption-2 text-alpha-40">{emptyHint}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={isFull ? `Limit of ${max} reached` : placeholder}
          disabled={isFull}
          error={!!error}
          className="sm:flex-1"
        />
        <button
          type="button"
          onClick={add}
          disabled={isFull || !draft.trim()}
          className="inline-flex h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-[12px] border border-alpha-10 bg-white px-4 text-caption-1 font-medium text-primary-900 shadow-card transition-colors hover:border-alpha-20 hover:bg-alpha-5 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-caption-2 text-destructive-500">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
