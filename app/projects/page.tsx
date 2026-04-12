'use client'

import Link from 'next/link'
import { FolderOpen, Plus, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { EmptyState } from '@/components/ui/empty-state'

export default function ProjectsPage() {
  return (
    <DashboardShell>
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-h5 sm:text-h4 font-bold text-primary-900">
              Your Projects
            </h1>
            <p className="mt-1.5 text-body-2 text-alpha-60">
              Manage your competitive intelligence projects
            </p>
          </div>
          <Link
            href="/projects"
            className="hidden sm:inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2.5 text-caption-1 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
          >
            <Plus className="size-4" />
            New Project
          </Link>
        </motion.div>

        {/* Empty state */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-[12px] border border-alpha-10 bg-alpha-5/50"
        >
          <EmptyState
            icon={FolderOpen}
            title="Create your first project"
            description="Start by setting up a project to discover competitors and generate content for your brand."
            action={
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-5 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
              >
                <Plus className="size-4" />
                New Project
                <ArrowRight className="size-4" />
              </Link>
            }
          />
        </motion.div>

        {/* Mobile FAB */}
        <Link
          href="/projects"
          className="fixed bottom-6 right-6 sm:hidden flex h-14 w-14 items-center justify-center rounded-full bg-secondary-300 border border-primary-900 shadow-signature text-primary-900"
          aria-label="New project"
        >
          <Plus className="size-6" />
        </Link>
      </div>
    </DashboardShell>
  )
}
