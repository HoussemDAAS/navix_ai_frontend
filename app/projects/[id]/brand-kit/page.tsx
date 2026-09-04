'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Check,
  AlertCircle,
  Megaphone,
  Coffee,
  Zap,
  Heart,
  BookOpen,
  Trophy,
  MessageCircle,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { getBrandKit, saveBrandKit, type BrandKitPayload } from '@/lib/api'

/* ─── Tone tiles config ─── */
const TONES = [
  { value: 'Professional', icon: Trophy, label: 'Professional', desc: 'Polished & authoritative' },
  { value: 'Casual', icon: Coffee, label: 'Casual', desc: 'Friendly & approachable' },
  { value: 'Playful', icon: Sparkles, label: 'Playful', desc: 'Fun & energetic' },
  { value: 'Bold', icon: Zap, label: 'Bold', desc: 'Direct & confident' },
  { value: 'Inspirational', icon: Heart, label: 'Inspirational', desc: 'Uplifting & motivating' },
  { value: 'Educational', icon: BookOpen, label: 'Educational', desc: 'Informative & clear' },
]

const FORMALITY_LEVELS = [
  { value: 'Very Formal', label: 'Very Formal', example: '"We would be delighted to assist you."' },
  { value: 'Formal', label: 'Formal', example: '"We\'re happy to help you with that."' },
  { value: 'Neutral', label: 'Neutral', example: '"Happy to help! Here\'s what you need."' },
  { value: 'Informal', label: 'Informal', example: '"Hey! Let me sort that out for you."' },
  { value: 'Very Informal', label: 'Very Informal', example: '"Yo, I got you. Check this out."' },
]

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

