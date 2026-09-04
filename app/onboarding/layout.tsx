import Link from 'next/link'

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Soft top gradient. Same accent radial used on landing islands */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-header opacity-70" />

      {/* Top nav. Compact, just the logo */}
      <nav className="mx-auto max-w-[1340px] px-5 sm:px-6 md:px-12 lg:px-16 py-5">
        <Link href="/" className="shrink-0 inline-flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_navix.svg"
            alt="Navix"
            className="h-5 w-auto sm:h-6"
          />
        </Link>
      </nav>

      {children}
    </main>
  )
}
