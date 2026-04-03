import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  [
    "inline-flex items-center justify-center transition-all",
    "focus-visible:outline-none focus-visible:shadow-[0px_0px_0px_3px] focus-visible:shadow-ring",
    "disabled:pointer-events-none",
    "[&_svg]:size-5 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-primary-btn text-white shadow-sm",
          "hover:bg-primary-700",
          "disabled:bg-alpha-5 disabled:text-alpha-30 disabled:shadow-none",
        ].join(" "),
        secondary: [
          "bg-white border border-alpha-10 text-primary-900 shadow-sm",
          "hover:bg-primary-50",
          "disabled:bg-alpha-5 disabled:text-alpha-30 disabled:border-transparent disabled:shadow-none",
        ].join(" "),
        tertiary: [
          "bg-alpha-5 text-primary-900",
          "hover:bg-alpha-10",
          "disabled:bg-alpha-5 disabled:text-alpha-30",
        ].join(" "),
        quaternary: [
          "bg-transparent text-primary-900",
          "hover:bg-alpha-5",
          "disabled:bg-alpha-5 disabled:text-alpha-30",
        ].join(" "),
        destructive: [
          "bg-destructive-500 text-white shadow-sm",
          "hover:bg-destructive-600",
          "disabled:bg-alpha-5 disabled:text-alpha-30 disabled:shadow-none",
        ].join(" "),
      },
      size: {
        sm: "p-1.5 rounded-[20px]",
        md: "p-2.5 rounded-[20px]",
        lg: "p-3.5 rounded-[24px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant, size, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(iconButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }
export type { IconButtonProps }
