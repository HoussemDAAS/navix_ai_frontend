'use client'

import { useState } from 'react'
import { Check, CornerDownLeft, MessageCircleQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StudioQuestion } from '@/lib/api'

const chip =
  'rounded-full border px-3 py-1.5 text-caption-1 font-medium transition-colors disabled:cursor-default disabled:opacity-60'

interface QuestionCardProps {
  question: StudioQuestion
  /** A later user message exists: the form is closed */
  answered: boolean
  disabled?: boolean
  onAnswer: (text: string) => void
}

/** The assistant's decision form: click an option (or several), or type your own. */
export function QuestionCard({ question, answered, disabled = false, onAnswer }: QuestionCardProps) {
  const [picked, setPicked] = useState<string[]>([])
  const [other, setOther] = useState('')
  const locked = answered || disabled
  const options = question.options ?? []

  function submitMulti() {
    const parts = [...picked, other.trim()].filter(Boolean)
    if (parts.length > 0) onAnswer(parts.join(', '))
  }

  return (
    <div
      className={cn(
        'rounded-[14px] border p-4',
        answered ? 'border-alpha-10 bg-alpha-5/50' : 'border-secondary-400 bg-secondary-50',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-primary-900 text-secondary-300">
          <MessageCircleQuestion className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-2 font-semibold text-primary-900">{question.question}</p>
          {answered && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-caption-2 text-alpha-60">
              <Check className="size-3" />
              Answered
            </p>
          )}
        </div>
      </div>

      {!answered && (
        <div className="mt-3 space-y-3">
          {question.kind !== 'text' && options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const active = picked.includes(opt.label)
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={locked}
                    title={opt.hint || undefined}
                    onClick={() => {
                      if (question.kind === 'single') onAnswer(opt.label)
                      else setPicked((prev) => (active ? prev.filter((p) => p !== opt.label) : [...prev, opt.label]))
                    }}
                    className={cn(
                      chip,
                      active
                        ? 'border-primary-900 bg-primary-900 text-white'
                        : 'border-primary-900/30 bg-white text-primary-900 hover:border-primary-900',
                    )}
                  >
                    {question.kind === 'multi' && active && <Check className="mr-1 inline size-3" />}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}
          {options.some((o) => o.hint) && question.kind !== 'text' && (
            <ul className="space-y-0.5">
              {options
                .filter((o) => o.hint)
                .map((o) => (
                  <li key={o.label} className="text-caption-2 text-alpha-60">
                    <span className="font-semibold text-primary-900">{o.label}</span>: {o.hint}
                  </li>
                ))}
            </ul>
          )}

          {(question.kind === 'text' || question.allow_other) && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (question.kind === 'multi') submitMulti()
                else if (other.trim()) onAnswer(other.trim())
              }}
              className="flex items-center gap-2"
            >
              <input
                value={other}
                onChange={(e) => setOther(e.target.value)}
                disabled={locked}
                placeholder={question.kind === 'text' ? 'Type your answer…' : 'Something else…'}
                className="min-w-0 flex-1 rounded-[10px] border border-alpha-10 bg-white px-3 py-2 text-caption-1 text-primary-900 outline-none placeholder:text-alpha-30 focus:border-primary-900"
              />
              <button
                type="submit"
                disabled={locked || (question.kind === 'multi' ? picked.length === 0 && !other.trim() : !other.trim())}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-primary-900 bg-white px-3 py-2 text-caption-1 font-semibold text-primary-900 shadow-signature transition-all hover:bg-secondary-50 disabled:opacity-50 disabled:shadow-none"
              >
                <CornerDownLeft className="size-3.5" />
                {question.kind === 'multi' ? 'Send answer' : 'Answer'}
              </button>
            </form>
          )}
          {question.kind === 'multi' && !question.allow_other && (
            <button
              type="button"
              onClick={submitMulti}
              disabled={locked || picked.length === 0}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-primary-900 bg-white px-3 py-2 text-caption-1 font-semibold text-primary-900 shadow-signature transition-all hover:bg-secondary-50 disabled:opacity-50 disabled:shadow-none"
            >
              <CornerDownLeft className="size-3.5" />
              Send answer
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** The three-dot "Navix is thinking" indicator. */
export function TypingDots({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-caption-1 text-alpha-60">
      <span className="inline-flex items-center gap-1" aria-hidden>
        <span className="size-1.5 animate-bounce rounded-full bg-alpha-40 [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-alpha-40 [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-alpha-40 [animation-delay:300ms]" />
      </span>
      {label && <span>{label}</span>}
    </span>
  )
}
