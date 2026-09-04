'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/product-categories'

interface ProductCategoryPickerProps {
  category: string | null
  subcategory: string | null
  onCategoryChange: (label: string) => void
  onSubcategoryChange: (label: string) => void
  error?: boolean
  className?: string
}

/**
 * Two-tier category picker for e-commerce onboarding.
 *
 * Top row = category pills (always visible).
 * Below = animated reveal of the selected category's subcategory pills.
 */
export function ProductCategoryPicker({
  category,
  subcategory,
  onCategoryChange,
  onSubcategoryChange,
  error = false,
  className,
}: ProductCategoryPickerProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const active: ProductCategory | undefined = useMemo(
    () => PRODUCT_CATEGORIES.find((c) => c.label === category),
    [category],
  )

  return (
    <div
      className={cn(
        'rounded-[16px] border border-alpha-10 bg-alpha-5/40 p-3 sm:p-4 transition-colors',
        error && 'border-destructive-200 bg-destructive-50/60',
        className,
      )}
    >
      <div className="flex flex-wrap gap-1.5">
        {PRODUCT_CATEGORIES.map((c) => {
          const selected = category === c.label
          const isHovered = hovered === c.label
          const Icon = c.icon
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                onCategoryChange(c.label)
              }}
              onMouseEnter={() => setHovered(c.label)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption-1 font-medium transition-all duration-150 border whitespace-nowrap',
                selected
                  ? 'bg-primary-900 text-white border-primary-900'
                  : 'bg-white border-alpha-10 text-primary-900 hover:border-primary-900 hover:bg-alpha-5',
              )}
            >
              <Icon className="size-3.5" strokeWidth={2} />
              <span>{c.label}</span>
              {!selected && (
                <ChevronRight
                  className={cn(
                    'size-3 text-alpha-30 transition-transform',
                    isHovered && 'translate-x-0.5',
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {active && active.subs.length > 0 && (
          <motion.div
            key={active.label}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-alpha-10">
              {active.subs.map((sub) => {
                const selected = subcategory === sub
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => onSubcategoryChange(sub)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption-1 font-medium transition-all duration-150 border whitespace-nowrap',
                      selected
                        ? 'bg-secondary-300 text-primary-900 border-primary-900'
                        : 'bg-white border-alpha-10 text-primary-900 hover:border-primary-900',
                    )}
                  >
                    {selected && <Check className="size-3" />}
                    {sub}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
