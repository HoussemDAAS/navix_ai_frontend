import * as React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label?: string
  helperText?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, helperText, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="text-body-2 font-medium text-primary-900">
          {label}
        </label>
      )}
      {children}
      {(error || helperText) && (
        <p className={cn(
          "text-caption-1 font-normal",
          error ? "text-destructive-500" : "text-alpha-60"
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}
