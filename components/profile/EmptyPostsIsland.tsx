'use client'

import { motion } from 'framer-motion'
import { ImageOff } from 'lucide-react'

interface EmptyPostsIslandProps {
  title: string
  message: string
  /** Optional CTA (e.g. the lime "Track this account" button) */
  action?: React.ReactNode
}

/** Shown when an account has been found but its content has not been scraped. */
export function EmptyPostsIsland({ title, message, action }: EmptyPostsIslandProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className="rounded-[20px] border border-alpha-10 bg-white px-6 py-10 text-center shadow-card"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-alpha-5 border border-alpha-10">
        <ImageOff className="size-6 text-alpha-40" />
      </div>
      <h2 className="text-h6 font-bold text-primary-900 mb-2">{title}</h2>
      <p className="mx-auto mb-6 max-w-[460px] text-body-2 text-alpha-60">{message}</p>
      {action}
    </motion.section>
  )
}
