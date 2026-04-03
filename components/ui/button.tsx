import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center font-medium transition-all",
    "focus-visible:outline-none focus-visible:shadow-[0px_0px_0px_3px] focus-visible:shadow-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-primary-btn text-white",
          "shadow-card",
          "hover:bg-primary-700",
          "disabled:bg-primary-100 disabled:text-alpha-30 disabled:shadow-none",
        ].join(" "),
        secondary: [
          "bg-alpha-5 text-primary-900",
          "hover:bg-alpha-10",
          "disabled:bg-primary-100 disabled:text-alpha-30",
        ].join(" "),
        tertiary: [
          "border border-alpha-10 bg-transparent text-primary-900",
          "shadow-card",
          "hover:bg-alpha-5",
          "disabled:bg-primary-100 disabled:text-alpha-30 disabled:border-transparent disabled:shadow-none",
        ].join(" "),
        quaternary: [
          "bg-transparent text-primary-900",
          "hover:bg-alpha-5",
          "disabled:text-alpha-30",
        ].join(" "),
        destructive: [
          "bg-destructive-500 text-white",
          "shadow-card",
          "hover:bg-destructive-600",
          "disabled:bg-primary-100 disabled:text-alpha-30 disabled:shadow-none",
        ].join(" "),
      },
      size: {
        sm: "gap-1 px-3 py-1.5 text-caption-1 rounded-[8px] [&_svg]:size-3.5",
        md: "gap-2 px-4 py-2   text-caption-1 rounded-[12px] [&_svg]:size-4",
        lg: "gap-2 px-4 py-3   text-body-2    rounded-[12px] [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }
