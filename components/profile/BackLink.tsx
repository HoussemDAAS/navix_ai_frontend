'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-caption-1 font-medium text-alpha-60 transition-colors hover:text-primary-900"
    >
      <ArrowLeft className="size-3.5" />
      {label}
    </Link>
  )
}
