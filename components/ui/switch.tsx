"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  size?: "sm" | "md"
}

const trackSizes = {
  sm: "w-[36px] h-[20px]",
  md: "w-[44px] h-[24px]",
}

const thumbSizes = {
  sm: "size-4 data-[state=checked]:translate-x-4",
  md: "size-5 data-[state=checked]:translate-x-5",
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ size = "md", className, disabled, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    disabled={disabled}
    className={cn(
      "relative inline-flex items-center shrink-0 rounded-full px-0.5 transition-colors",
      "bg-alpha-5",
      "data-[state=checked]:bg-success-500",
      "focus-visible:outline-none focus-visible:shadow-[0px_0px_0px_3px] focus-visible:shadow-ring",
      disabled && "cursor-not-allowed",
      trackSizes[size],
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "block rounded-full bg-white transition-transform duration-150 ease-in-out shadow-sm",
        "data-[state=unchecked]:translate-x-0",
        thumbSizes[size]
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = "Switch"

interface SwitchWithLabelProps extends SwitchProps {
  label: string
  labelPosition?: "left" | "right"
  id?: string
}

function SwitchWithLabel({
  label,
  labelPosition = "right",
  size = "md",
  id,
  className,
  ...props
}: SwitchWithLabelProps) {
  const innerId = id ?? React.useId()
  const labelEl = (
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
  )
  return (
    <div className={cn("flex items-center", size === "sm" ? "gap-2" : "gap-3", className)}>
      {labelPosition === "left" && labelEl}
      <Switch id={innerId} size={size} {...props} />
      {labelPosition === "right" && labelEl}
    </div>
  )
}

export { Switch, SwitchWithLabel }
