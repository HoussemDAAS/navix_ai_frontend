'use client'

import { useRouter } from 'next/navigation'
import { ShoppingBag, Building2, Star, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboarding'

type Persona = 'ecommerce' | 'agency' | 'creator'

interface RoleCard {
  persona: Persona
  icon: React.ElementType
  title: string
  description: string
}

const roles: RoleCard[] = [
  {
    persona: 'ecommerce',
    icon: ShoppingBag,
    title: 'E-Commerce Brand',
    description: 'I sell products online',
  },
  {
    persona: 'agency',
    icon: Building2,
    title: 'Marketing Agency',
    description: 'I manage multiple client brands',
  },
  {
    persona: 'creator',
    icon: Star,
    title: 'Content Creator',
    description: 'I create content for my audience',
  },
]

export default function RoleSelectorPage() {
  const router = useRouter()
  const setPersona = useOnboardingStore((s) => s.setPersona)
  const setStep = useOnboardingStore((s) => s.setStep)
  const [selected, setSelected] = useState<Persona | null>(null)

  function handleSelect(persona: Persona) {
    setSelected(persona)
    setPersona(persona)
    setStep(1)

    // Creators get their own streamlined flow
    setTimeout(() => {
      router.push(persona === 'creator' ? '/onboarding/creator' : '/onboarding/setup')
    }, 250)
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 sm:px-8 pt-16 sm:pt-24 pb-16">
      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="text-h3 sm:text-h2 lg:text-h1 font-bold text-primary-btn text-center mb-12 sm:mb-16"
      >
        Who are you building for?
      </motion.h1>

      {/* Cards container */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 justify-center items-stretch w-full max-w-5xl mx-auto">
        {roles.map((role, i) => {
          const isSelected = selected === role.persona
          const Icon = role.icon

          return (
            <motion.button
              key={role.persona}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: i * 0.08,
                ease: [0.23, 1, 0.32, 1],
              }}
              onClick={() => handleSelect(role.persona)}
              disabled={selected !== null}
              className={cn(
                // Signature card style
                'flex-1 min-h-[140px] lg:min-h-[220px] p-6 sm:p-8',
                'flex flex-col items-start gap-4 text-left',
                'border border-black rounded-[45px] shadow-signature overflow-hidden',
                'cursor-pointer transition-all duration-150',
                // Background states
                isSelected
                  ? 'bg-secondary-300'
                  : 'bg-primary-50 hover:bg-secondary-300',
                // Disabled after selection
                selected !== null && !isSelected && 'opacity-50 pointer-events-none',
              )}
            >
              {/* Icon circle */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary-btn flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>

                {/* Checkmark overlay on selected */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-btn flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-secondary-300" strokeWidth={3} />
                  </motion.div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-h5 font-bold text-primary-btn">
                {role.title}
              </h2>

              {/* Description */}
              <p className="text-body-1 font-medium text-slate-500">
                {role.description}
              </p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
