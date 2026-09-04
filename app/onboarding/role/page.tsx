import { redirect } from 'next/navigation'

/** Legacy route. The role picker now lives at /onboarding/account-type. */
export default function RoleRedirectPage() {
  redirect('/onboarding/account-type')
}
