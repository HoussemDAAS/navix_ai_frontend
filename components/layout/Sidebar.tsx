'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Settings, LogOut, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useSidebarStore } from '@/stores/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderOpen },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarContentProps {
  pathname: string
  userEmail: string
  userInitials: string
  onNavigate?: () => void
  onSignOut: () => void
}

function SidebarContent({ pathname, userEmail, userInitials, onNavigate, onSignOut }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <img src="/logo_navix.svg" alt="Navix" className="h-5 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-caption-1 font-medium transition-colors',
                    isActive
                      ? 'bg-secondary-300/20 text-primary-btn font-semibold'
                      : 'text-alpha-60 hover:bg-alpha-5 hover:text-primary-900'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-secondary-400" />
                  )}
                  <item.icon className="size-[18px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-alpha-10 px-3 py-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary-100 text-primary-900 text-caption-2 font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-caption-2 font-medium text-primary-900 truncate">
              {userEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="shrink-0 rounded-[8px] p-1.5 text-alpha-40 hover:text-destructive-500 hover:bg-destructive-50 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface SidebarProps {
  userEmail: string
  userInitials: string
}

export function Sidebar({ userEmail, userInitials }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebarStore()

  // Close sidebar on route change
  useEffect(() => {
    close()
  }, [pathname, close])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col border-r border-alpha-10 bg-white h-screen sticky top-0">
        <SidebarContent
          pathname={pathname}
          userEmail={userEmail}
          userInitials={userInitials}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-primary-900/40 lg:hidden"
              onClick={close}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-lg lg:hidden"
            >
              <button
                type="button"
                onClick={close}
                className="absolute right-3 top-4 rounded-[8px] p-1.5 text-alpha-60 hover:bg-alpha-5 transition-colors"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
              <SidebarContent
                pathname={pathname}
                userEmail={userEmail}
                userInitials={userInitials}
                onNavigate={close}
                onSignOut={handleSignOut}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
