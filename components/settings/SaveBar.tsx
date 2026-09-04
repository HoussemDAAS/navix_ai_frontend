'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface SaveBarProps {
  visible: boolean
  saving: boolean
  error: string | null
  onSave: () => void
  onDiscard: () => void
}

/** Sticky action bar. Only mounts while there are unsaved changes. */
export function SaveBar({ visible, saving, error, onSave, onDiscard }: SaveBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          className="sticky bottom-4 z-20 mt-6"
        >
          <div className="flex flex-col gap-3 rounded-[16px] border border-alpha-20 bg-white p-3 shadow-dropdown sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pl-5">
            {error ? (
              <p className="flex items-start gap-1.5 text-caption-1 font-medium text-destructive-500">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            ) : (
              <p className="text-caption-1 text-alpha-60">You have unsaved changes.</p>
            )}

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onDiscard}
                disabled={saving}
                className="rounded-[12px] border border-alpha-10 bg-white px-4 py-2.5 text-caption-1 font-medium text-primary-900 transition-colors hover:bg-alpha-5 hover:border-alpha-20 disabled:pointer-events-none disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-primary-900 bg-secondary-300 px-5 py-2.5 text-caption-1 font-medium text-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
