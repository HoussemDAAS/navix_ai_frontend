'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COUNTRIES, POPULAR_COUNTRIES, type Country } from '@/lib/countries'

interface CountryPickerProps {
  /** ISO country code (e.g. "US"), or null when none selected */
  value: string | null
  onChange: (code: string) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Searchable country combobox.
 *
 * Stores the ISO 3166-1 alpha-2 code in `value` so it round-trips cleanly with
 * the `country` profile field. Renders the flag + name in the UI.
 */
export function CountryPicker({
  value,
  onChange,
  placeholder = 'Select a country',
  error = false,
  disabled = false,
  className,
}: CountryPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => COUNTRIES.find((c) => c.code === value) ?? null,
    [value],
  )

  // Filtered list. Popular pinned to the top when no query
  const { popular, results } = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return {
        popular: COUNTRIES.filter((c) => POPULAR_COUNTRIES.includes(c.code)).sort(
          (a, b) => POPULAR_COUNTRIES.indexOf(a.code) - POPULAR_COUNTRIES.indexOf(b.code),
        ),
        results: COUNTRIES,
      }
    }
    return {
      popular: [] as Country[],
      results: COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
      ),
    }
  }, [query])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Auto-focus search when opening
  useEffect(() => {
    if (open) {
      setQuery('')
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  function handleSelect(code: string) {
    onChange(code)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-2 rounded-[12px] border bg-white px-4 py-3 text-body-2 font-medium text-primary-900 transition-all',
          'border-alpha-10 shadow-card',
          'hover:border-alpha-20',
          'focus:outline-none focus:border-transparent focus:shadow-[0px_0px_0px_3px] focus:shadow-ring',
          error && 'border-destructive-200 bg-destructive-50',
          disabled && 'bg-alpha-5 border-none shadow-none cursor-not-allowed text-alpha-30',
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span className="text-base leading-none">{selected.flag}</span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-alpha-60">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-alpha-60 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-50 mt-2 rounded-[14px] border border-alpha-10 bg-white shadow-dropdown overflow-hidden"
          >
            {/* Search */}
            <div className="border-b border-alpha-10 p-2.5">
              <div className="flex items-center gap-2 rounded-[10px] bg-alpha-5 px-3 py-2">
                <Search className="size-4 text-alpha-40 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search countries..."
                  className="flex-1 min-w-0 bg-transparent outline-none text-body-2 text-primary-900 placeholder:text-alpha-40"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-[280px] overflow-y-auto py-1">
              {popular.length > 0 && (
                <>
                  <div className="px-3 pt-2 pb-1 text-caption-2 font-semibold uppercase tracking-wider text-alpha-40">
                    Popular
                  </div>
                  {popular.map((c) => (
                    <CountryRow
                      key={c.code}
                      country={c}
                      selected={c.code === value}
                      onClick={() => handleSelect(c.code)}
                    />
                  ))}
                  <div className="px-3 pt-2 pb-1 text-caption-2 font-semibold uppercase tracking-wider text-alpha-40 border-t border-alpha-10 mt-1">
                    All countries
                  </div>
                </>
              )}

              {results.length === 0 ? (
                <div className="px-4 py-6 text-center text-caption-1 text-alpha-50">
                  No countries match &ldquo;{query}&rdquo;
                </div>
              ) : (
                results.map((c) => (
                  <CountryRow
                    key={c.code}
                    country={c}
                    selected={c.code === value}
                    onClick={() => handleSelect(c.code)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CountryRow({
  country,
  selected,
  onClick,
}: {
  country: Country
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors',
        selected ? 'bg-secondary-50' : 'hover:bg-alpha-5',
      )}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span className="text-base leading-none">{country.flag}</span>
        <span className="text-body-2 font-medium text-primary-900 truncate">
          {country.name}
        </span>
      </span>
      {selected && <Check className="size-4 text-primary-900 shrink-0" />}
    </button>
  )
}
