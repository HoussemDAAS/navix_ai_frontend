'use client'

import { ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ThreatLevel = 'low' | 'medium' | 'high'

const levelStyles: Record<ThreatLevel, { pill: string; bar: string; label: string }> = {
  low: { pill: 'bg-success-50 border-success-200 text-success-700', bar: 'bg-success-500', label: 'Low threat' },
  medium: { pill: 'bg-warning-100 border-warning-300 text-warning-700', bar: 'bg-warning-500', label: 'Medium threat' },
  high: { pill: 'bg-destructive-50 border-destructive-200 text-destructive-600', bar: 'bg-destructive-500', label: 'High threat' },
}

const filled: Record<ThreatLevel, number> = { low: 1, medium: 2, high: 3 }

export function ThreatMeter({ level, reason }: { level: ThreatLevel; reason: string }) {
  const style = levelStyles[level]

  return (
    <div className="rounded-[14px] border border-alpha-10 bg-white p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <ShieldAlert className="size-4 text-alpha-60" />
        <p className="text-caption-1 font-semibold text-alpha-60 uppercase tracking-wide">
          Threat level
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-caption-2 font-semibold',
            style.pill,
          )}
        >
          {style.label}
        </span>
        <div className="flex items-center gap-1" aria-hidden>
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={cn(
                'h-1.5 w-6 rounded-full',
                step <= filled[level] ? style.bar : 'bg-alpha-10',
              )}
            />
          ))}
        </div>
      </div>
      <p className="mt-2.5 text-body-2 text-primary-900 leading-relaxed">{reason}</p>
    </div>
  )
}
