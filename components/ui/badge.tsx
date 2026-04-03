import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground",
        secondary:   "bg-secondary text-secondary-foreground",
        success:     "bg-green-100 text-green-700",
        warning:     "bg-yellow-100 text-yellow-700",
        destructive: "bg-red-100 text-destructive",
        outline:     "border border-border text-foreground bg-transparent",
        accent:      "bg-accent text-accent-foreground",
      },
      size: {
        sm: "text-[10px] leading-4 tracking-[-0.1px] px-2 py-0.5",
        md: "text-xs leading-4 tracking-[-0.12px] px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
