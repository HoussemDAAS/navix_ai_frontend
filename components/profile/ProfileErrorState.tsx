'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

interface ProfileErrorStateProps {
  title: string
  message: string
  onRetry: () => void
  retrying?: boolean
}

export function ProfileErrorState({ title, message, onRetry, retrying = false }: ProfileErrorStateProps) {
  return (
    <div className="rounded-[20px] border border-destructive-200 bg-destructive-50 px-6 py-10 text-center">
      <AlertCircle className="mx-auto mb-4 size-9 text-destructive-500" />
      <h2 className="text-h6 font-bold text-primary-900 mb-2">{title}</h2>
      <p className="mx-auto mb-6 max-w-[420px] text-body-2 text-alpha-60">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-2 rounded-[12px] border border-alpha-10 bg-white px-5 py-3 text-body-2 font-medium text-primary-900 shadow-sm transition-all hover:border-primary-900 disabled:opacity-50 disabled:pointer-events-none"
      >
        <RefreshCw className={retrying ? 'size-4 animate-spin' : 'size-4'} />
        Try again
      </button>
    </div>
  )
}
