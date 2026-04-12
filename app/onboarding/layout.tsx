import Link from 'next/link'

interface OnboardingLayoutProps {
  children: React.ReactNode
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <main className="min-h-screen bg-white">
      {/* Logo — compact top nav */}
      <nav className="mx-auto max-w-[1340px] px-5 sm:px-6 md:px-12 lg:px-16 py-4">
        <Link href="/" className="shrink-0 inline-block">
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
