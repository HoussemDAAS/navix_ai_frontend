'use client'

import { useState } from 'react'
import { X, Plus, Link2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { addCompetitor } from '@/lib/api'
import { parseSocialLink, isShareLink, PLATFORM_LABEL } from '@/lib/social-links'

interface AddCompetitorModalProps {
  projectId: string
  open: boolean
  onClose: () => void
  onAdded: () => void
}

export function AddCompetitorModal({ projectId, open, onClose, onAdded }: AddCompetitorModalProps) {
  const [link, setLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = link.trim().length > 3 ? parseSocialLink(link.trim()) : null
  const share = link.trim().length > 3 && isShareLink(link.trim())

  const submit = async () => {
    if (!link.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await addCompetitor(projectId, link.trim())
      setLink('')
      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this account.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary-900/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-[20px] bg-white border border-alpha-10 shadow-card p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-subheadline font-bold text-primary-900">Add a competitor</h3>
                <p className="text-caption-1 text-alpha-60 mt-0.5">
                  Paste their Instagram or TikTok profile link — we read the account, scrape their
                  content and find similar accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 shrink-0 rounded-[8px] hover:bg-alpha-5 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="size-4 text-alpha-60" />
              </button>
            </div>

            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-alpha-30" />
              <input
                type="text"
                value={link}
                onChange={(e) => { setLink(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
                placeholder="https://www.instagram.com/… or @handle"
                autoFocus
                className="w-full rounded-[12px] border border-alpha-10 bg-alpha-5/50 pl-10 pr-4 py-3 text-body-2 text-primary-900 placeholder:text-alpha-30 focus:border-secondary-400 focus:bg-white focus:ring-1 focus:ring-secondary-400 outline-none transition-all"
              />
            </div>

            <div className="mt-2 min-h-5">
              {share && (
                <p className="text-caption-2 text-warning-600">
                  That looks like a share link — open it and paste the profile URL instead.
                </p>
              )}
              {parsed && !share && (
                <p className="text-caption-2 text-success-600">
                  {PLATFORM_LABEL[parsed.platform]} · @{parsed.handle}
                </p>
              )}
              {error && <p className="text-caption-2 text-destructive-500">{error}</p>}
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={!link.trim() || saving}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-[12px] px-5 py-3 text-body-2 font-semibold bg-secondary-300 text-primary-900 border border-primary-900 shadow-signature hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
            >
              <Plus className="size-4" />
              {saving ? 'Reading the account…' : 'Add competitor'}
            </button>
            {saving && (
              <p className="mt-2 text-center text-caption-2 text-alpha-50">
                Reading their real profile — takes ~20 seconds.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
