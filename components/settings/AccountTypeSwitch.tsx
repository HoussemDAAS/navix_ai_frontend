'use client'

import { Building2, Check, Store, UserRound, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProfilePersona } from '@/lib/api'

const OPTIONS: Array<{ persona: ProfilePersona; label: string; hint: string; icon: LucideIcon }> = [
  { persona: 'creator', label: 'Content creator', hint: 'One project: your own brand.', icon: UserRound },
  { persona: 'ecommerce', label: 'E-commerce brand', hint: 'Your store, straight into its project.', icon: Store },
  { persona: 'agency', label: 'Marketing agency', hint: 'One client now, more with paid plans.', icon: Building2 },
]

interface AccountTypeSwitchProps {
  value: ProfilePersona | null
  onChange: (persona: ProfilePersona) => void
  saving: boolean
}

/** The persona picked at signup, changeable later — it reshapes home, limits and the AI. */
export function AccountTypeSwitch({ value, onChange, saving }: AccountTypeSwitchProps) {
  return (
    <div role="radiogroup" aria-label="Account type" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const selected = opt.persona === value
        return (
          <button
            key={opt.persona}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={saving}
            onClick={() => onChange(opt.persona)}
            className={cn(
              'flex items-start gap-2.5 rounded-[12px] border px-3 py-2.5 text-left transition-all duration-200',
              selected
                ? 'border-primary-900 bg-secondary-300 shadow-signature'
                : 'border-alpha-10 bg-white hover:border-alpha-30',
              saving && 'cursor-wait opacity-70',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px]',
                selected ? 'bg-primary-900 text-secondary-300' : 'bg-alpha-5 text-alpha-60',
              )}
            >
              {selected ? <Check className="size-3.5" strokeWidth={3} /> : <opt.icon className="size-3.5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-caption-1 font-semibold text-primary-900">{opt.label}</span>
              <span className={cn('block text-caption-2', selected ? 'text-primary-900/70' : 'text-alpha-60')}>
                {opt.hint}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
