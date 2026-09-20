'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Building2,
  Calendar,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Palette,
  Settings,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useSidebarStore } from '@/stores/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { ProfilePersona, Project } from '@/lib/api'
import { invalidateWorkspace, useWorkspace, type Workspace } from './WorkspaceContext'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Match the path exactly instead of by prefix (the project home). */
  exact?: boolean
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const PROJECT_PATH = /^\/projects\/([0-9a-f-]{36})(?:\/|$)/i

/** The sidebar IS the project for every persona; only the words change. */
function projectNav(projectId: string, persona: ProfilePersona | null): NavGroup[] {
  const base = `/projects/${projectId}`
  const isAgency = persona === 'agency'
  const profileLabel =
    persona === 'creator' ? 'My profile' : isAgency ? 'Client profile' : 'Brand profile'
  return [
    {
      items: [
        { label: isAgency ? 'Overview' : 'Home', href: base, icon: LayoutDashboard, exact: true },
        { label: profileLabel, href: `${base}/profile`, icon: UserRound },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { label: 'Competitors', href: `${base}/competitors`, icon: Users },
        { label: 'Market analysis', href: `${base}/analysis`, icon: BarChart3 },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Directions', href: `${base}/directions`, icon: Lightbulb },
        { label: 'Drafts', href: `${base}/drafts`, icon: FileText },
        { label: 'Calendar', href: `${base}/calendar`, icon: Calendar },
        { label: 'Brand kit', href: `${base}/brand-kit`, icon: Palette },
      ],
    },
  ]
}

function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}

function projectInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'C'
  )
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = isActive(item, pathname)
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-caption-1 font-medium transition-colors',
          active
            ? 'bg-secondary-300/20 text-primary-btn font-semibold'
            : 'text-alpha-60 hover:bg-alpha-5 hover:text-primary-900',
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-secondary-400" />
        )}
        <item.icon className="size-[18px] shrink-0" />
        {item.label}
      </Link>
    </li>
  )
}

/** Agencies work per client: the current one is always visible at the top. */
function ClientSwitcher({ project, onNavigate }: { project: Project; onNavigate?: () => void }) {
  return (
    <div className="mx-3 mb-3 rounded-[12px] border border-alpha-10 bg-alpha-5/60 px-3 py-2.5">
      <p className="text-caption-2 font-semibold uppercase tracking-wide text-alpha-40">Client</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-primary-900 text-caption-2 font-bold text-secondary-300">
            {projectInitials(project.name)}
          </span>
          <span className="truncate text-caption-1 font-semibold text-primary-900">{project.name}</span>
        </div>
        <Link
          href="/projects"
          onClick={onNavigate}
          className="shrink-0 rounded-[8px] p-1 text-alpha-40 transition-colors hover:bg-white hover:text-primary-900"
          aria-label="Manage clients"
        >
          <Building2 className="size-4" />
        </Link>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  pathname: string
  userEmail: string
  userInitials: string
  workspace: Workspace
  onNavigate?: () => void
  onSignOut: () => void
}

function SidebarContent({
  pathname,
  userEmail,
  userInitials,
  workspace,
  onNavigate,
  onSignOut,
}: SidebarContentProps) {
  const { projects, primaryProject, persona, singleBrand, loading } = workspace

  // The project in the URL wins; anywhere else (settings) the primary project stands in.
  const match = pathname.match(PROJECT_PATH)
  const current = (match && projects.find((p) => p.id === match[1])) || primaryProject

  const groups: NavGroup[] = current
    ? projectNav(current.id, persona)
    : [{ items: [{ label: 'Home', href: '/dashboard', icon: LayoutDashboard, exact: true }] }]

  const accountItems: NavItem[] = [
    ...(!singleBrand && projects.length > 0
      ? [{ label: 'Clients', href: '/projects', icon: Building2 }]
      : []),
    { label: 'Settings', href: '/settings', icon: Settings },
  ]

  const homeHref = singleBrand && current ? `/projects/${current.id}` : '/dashboard'
  const showSkeleton = loading && !current

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href={homeHref} onClick={onNavigate}>
          <img src="/logo_navix.svg" alt="Navix" className="h-5 w-auto" />
        </Link>
      </div>

      {!singleBrand && current && <ClientSwitcher project={current} onNavigate={onNavigate} />}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-1">
        {showSkeleton ? (
          <ul className="space-y-2 px-1" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="h-9 animate-pulse rounded-[10px] bg-alpha-5" />
            ))}
          </ul>
        ) : (
          groups.map((group, gi) => (
            <div key={group.label ?? gi} className={cn(gi > 0 && 'mt-4')}>
              {group.label && (
                <p className="mb-1 px-3 text-caption-2 font-semibold uppercase tracking-wide text-alpha-40">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                ))}
              </ul>
            </div>
          ))
        )}

        <div className="mt-4 border-t border-alpha-10 pt-4">
          <ul className="space-y-1">
            {accountItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-alpha-10 px-3 py-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary-100 text-caption-2 font-semibold text-primary-900">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption-2 font-medium text-primary-900">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="shrink-0 rounded-[8px] p-1.5 text-alpha-40 transition-colors hover:bg-destructive-50 hover:text-destructive-500"
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
  const workspace = useWorkspace()
  const { isOpen, close } = useSidebarStore()

  // Close sidebar on route change
  useEffect(() => {
    close()
  }, [pathname, close])

  const handleSignOut = async () => {
    invalidateWorkspace()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-alpha-10 bg-white lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col">
        <SidebarContent
          pathname={pathname}
          userEmail={userEmail}
          userInitials={userInitials}
          workspace={workspace}
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
                className="absolute right-3 top-4 rounded-[8px] p-1.5 text-alpha-60 transition-colors hover:bg-alpha-5"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
              <SidebarContent
                pathname={pathname}
                userEmail={userEmail}
                userInitials={userInitials}
                workspace={workspace}
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
