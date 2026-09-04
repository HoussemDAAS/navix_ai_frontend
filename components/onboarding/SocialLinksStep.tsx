'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, X, Link2, Sparkles, Instagram, Youtube, Facebook } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LimeButton } from '@/components/onboarding/LimeButton'
import {
  parseSocialLink,
  isShareLink,
  shareLinkPlatform,
  PLATFORM_LABEL,
  type SocialPlatform,
} from '@/lib/social-links'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.27 8.27 0 0 0 4.85 1.56V6.64a4.84 4.84 0 0 1-1.09.05Z" />
    </svg>
  )
}

const platformIcon: Record<SocialPlatform, React.ReactNode> = {
  instagram: <Instagram className="size-3.5" />,
  tiktok: <TikTokIcon className="size-3.5" />,
  youtube: <Youtube className="size-3.5" />,
  facebook: <Facebook className="size-3.5" />,
}

const MAX_LINKS = 4
const MAX_SEEDS = 3
const MIN_DESCRIPTION = 20
const MIN_KEYWORDS = 3

export interface SocialLinksValue {
  social_links: string[]
  has_social_presence: boolean
  niche_description: string
  keywords: string[]
  seed_accounts: string[]
}

interface SocialLinksStepProps {
  value: SocialLinksValue
  onChange: (patch: Partial<SocialLinksValue>) => void
  onSubmit: () => void
  saving: boolean
  error?: string | null
  /** Persona-specific hint under the "I'm new" description field */
  descriptionPlaceholder?: string
}

const inputClasses =
  'flex-1 min-w-0 bg-transparent outline-none text-body-2 font-medium text-primary-900 placeholder:text-alpha-40'
const fieldClasses =
  'flex items-center w-full h-12 rounded-[12px] bg-white border shadow-card pl-3 pr-2 gap-2 transition-shadow hover:border-alpha-20 focus-within:border-transparent focus-within:shadow-[0px_0px_0px_3px] focus-within:shadow-ring'

/**
 * Onboarding step: paste full profile links (any platform), or declare that
 * there are no accounts yet and describe the niche instead.
 */
