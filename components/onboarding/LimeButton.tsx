'use client'

import { cn } from '@/lib/utils'

interface LimeButtonProps {
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  size?: 'md' | 'lg'
  variant?: 'primary' | 'ghost'
  className?: string
  children: React.ReactNode
}

const sizes = {
  md: 'px-4 py-2.5 text-caption-1',
  lg: 'px-5 py-3 text-body-2',
}

/**
 * The Navix signature lime CTA. Use everywhere a primary action lives.
 *
 *   bg-secondary-300 + text-primary-900 + border-primary-900 + shadow-signature
 *
 * The ghost variant is a quieter secondary action (e.g. "Back").
 */
export function LimeButton({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  size = 'lg',
  variant = 'primary',
  className,
  children,
}: LimeButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[12px] font-medium transition-all duration-200',
        sizes[size],
        variant === 'primary' && [
          'bg-secondary-300 text-primary-900 border border-primary-900 shadow-signature',
          'hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23]',
          'active:shadow-none active:translate-y-[2px]',
        ],
        variant === 'ghost' && [
          'bg-white text-primary-900 border border-alpha-10',
          'hover:bg-alpha-5 hover:border-alpha-20',
        ],
        isDisabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      {loading ? (
        <span className="inline-block size-4 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}
