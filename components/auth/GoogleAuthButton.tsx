"use client"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function GoogleAuthButton() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    })
  }

  return (
    <Button
      variant="tertiary"
      size="lg"
      onClick={handleGoogleLogin}
      className="w-full"
    >
      <Image src="/google_icon.png" alt="Google" width={20} height={20} />
      Continuer avec Google
    </Button>
  )
}