export function SocialLinksStep({
  value,
  onChange,
  onSubmit,
  saving,
  error,
  descriptionPlaceholder,
}: SocialLinksStepProps) {
  const [touched, setTouched] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')

  const links = value.social_links.length > 0 ? value.social_links : ['']
  const parsedLinks = links.map((l) => (l.trim() ? parseSocialLink(l) : null))
  // Share links (vm.tiktok.com/…, facebook.com/share/…) are resolved server-side on save
  const shareLinks = links.map((l, i) => !parsedLinks[i] && !!l.trim() && isShareLink(l))
  const validLinks = parsedLinks.filter(Boolean).length + shareLinks.filter(Boolean).length
  const invalidLinks = links.filter((l, i) => l.trim() && !parsedLinks[i] && !shareLinks[i]).length

  const seeds = value.seed_accounts
  const seedsInvalid = seeds.filter((s) => s.trim() && !parseSocialLink(s) && !/^@?[A-Za-z0-9._-]{1,64}$/.test(s.trim())).length

  const descriptionOk = value.niche_description.trim().length >= MIN_DESCRIPTION
  const keywordsOk = value.keywords.length >= MIN_KEYWORDS

  const canSubmit = value.has_social_presence
    ? validLinks >= 1 && invalidLinks === 0
    : descriptionOk && keywordsOk && seedsInvalid === 0

  function setLink(i: number, v: string) {
    const next = [...links]
    next[i] = v
    onChange({ social_links: next })
  }
  function removeLink(i: number) {
    const next = links.filter((_, idx) => idx !== i)
    onChange({ social_links: next.length ? next : [''] })
  }
  function setSeed(i: number, v: string) {
    const next = [...seeds]
    next[i] = v
    onChange({ seed_accounts: next })
  }
  function removeSeed(i: number) {
    onChange({ seed_accounts: seeds.filter((_, idx) => idx !== i) })
  }
  function addKeyword(raw: string) {
    const parts = raw.split(/[,\n]/).map((k) => k.trim().toLowerCase()).filter(Boolean)
    if (!parts.length) return
    const merged = [...new Set([...value.keywords, ...parts])].slice(0, 15)
    onChange({ keywords: merged })
    setKeywordInput('')
  }
  function handleSubmit() {
    setTouched(true)
    if (!canSubmit) return
    onSubmit()
  }

  return (
    <div className="space-y-5">
      {value.has_social_presence ? (
        <>
          <div className="space-y-3">
            {links.map((link, i) => {
              const parsed = parsedLinks[i]
              const share = shareLinks[i]
              const sharePlatform = share ? shareLinkPlatform(link) : null
              const showInvalid = touched && link.trim() && !parsed && !share
              return (
                <div key={i} className="space-y-1.5">
                  <div className={cn(fieldClasses, showInvalid ? 'border-destructive-300' : 'border-alpha-10')}>
                    <Link2 className="size-4 text-alpha-40 shrink-0" />
                    <input
                      type="url"
                      value={link}
                      autoFocus={i === 0}
                      onChange={(e) => setLink(i, e.target.value)}
                      placeholder={i === 0 ? 'https://instagram.com/yourbrand' : 'https://tiktok.com/@yourbrand'}
                      className={inputClasses}
                    />
                    {parsed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 border border-secondary-300 px-2 py-0.5 text-caption-2 font-semibold text-primary-900 shrink-0">
                        {platformIcon[parsed.platform]}
                        @{parsed.handle.split('/').pop()}
                      </span>
                    )}
                    {share && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 border border-alpha-10 px-2 py-0.5 text-caption-2 font-semibold text-alpha-60 shrink-0">
                        {sharePlatform ? platformIcon[sharePlatform] : <Link2 className="size-3.5" />}
                        share link
                      </span>
                    )}
                    {links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] text-alpha-40 hover:bg-alpha-5 hover:text-primary-900 shrink-0"
                        aria-label="Remove link"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                  {showInvalid && (
                    <p className="text-caption-2 text-destructive-500">
                      Paste the full profile link — Instagram, TikTok, YouTube or Facebook.
                    </p>
                  )}
                </div>
              )
            })}

            {links.length < MAX_LINKS && (
              <button
                type="button"
                onClick={() => onChange({ social_links: [...links, ''] })}
                className="inline-flex items-center gap-1.5 text-caption-1 font-semibold text-primary-900 hover:underline underline-offset-4"
              >
                <Plus className="size-3.5" />
                Add another account
              </button>
            )}
          </div>

          {touched && validLinks === 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-caption-1 text-destructive-500">
              Add at least one profile link, or tell us you&apos;re new below.
            </motion.p>
          )}

          <p className="text-caption-2 text-alpha-60">
            We read your recent posts to learn your voice and to find accounts competing for the same audience. Nothing is posted on your behalf.
          </p>

          {error && <p className="text-caption-1 font-medium text-destructive-500">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-alpha-10">
            <button
              type="button"
              onClick={() => {
                setTouched(false)
                onChange({ has_social_presence: false })
              }}
              className="inline-flex items-center gap-1.5 text-caption-1 font-semibold text-alpha-60 hover:text-primary-900 transition-colors text-left"
            >
              <Sparkles className="size-3.5" />
              I&apos;m new — no accounts yet
            </button>
            <LimeButton onClick={handleSubmit} loading={saving}>
              Finish setup
              <ArrowRight className="size-4" />
            </LimeButton>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-[14px] border border-secondary-300 bg-secondary-50 px-4 py-3">
            <p className="text-caption-1 font-semibold text-primary-900">Starting from zero — that&apos;s fine.</p>
            <p className="text-caption-2 text-primary-900/70 mt-0.5">
              Since we can&apos;t read your posts yet, the more precise you are here, the more accurate your competitors will be.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-caption-1 font-semibold text-primary-900">
              What will you post about? <span className="text-alpha-60 font-normal">(be specific)</span>
            </label>
            <textarea
              rows={3}
              value={value.niche_description}
              onChange={(e) => onChange({ niche_description: e.target.value })}
              placeholder={descriptionPlaceholder ?? 'e.g. Handmade natural skincare for women 25–40 in Tunisia: routines, ingredient breakdowns, before/after results.'}
              className={cn(
                'w-full rounded-[12px] border bg-white px-4 py-3 text-body-2 text-primary-900 placeholder:text-alpha-40 outline-none transition-all resize-none shadow-card',
                touched && !descriptionOk ? 'border-destructive-300' : 'border-alpha-10 hover:border-alpha-20 focus:border-transparent focus:shadow-[0px_0px_0px_3px] focus:shadow-ring',
              )}
            />
            {touched && !descriptionOk && (
              <p className="text-caption-2 text-destructive-500">A couple of sentences at least ({MIN_DESCRIPTION}+ characters).</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-caption-1 font-semibold text-primary-900">
              Keywords people would search <span className="text-alpha-60 font-normal">(at least {MIN_KEYWORDS})</span>
            </label>
            <div className={cn('flex flex-wrap items-center gap-1.5 rounded-[12px] border bg-white px-3 py-2 shadow-card', touched && !keywordsOk ? 'border-destructive-300' : 'border-alpha-10')}>
              {value.keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-full bg-primary-900 text-white px-2.5 py-1 text-caption-2 font-medium">
                  {k}
                  <button type="button" onClick={() => onChange({ keywords: value.keywords.filter((x) => x !== k) })} aria-label={`Remove ${k}`}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addKeyword(keywordInput)
                  }
                }}
                onBlur={() => addKeyword(keywordInput)}
                placeholder={value.keywords.length ? 'Add more…' : 'e.g. skincare tunisie, natural cosmetics, routine visage'}
                className="flex-1 min-w-[10rem] bg-transparent outline-none text-body-2 text-primary-900 placeholder:text-alpha-40 py-1"
              />
            </div>
            <p className="text-caption-2 text-alpha-60">Press Enter or comma to add one.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-caption-1 font-semibold text-primary-900">
              Accounts you admire or compete with <span className="text-alpha-60 font-normal">(optional, up to {MAX_SEEDS})</span>
            </label>
            <div className="space-y-2">
              {seeds.map((s, i) => {
                const parsed = s.trim() ? parseSocialLink(s) : null
                const bareOk = /^@?[A-Za-z0-9._-]{1,64}$/.test(s.trim())
                const invalid = touched && s.trim() && !parsed && !bareOk
                return (
                  <div key={i} className={cn(fieldClasses, invalid ? 'border-destructive-300' : 'border-alpha-10')}>
                    <Link2 className="size-4 text-alpha-40 shrink-0" />
                    <input
                      type="text"
                      value={s}
                      onChange={(e) => setSeed(i, e.target.value)}
                      placeholder="https://instagram.com/a-brand-you-look-up-to"
                      className={inputClasses}
                    />
                    {parsed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-alpha-5 border border-alpha-10 px-2 py-0.5 text-caption-2 font-semibold text-primary-900 shrink-0">
                        {platformIcon[parsed.platform]}
                        {PLATFORM_LABEL[parsed.platform]}
                      </span>
                    )}
                    <button type="button" onClick={() => removeSeed(i)} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-alpha-40 hover:bg-alpha-5 hover:text-primary-900 shrink-0" aria-label="Remove">
                      <X className="size-4" />
                    </button>
                  </div>
                )
              })}
              {seeds.length < MAX_SEEDS && (
                <button
                  type="button"
                  onClick={() => onChange({ seed_accounts: [...seeds, ''] })}
                  className="inline-flex items-center gap-1.5 text-caption-1 font-semibold text-primary-900 hover:underline underline-offset-4"
                >
                  <Plus className="size-3.5" />
                  Add an account
                </button>
              )}
            </div>
            <p className="text-caption-2 text-alpha-60">
              We use them as seeds: their audience and similar accounts become your first competitor map.
            </p>
          </div>

          {error && <p className="text-caption-1 font-medium text-destructive-500">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-alpha-10">
            <button
              type="button"
              onClick={() => {
                setTouched(false)
                onChange({ has_social_presence: true })
              }}
              className="text-caption-1 font-semibold text-alpha-60 hover:text-primary-900 transition-colors"
            >
              Actually, I have accounts
            </button>
            <LimeButton onClick={handleSubmit} loading={saving}>
              Finish setup
              <ArrowRight className="size-4" />
            </LimeButton>
          </div>
        </>
      )}
    </div>
  )
}
