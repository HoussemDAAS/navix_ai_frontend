"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  size?: "sm" | "md"
}

const sizeClasses = {
  sm: "size-5 rounded-[4px]",
  md: "size-6 rounded-[4px]",
}

const iconSizes = {
  sm: "size-2.5",
  md: "size-3",
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ size = "md", className, disabled, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    disabled={disabled}
    className={cn(
      "relative flex items-center justify-center shrink-0 transition-colors",
      "border border-alpha-10 bg-white",
      "focus-visible:outline-none focus-visible:shadow-[0px_0px_0px_3px] focus-visible:shadow-ring",
      "data-[state=checked]:bg-info-500 data-[state=checked]:border-transparent",
      "data-[state=indeterminate]:bg-info-500 data-[state=indeterminate]:border-transparent",
      disabled && "cursor-not-allowed bg-primary-50",
      sizeClasses[size],
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
      <Check className={iconSizes[size]} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = "Checkbox"

interface CheckboxWithLabelProps extends CheckboxProps {
  label: string
  id?: string
}

function CheckboxWithLabel({
  label,
  size = "md",
  id,
  className,
  ...props
}: CheckboxWithLabelProps) {
  const innerId = id ?? React.useId()
  return (
    <div className={cn("flex items-center", size === "sm" ? "gap-2" : "gap-3", className)}>
      <Checkbox id={innerId} size={size} {...props} />
      <label
        htmlFor={innerId}
        className={cn(
          "font-medium select-none",
          size === "sm" ? "text-caption-1" : "text-body-2",
          props.disabled ? "text-alpha-30 cursor-not-allowed" : "text-primary-900"
        )}
      >
        {label}
      </label>
    </div>
  )
}

export { Checkbox, CheckboxWithLabel }
