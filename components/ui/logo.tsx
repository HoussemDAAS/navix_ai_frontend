import Image from 'next/image'
import { cn } from '@/lib/utils'

// ─── Figma reference: node 38-1454 (Register / Login logo pattern) ────────────
// The logo renders as a dark bg container wrapping the PNG asset.
// The PNG uses brightness-200 to appear white on the dark background.
// Matching the existing login page pattern:
//   bg-foreground p-2 rounded-xl  (icon container)
//   "Navix" in font-bold Inter next to it when showText=true
// ──────────────────────────────────────────────────────────────────────────────

interface LogoProps {
  /** Controls the icon (and container) size */
  size?: 'sm' | 'md' | 'lg'
  /** When true renders "Navix" text next to the icon */
  showText?: boolean
  className?: string
}

const iconSizes: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 40,
}

const containerPadding: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
}

const containerRadius: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
}

const textSize: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({ size = 'md', showText = false, className }: LogoProps) {
  const px = iconSizes[size]

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      {/* Dark container matches login page pattern (bg-foreground p-2 rounded-xl) */}
      <div
        className={cn(
          'bg-[#2F2B43] shrink-0',
          containerPadding[size],
          containerRadius[size],
        )}
      >
        <Image
          src="/logo_navix.png"
          alt="Navix logo"
          width={px}
          height={px}
          className="brightness-200 block"
        />
      </div>

      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight text-[#2F2B43] leading-none',
            textSize[size],
          )}
        >
          Navix
        </span>
      )}
    </div>
  )
}
