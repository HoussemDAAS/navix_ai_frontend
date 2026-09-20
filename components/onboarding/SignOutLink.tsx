'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOnboardingStore } from '@/stores/onboarding'

/**
 * Quiet escape hatch from onboarding (mostly for testing accounts): clears the
 * persisted onboarding draft so the next sign-in starts from a clean slate.
 */
export function SignOutLink() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    if (busy) return
    setBusy(true)
    try {
      useOnboardingStore.getState().reset()
      await supabase.auth.signOut()
      router.push('/login')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="inline-flex items-center gap-1 text-caption-2 text-alpha-40 transition-colors hover:text-primary-900 disabled:opacity-50"
    >
      <LogOut className="size-3" />
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
