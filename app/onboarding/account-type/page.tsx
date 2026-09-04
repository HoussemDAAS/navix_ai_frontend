'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProfile, type ProfilePersona } from '@/lib/api'
import { useOnboardingStore } from '@/stores/onboarding'

interface PersonaOption {
  persona: ProfilePersona
  image: string
  alt: string
  title: string
  description: string
  hint: string
}

const OPTIONS: PersonaOption[] = [
  {
    persona: 'ecommerce',
    image: '/ecommerce.png',
    alt: 'E-commerce illustration',
    title: 'E-commerce Brand',
    description: 'Run an online store. Get content that converts.',
    hint: 'Best for DTC brands, Shopify stores & product makers',
  },
  {
    persona: 'agency',
    image: '/marketing.png',
    alt: 'Marketing agency illustration',
    title: 'Marketing Agency',
    description: 'Manage multiple clients. Scale content across brands.',
    hint: 'Best for agencies, freelancers & in-house teams',
  },
  {
    persona: 'creator',
    image: '/contentreator.png',
    alt: 'Content creator illustration',
    title: 'Content Creator',
    description: 'Grow your personal brand. Find your voice.',
    hint: 'Best for creators, influencers & solo brands',
  },
]

export default function AccountTypePage() {
  const router = useRouter()
  const setPersona = useOnboardingStore((s) => s.setPersona)
  const setOnboardingStep = useOnboardingStore((s) => s.setOnboardingStep)
  const [picked, setPicked] = useState<ProfilePersona | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Bug 6: reset any persisted draft from a previous user/session.
  // Runs once on mount so a fresh persona pick starts from a clean slate.
  useEffect(() => {
    useOnboardingStore.getState().reset()
  }, [])

  async function handleSelect(persona: ProfilePersona) {
    if (submitting) return
    setPicked(persona)
    setSubmitting(true)
    setErrorMsg(null)

    // Optimistic local update
    const prevPersona = useOnboardingStore.getState().persona
    setPersona(persona)
    setOnboardingStep('identity')

    try {
      await updateProfile({ persona, onboarding_step: 'identity' })
      // Brief delay so the user sees the selected state before nav
      setTimeout(() => router.push(`/onboarding/${persona}`), 280)
    } catch (err) {
      // Rollback
      if (prevPersona) setPersona(prevPersona)
      setOnboardingStep('account_type')
      setPicked(null)
      setSubmitting(false)
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Try again.',
      )
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 pt-8 sm:pt-14 pb-16">
      <div className="w-full max-w-5xl mx-auto">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-50 border border-secondary-200 text-caption-2 font-semibold text-primary-900 mb-4">
            <Sparkles className="size-3" />
            Step 1 of 4
          </span>
          <h1 className="text-h4 sm:text-h3 lg:text-h2 font-bold text-primary-900 tracking-tight mb-3">
            Which one sounds like you?
          </h1>
          <p className="text-body-1 text-alpha-60 max-w-xl mx-auto">
            We tune Navix differently for each. Pick the closest fit. You can change it later in settings.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {OPTIONS.map((opt, i) => {
            const isSelected = picked === opt.persona
            const isDimmed = picked !== null && picked !== opt.persona

            return (
              <motion.button
                key={opt.persona}
                type="button"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.12 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={!isSelected ? { y: -4 } : undefined}
                onClick={() => handleSelect(opt.persona)}
                disabled={submitting}
                className={cn(
                  'group relative flex flex-col items-start text-left p-6 sm:p-7 min-h-[280px]',
                  'rounded-[28px] border border-primary-900 shadow-signature overflow-hidden',
                  'transition-all duration-300',
                  isSelected
                    ? 'bg-secondary-300'
                    : 'bg-white hover:bg-secondary-50',
                  isDimmed && 'opacity-50 scale-[0.99]',
                  submitting && 'cursor-wait',
                )}
              >
                {/* Decorative gradient blob */}
                <div
                  className={cn(
                    'pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl transition-opacity duration-500',
                    isSelected
                      ? 'bg-secondary-400 opacity-60'
                      : 'bg-secondary-200 opacity-0 group-hover:opacity-70',
                  )}
                />

                {/* Illustration tile */}
                <div className="relative mb-5">
                  <div className="h-24 w-24 sm:h-[100px] sm:w-[100px] flex items-center justify-center">
                    <Image
                      src={opt.image}
                      alt={opt.alt}
                      width={100}
                      height={100}
                      className="h-full w-full object-contain"
                      priority
                    />
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary-900 border-2 border-secondary-300 flex items-center justify-center"
                    >
                      <Check className="size-3 text-secondary-300" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>

                {/* Body */}
                <h2 className="relative text-h6 sm:text-h5 font-bold text-primary-900 mb-2 tracking-tight">
                  {opt.title}
                </h2>
                <p className="relative text-body-2 text-primary-900/80 mb-4">
                  {opt.description}
                </p>

                <div className="relative mt-auto w-full pt-4 border-t border-primary-900/10">
                  <p className="text-caption-2 font-medium text-primary-900/60 mb-2">
                    {opt.hint}
                  </p>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-caption-1 font-semibold transition-colors',
                      isSelected ? 'text-primary-900' : 'text-primary-900/70 group-hover:text-primary-900',
                    )}
                  >
                    {isSelected ? 'Selected' : "Let's go"}
                    <ArrowRight
                      className={cn(
                        'size-4 transition-transform duration-200',
                        !isSelected && 'group-hover:translate-x-0.5',
                      )}
                    />
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>

        {errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-caption-1 font-medium text-destructive-500 mt-6"
          >
            {errorMsg}
          </motion.p>
        )}

        <p className="text-caption-2 text-alpha-30 text-center mt-10">
          Already set up? Your selection saves automatically.
        </p>
      </div>
    </div>
  )
}
