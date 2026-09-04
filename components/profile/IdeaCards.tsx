'use client'

import { Lightbulb } from 'lucide-react'

interface IdeaCardsProps {
  title: string
  items: string[]
}

/** Actionable ideas rendered as lime cards — "Steal these" / "Next moves". */
export function IdeaCards({ title, items }: IdeaCardsProps) {
  if (items.length === 0) return null

  return (
    <div>
      <p className="text-caption-1 font-semibold text-alpha-60 uppercase tracking-wide mb-2">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div
            key={`${title}-${i}`}
            className="rounded-[14px] border border-secondary-200 bg-secondary-50 p-4"
          >
            <div className="flex items-start gap-2.5">
              <Lightbulb className="size-4 text-primary-900 mt-0.5 shrink-0" />
              <p className="text-body-2 text-primary-900 leading-relaxed">{item}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
