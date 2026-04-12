'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar'

export function Topbar() {
  const { open } = useSidebarStore()

  return (
    <header className="flex h-14 items-center justify-between border-b border-alpha-10 bg-white px-4 lg:hidden">
      <button
        type="button"
        onClick={open}
        className="rounded-[8px] p-2 text-primary-900 hover:bg-alpha-5 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>
      <Link href="/dashboard">
        <img src="/logo_navix.svg" alt="Navix" className="h-4 w-auto" />
      </Link>
      {/* Spacer to keep logo centered */}
      <div className="w-9" />
    </header>
  )
}
