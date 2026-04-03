import * as React from "react"
import { cn } from "@/lib/utils"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex h-[120px] w-full rounded-[12px] border bg-white px-4 py-3 text-body-2 font-normal resize-y transition-all",
        "placeholder:text-alpha-60",
        !error && [
          "border-alpha-10",
          "shadow-card",
          "hover:border-alpha-20",
          "focus-visible:outline-none focus-visible:border-transparent focus-visible:shadow-[0px_0px_0px_3px] focus-visible:shadow-ring",
        ],
        error && [
          "border-destructive-200",
          "bg-destructive-50",
          "shadow-card",
          "text-destructive-500",
        ],
        "disabled:bg-alpha-5 disabled:border-none disabled:shadow-none disabled:cursor-not-allowed disabled:text-alpha-30 disabled:placeholder:text-alpha-30",
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

export { Textarea }
