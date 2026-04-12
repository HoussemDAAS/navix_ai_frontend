'use client'

import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[800px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-h5 sm:text-h4 font-bold text-primary-900 mb-1.5">
          Settings
        </h1>
        <p className="text-body-2 text-alpha-60 mb-8">
          Manage your account preferences
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col items-center justify-center rounded-[12px] border border-alpha-10 bg-alpha-5/50 py-16 text-center"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-alpha-5">
          <Settings className="size-6 text-alpha-30" />
        </div>
        <h3 className="text-body-2 font-semibold text-primary-900">
          Coming soon
        </h3>
        <p className="mt-1 max-w-sm text-caption-1 text-alpha-60">
          Profile, notifications, and billing settings will appear here.
        </p>
      </motion.div>
    </div>
  )
}
