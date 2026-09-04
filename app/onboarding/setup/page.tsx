import { redirect } from 'next/navigation'

/**
 * Legacy combined setup route.
 *
 * Onboarding is now persona-specific (`/onboarding/ecommerce` etc.). The
 * `/onboarding` entry resolves which one to use from the saved profile state.
 */
export default function SetupRedirectPage() {
  redirect('/onboarding')
}
