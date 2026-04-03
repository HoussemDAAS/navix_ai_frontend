import * as React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "md" | "lg"
  error?: boolean
  leadIcon?: React.ReactNode
  tailIcon?: React.ReactNode
  className?: string
}

const sizeStyles = {
  md: "h-[40px] px-3 gap-2",
  lg: "h-[48px] px-4 gap-3",
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size = "md", error = false, leadIcon, tailIcon, disabled = false, className, type = "text", ...props }, ref) => (
    <div
      className={cn(
        "flex items-center w-full rounded-[12px] font-normal transition-shadow",
        sizeStyles[size],
        !error && !disabled && [
          "bg-white",
          "border border-alpha-10",
          "shadow-card",
          "hover:border-alpha-20",
          "focus-within:border-transparent focus-within:shadow-[0px_0px_0px_3px] focus-within:shadow-ring",
        ],
        error && !disabled && [
          "bg-destructive-50",
          "border border-destructive-200",
          "shadow-card",
        ],
        disabled && "bg-alpha-5 border-none shadow-none cursor-not-allowed",
        className
      )}
    >
      {leadIcon && (
        <span className="shrink-0 size-5 flex items-center justify-center text-alpha-30">
          {leadIcon}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "flex-1 min-w-0 bg-transparent outline-none text-body-2 font-normal",
          "placeholder:text-alpha-60",
          error ? "text-destructive-500" : "text-primary-900",
          disabled && "cursor-not-allowed text-alpha-30 placeholder:text-alpha-30"
        )}
        {...props}
      />
      {tailIcon && (
        <span className="shrink-0 size-5 flex items-center justify-center text-alpha-30">
          {tailIcon}
        </span>
      )}
    </div>
  )
)

Input.displayName = "Input"

export { Input }
export type { InputProps }
