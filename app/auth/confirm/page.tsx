'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const [error, setError] = useState(false)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 5

    function tryResolveSession() {
      attempts++
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/onboarding/role')
        } else if (attempts < maxAttempts) {
          setTimeout(tryResolveSession, 500)
        } else {
          setError(true)
          setTimeout(() => router.replace('/login?error=auth_callback_failed'), 2000)
        }
      })
    }

    tryResolveSession()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-body-2 text-destructive-500">Authentication failed. Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-body-2 text-alpha-60">Signing you in...</p>
    </div>
  )
}
