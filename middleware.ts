import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Diagnostic log
  console.log(`[Middleware] Checking path: ${req.nextUrl.pathname}`)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicPage = req.nextUrl.pathname === '/' ||
                      req.nextUrl.pathname.startsWith('/login') ||
                      req.nextUrl.pathname.startsWith('/signup') ||
                      req.nextUrl.pathname.startsWith('/auth') ||
                      req.nextUrl.pathname.startsWith('/showcase')

  // If user is not signed in and trying to access a protected route
  if (!user && !isPublicPage) {
    console.log(`[Middleware] No user found, redirecting ${req.nextUrl.pathname} to /login`)
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access login/signup
  if (user && isPublicPage && !req.nextUrl.pathname.startsWith('/auth/callback')) {
    console.log(`[Middleware] User found, redirecting ${req.nextUrl.pathname} to /onboarding`)
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/onboarding'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico|assets/).*)'],
}
