'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, type Profile } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'

/**
 * Onboarding entry. Routes the user to the right step based on the saved
 * `onboarding_step` field on their profile.
 *
 *   completed     -> /dashboard
 *   account_type  -> /onboarding/account-type
 *   anything else -> /onboarding/<persona>
 */
export default function OnboardingEntryPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data: profile } = await getProfile()
        if (cancelled) return
        router.replace(resolveDestination(profile))
      } catch (err) {
        console.warn('Could not load profile for onboarding routing:', err)
        if (!cancelled) router.replace('/onboarding/account-type')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

function resolveDestination(profile: Profile): string {
  if (profile.onboarding_completed) return '/dashboard'

  if (!profile.persona || profile.onboarding_step === 'account_type') {
    return '/onboarding/account-type'
  }

  return `/onboarding/${profile.persona}`
}
