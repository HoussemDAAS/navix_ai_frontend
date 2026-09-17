'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, ChevronDown, CalendarDays, Table } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CalendarItem } from '@/lib/api'
import { buildIcs, buildCsv, downloadFile } from '@/lib/calendar-export'

interface ExportMenuProps {
  items: CalendarItem[]
}

export function ExportMenu({ items }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const disabled = items.length === 0

  const exportIcs = () => {
    downloadFile('navix-calendar.ics', buildIcs(items), 'text/calendar;charset=utf-8')
    setOpen(false)
  }
  const exportCsv = () => {
    downloadFile('navix-calendar.csv', buildCsv(items), 'text/csv;charset=utf-8')
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title={disabled ? 'Schedule at least one post to export' : 'Export your calendar'}
        className={cn(
          'inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-caption-1 font-medium border transition-colors',
          disabled
            ? 'text-alpha-30 border-alpha-10 cursor-not-allowed'
            : 'text-primary-900 bg-white border-alpha-10 hover:border-primary-900 hover:bg-alpha-5',
        )}
      >
        <Download className="size-4" />
        Export
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-20 w-56 rounded-[12px] border border-alpha-10 bg-white shadow-card p-1.5"
          >
            <button
              type="button"
              onClick={exportIcs}
              className="w-full flex items-start gap-2.5 rounded-[8px] px-2.5 py-2 text-left hover:bg-alpha-5 transition-colors"
            >
              <CalendarDays className="size-4 text-primary-900 mt-0.5 shrink-0" />
              <span>
                <span className="block text-caption-1 font-medium text-primary-900">Calendar file (.ics)</span>
                <span className="block text-caption-2 text-alpha-50">Google Calendar, Outlook, Apple</span>
              </span>
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="w-full flex items-start gap-2.5 rounded-[8px] px-2.5 py-2 text-left hover:bg-alpha-5 transition-colors"
            >
              <Table className="size-4 text-primary-900 mt-0.5 shrink-0" />
              <span>
                <span className="block text-caption-1 font-medium text-primary-900">Spreadsheet (.csv)</span>
                <span className="block text-caption-2 text-alpha-50">Excel, Google Sheets, Notion</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
