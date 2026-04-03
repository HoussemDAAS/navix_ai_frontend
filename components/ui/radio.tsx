"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
))
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  size?: "sm" | "md"
}

const sizeClasses = {
  sm: "size-5",
  md: "size-6",
}

const dotSizes = {
  sm: "size-[6.667px]",
  md: "size-2",
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ size = "md", className, disabled, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    disabled={disabled}
    className={cn(
      "relative flex items-center justify-center shrink-0 rounded-full transition-colors",
      "border border-alpha-10 bg-white",
      "focus-visible:outline-none focus-visible:shadow-[0px_0px_0px_3px] focus-visible:shadow-ring",
      "data-[state=checked]:bg-info-500 data-[state=checked]:border-transparent",
      disabled && "cursor-not-allowed bg-primary-50",
      sizeClasses[size],
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className={cn("rounded-full bg-white block", dotSizes[size])} />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
))
RadioGroupItem.displayName = "RadioGroupItem"

interface RadioGroupItemWithLabelProps extends RadioGroupItemProps {
  label: string
  id?: string
}

function RadioGroupItemWithLabel({
  label,
  size = "md",
  id,
  className,
  ...props
}: RadioGroupItemWithLabelProps) {
  const innerId = id ?? React.useId()
  return (
    <div className={cn("flex items-center", size === "sm" ? "gap-2" : "gap-3", className)}>
      <RadioGroupItem id={innerId} size={size} {...props} />
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

export { RadioGroup, RadioGroupItem, RadioGroupItemWithLabel }
