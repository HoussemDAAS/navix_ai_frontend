'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoUploaderProps {
  /** Data URL of the current preview, or null when none */
  value: string | null
  onChange: (dataUrl: string | null) => void
  /** Visible label above the dropzone */
  label?: string
  className?: string
}

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

/**
 * Square logo dropzone that produces a base64 data URL preview.
 *
 * Real upload to object storage is handled later. We keep the data URL in
 * the onboarding draft and swap it for a real public URL once the user lands
 * in the dashboard.
 */
export function LogoUploader({
  value,
  onChange,
  label = 'Brand logo',
  className,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function handleFile(file: File) {
    setErr(null)
    if (!file.type.startsWith('image/')) {
      setErr('Please upload an image file (PNG, JPG, SVG, WebP).')
      return
    }
    if (file.size > MAX_BYTES) {
      setErr('File is too large. Please pick something under 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.onerror = () => setErr('Could not read that file. Try another one.')
    reader.readAsDataURL(file)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = '' // allow re-selecting the same file later
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-caption-1 font-semibold text-primary-900">
        {label}
        <span className="ml-1 text-caption-2 font-normal text-alpha-40">Optional</span>
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex items-center gap-4 rounded-[16px] border-2 border-dashed p-3 sm:p-4 transition-colors',
          dragOver
            ? 'border-secondary-400 bg-secondary-50'
            : 'border-alpha-10 bg-alpha-5/30 hover:border-alpha-20',
        )}
      >
        {/* Preview tile */}
        <div className="relative shrink-0">
          <div
            className={cn(
              'h-20 w-20 rounded-[14px] overflow-hidden border border-alpha-10 bg-white flex items-center justify-center',
            )}
          >
            {value ? (
              <motion.img
                key={value}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={value}
                alt="Logo preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlus className="size-7 text-alpha-30" />
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              aria-label="Remove logo"
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-white border border-alpha-10 shadow-card flex items-center justify-center hover:bg-destructive-50 hover:border-destructive-200 transition-colors"
            >
              <X className="size-3 text-alpha-60" />
            </button>
          )}
        </div>

        {/* Copy + action */}
        <div className="flex-1 min-w-0">
          <p className="text-body-2 font-semibold text-primary-900 mb-0.5">
            {value ? 'Replace your logo' : 'Drag in your logo'}
          </p>
          <p className="text-caption-1 text-alpha-60 mb-2">
            PNG, JPG, SVG, or WebP. Up to 2 MB
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-caption-1 font-semibold text-primary-900 underline-offset-4 hover:underline"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleInput}
            className="hidden"
          />
        </div>
      </div>

      {err && (
        <p className="text-caption-2 font-medium text-destructive-500">{err}</p>
      )}
    </div>
  )
}
