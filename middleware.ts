import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: { headers: req.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname

  // Public pages
  const isPublicPage =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/showcase')

  // Auth pages (login/signup)
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')

  const isOnboardingPage = pathname.startsWith('/onboarding')

  // Not logged in → redirect to login (except public/auth pages)
  if (!user && !isPublicPage && !isAuthPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Logged in on auth page → redirect to dashboard
  if (user && isAuthPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  // Logged in on a protected page → check onboarding status
  if (user && !isPublicPage && !isAuthPage) {
    // Use supabase.auth session context — getUser() above already refreshed cookies
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    // If profile query fails (RLS issue), skip onboarding check to avoid redirect loops
    if (profileError) {
      return res
    }

    const hasCompletedOnboarding = profile?.onboarding_completed === true

    if (!hasCompletedOnboarding && !isOnboardingPage) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/onboarding'
      return NextResponse.redirect(redirectUrl)
    }

    if (hasCompletedOnboarding && isOnboardingPage) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico|assets/).*)'],
}