export default function BrandKitPage() {
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const [toneOfVoice, setToneOfVoice] = useState('')
  const [formalityLevel, setFormalityLevel] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [objective, setObjective] = useState('')
  const [vocabExclude, setVocabExclude] = useState('')
  const [constraints, setConstraints] = useState<string[]>([])
  const [constraintInput, setConstraintInput] = useState('')
  const [preferredCta, setPreferredCta] = useState('')

  useEffect(() => {
    async function fetchBrandKit() {
      try {
        const res = await getBrandKit(projectId)
        const kit = res.data
        if (kit) {
          setToneOfVoice(kit.tone_of_voice ?? '')
          setFormalityLevel(kit.formality_level ?? '')
          setTargetAudience(kit.target_audience ?? '')
          setObjective(kit.objective ?? '')
          setVocabExclude(kit.vocab_exclude ?? '')
          setConstraints(kit.constraints ?? [])
          setPreferredCta(kit.preferred_cta ?? '')
        }
      } catch (err) {
        console.error('Failed to load brand kit:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrandKit()
  }, [projectId])

  const handleAddConstraint = useCallback(() => {
    const trimmed = constraintInput.trim()
    if (trimmed && !constraints.includes(trimmed)) {
      setConstraints((prev) => [...prev, trimmed])
      setConstraintInput('')
    }
  }, [constraintInput, constraints])

  const handleRemoveConstraint = (index: number) => {
    setConstraints((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    setErrorMessage('')

    const payload: BrandKitPayload = {
      tone_of_voice: toneOfVoice || undefined,
      formality_level: formalityLevel || undefined,
      target_audience: targetAudience || undefined,
      objective: objective || undefined,
      vocab_exclude: vocabExclude || undefined,
      constraints: constraints.length > 0 ? constraints : undefined,
      preferred_cta: preferredCta || undefined,
    }

    try {
      await saveBrandKit(projectId, payload)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (err) {
      setSaveStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save')
      setTimeout(() => setSaveStatus('idle'), 4000)
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardShell>
    )
  }

  // Live preview text based on selections
  const previewText = toneOfVoice && formalityLevel
    ? `Your brand speaks with a ${toneOfVoice.toLowerCase()}, ${formalityLevel.toLowerCase()} voice${targetAudience ? ` to ${targetAudience.split(',')[0].trim().toLowerCase()}` : ''}.`
    : 'Select your tone and formality to see a preview of your brand voice.'

  return (
    <DashboardShell>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[960px]">
        {/* Header with live preview island */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-h4 sm:text-h3 font-bold text-primary-900 mb-2">
            Craft your voice
          </h1>
          <p className="text-body-1 text-alpha-60 max-w-[520px]">
            This is how Navix understands your brand. The more you define, the more authentic your content becomes.
          </p>

          {/* Live preview island */}
          <motion.div
            layout
            className="mt-6 rounded-[20px] bg-gradient-to-br from-secondary-50 to-white border border-secondary-200 p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-secondary-300 flex items-center justify-center">
                <MessageCircle className="size-3.5 text-primary-900" />
              </div>
              <span className="text-caption-1 font-semibold text-primary-900">Brand Voice Preview</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={previewText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-body-2 text-alpha-60 italic"
              >
                {previewText}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* ─── TONE SELECTION ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-subheadline font-semibold text-primary-900 mb-1">
            Pick your tone
          </h2>
          <p className="text-caption-1 text-alpha-50 mb-4">
            How should your content feel?
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TONES.map((tone) => {
              const Icon = tone.icon
              const isSelected = toneOfVoice === tone.value
              return (
                <motion.button
                  key={tone.value}
                  type="button"
                  onClick={() => setToneOfVoice(tone.value)}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-[16px] border-2 p-4 sm:p-5 transition-all duration-200 cursor-pointer',
                    isSelected
                      ? 'border-secondary-400 bg-secondary-50 shadow-sm'
                      : 'border-alpha-10 bg-white hover:border-alpha-20 hover:shadow-sm'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-secondary-300 flex items-center justify-center"
                    >
                      <Check className="size-3 text-primary-900" />
                    </motion.div>
                  )}
                  <div className={cn(
                    'h-10 w-10 rounded-[12px] flex items-center justify-center transition-colors',
                    isSelected ? 'bg-secondary-300' : 'bg-alpha-5'
                  )}>
                    <Icon className={cn('size-5', isSelected ? 'text-primary-900' : 'text-alpha-60')} />
                  </div>
                  <span className="text-caption-1 font-semibold text-primary-900">{tone.label}</span>
                  <span className="text-caption-2 text-alpha-50 text-center">{tone.desc}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.section>

        {/* ─── FORMALITY SPECTRUM ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-subheadline font-semibold text-primary-900 mb-1">
            Set the formality
          </h2>
          <p className="text-caption-1 text-alpha-50 mb-4">
            Where do you sit on the spectrum? Each level changes how your content sounds.
          </p>

          <div className="space-y-2">
            {FORMALITY_LEVELS.map((level) => {
              const isSelected = formalityLevel === level.value
              return (
                <motion.button
                  key={level.value}
                  type="button"
                  onClick={() => setFormalityLevel(level.value)}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-[14px] border-2 px-5 py-3.5 transition-all duration-200 text-left',
                    isSelected
                      ? 'border-secondary-400 bg-secondary-50'
                      : 'border-alpha-10 bg-white hover:border-alpha-20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-3 w-3 rounded-full transition-colors',
                      isSelected ? 'bg-secondary-400' : 'bg-alpha-20'
                    )} />
                    <span className="text-body-2 font-medium text-primary-900">{level.label}</span>
                  </div>
                  <span className="text-caption-1 text-alpha-50 hidden sm:block max-w-[280px] truncate">
                    {level.example}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.section>

        {/* ─── AUDIENCE ISLAND ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-10"
        >
          <div className="rounded-[20px] border border-alpha-10 bg-white p-6 sm:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-[10px] bg-info-50 flex items-center justify-center">
                <Megaphone className="size-4.5 text-info-500" />
              </div>
              <div>
                <h2 className="text-subheadline font-semibold text-primary-900">Who are you talking to?</h2>
                <p className="text-caption-2 text-alpha-50">Describe your ideal audience in your own words</p>
              </div>
            </div>

            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., Marketing managers at B2B SaaS companies who want to grow on LinkedIn..."
              rows={3}
              className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-3.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all resize-none"
            />

            <div className="mt-5">
              <label className="text-caption-1 font-medium text-primary-900 mb-2 block">
                What should your content achieve?
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g., Build authority, drive engagement, convert followers to leads..."
                rows={2}
                className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-3.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </motion.section>

        {/* ─── GUARDRAILS ISLAND ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.5 }}
          className="mb-10"
        >
          <div className="rounded-[20px] border border-alpha-10 bg-white p-6 sm:p-8 shadow-card">
            <h2 className="text-subheadline font-semibold text-primary-900 mb-1">Guardrails</h2>
            <p className="text-caption-1 text-alpha-50 mb-6">Set boundaries so your AI stays on-brand.</p>

            {/* Avoid words */}
            <div className="mb-6">
              <label className="text-caption-1 font-medium text-primary-900 mb-2 block">
                Words to never use
              </label>
              <input
                type="text"
                value={vocabExclude}
                onChange={(e) => setVocabExclude(e.target.value)}
                placeholder='"synergy", "disrupt", "leverage", "circle back"...'
                className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-3.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
              />
            </div>

            {/* Constraints as tags */}
            <div className="mb-6">
              <label className="text-caption-1 font-medium text-primary-900 mb-2 block">
                Content rules
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={constraintInput}
                  onChange={(e) => setConstraintInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddConstraint() }}}
                  placeholder="Add a rule and press Enter..."
                  className="flex-1 rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-3 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddConstraint}
                  disabled={!constraintInput.trim()}
                  className={cn(
                    'rounded-[12px] px-4 py-3 font-medium text-caption-1 transition-all',
                    constraintInput.trim()
                      ? 'bg-secondary-300 text-primary-900 hover:bg-secondary-400'
                      : 'bg-alpha-5 text-alpha-30 cursor-not-allowed'
                  )}
                >
                  Add
                </button>
              </div>
              {constraints.length > 0 && (
                <motion.div layout className="flex flex-wrap gap-2 mt-3">
                  <AnimatePresence>
                    {constraints.map((c, i) => (
                      <motion.span
                        key={c}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-900/5 border border-primary-900/10 px-3.5 py-1.5 text-caption-1 font-medium text-primary-900"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => handleRemoveConstraint(i)}
                          className="rounded-full p-0.5 hover:bg-destructive-50 transition-colors"
                        >
                          <X className="size-3 text-alpha-40 hover:text-destructive-500" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Preferred CTA */}
            <div>
              <label className="text-caption-1 font-medium text-primary-900 mb-2 block">
                Your go-to call-to-action
              </label>
              <input
                type="text"
                value={preferredCta}
                onChange={(e) => setPreferredCta(e.target.value)}
                placeholder='"Save this for later", "Comment your take below"...'
                className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-3.5 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
              />
            </div>
          </div>
        </motion.section>

        {/* ─── SAVE ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          className="flex items-center gap-4 pb-12"
        >
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={cn(
              'inline-flex items-center gap-2.5 rounded-[14px] px-7 py-3.5 text-body-2 font-semibold transition-all duration-200',
              'bg-secondary-300 text-primary-900 border border-primary-900 shadow-signature',
              'hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23]',
              'active:shadow-none active:translate-y-[2px]',
              saveStatus === 'saving' && 'opacity-70 cursor-not-allowed'
            )}
          >
            {saveStatus === 'saving' ? (
              <>
                <Spinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Save Brand Kit
              </>
            )}
          </button>

          <AnimatePresence>
            {saveStatus === 'success' && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 text-caption-1 font-medium text-success-600"
              >
                <Check className="size-4" />
                Saved
              </motion.span>
            )}
            {saveStatus === 'error' && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 text-caption-1 font-medium text-destructive-500"
              >
                <AlertCircle className="size-4" />
                {errorMessage}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
