'use client'

import Link from 'next/link'
import { FolderPlus, Users, Palette, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface QuickActionCardProps {
  title: string
  description: string
  href: string
  icon: typeof FolderPlus
  variant: 'lime' | 'blue' | 'default'
  index: number
}

const variantStyles = {
  lime: 'bg-secondary-50 border-primary-900 hover:shadow-signature',
  blue: 'bg-info-50 border-alpha-10 hover:border-alpha-20',
  default: 'bg-white border-alpha-10 hover:border-alpha-20',
}

function QuickActionCard({ title, description, href, icon: Icon, variant, index }: QuickActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
    >
      <Link
        href={href}
        className={cn(
          'group flex flex-col justify-between rounded-[28px] sm:rounded-[40px] border p-6 sm:p-8 shadow-card transition-all duration-200 h-full',
          variantStyles[variant]
        )}
      >
        <div>
          <div className={cn(
            'mb-4 flex h-11 w-11 items-center justify-center rounded-[12px]',
            variant === 'lime' && 'bg-secondary-300',
            variant === 'blue' && 'bg-info-100',
            variant === 'default' && 'bg-alpha-5'
          )}>
            <Icon className={cn(
              'size-5',
              variant === 'lime' && 'text-primary-900',
              variant === 'blue' && 'text-info-600',
              variant === 'default' && 'text-alpha-60'
            )} />
          </div>
          <h3 className="text-subheadline font-semibold text-primary-900 mb-1.5">
            {title}
          </h3>
          <p className="text-caption-1 text-alpha-60">
            {description}
          </p>
        </div>
        <div className="mt-5 flex items-center gap-1.5 text-caption-1 font-medium text-primary-900 group-hover:gap-2.5 transition-all duration-200">
          Get started
          <ArrowRight className="size-4" />
        </div>
      </Link>
    </motion.div>
  )
}

const quickActions: Omit<QuickActionCardProps, 'index'>[] = [
  {
    title: 'New Project',
    description: 'Start a new competitive intelligence project for your brand or client.',
    href: '/projects',
    icon: FolderPlus,
    variant: 'lime',
  },
  {
    title: 'View Competitors',
    description: 'Explore discovered competitors and track what works in your niche.',
    href: '/projects',
    icon: Users,
    variant: 'blue',
  },
  {
    title: 'Brand Kit',
    description: 'Define your brand voice, colors, and visual identity for content creation.',
    href: '/projects',
    icon: Palette,
    variant: 'default',
  },
]

export default function DashboardPage() {
  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 sm:mb-10"
      >
        <h1 className="text-h5 sm:text-h4 font-bold text-primary-900">
          Welcome back
        </h1>
        <p className="mt-1.5 text-body-2 text-alpha-60">
          Here&apos;s what&apos;s happening with your projects
        </p>
      </motion.div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {quickActions.map((action, i) => (
          <QuickActionCard key={action.title} {...action} index={i} />
        ))}
      </div>
    </div>
  )
}
