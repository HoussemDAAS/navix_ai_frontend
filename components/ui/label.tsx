import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    error?: boolean
  }
>(({ className, error, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-5 tracking-[-0.14px]",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
      error ? "text-destructive" : "text-muted-foreground",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
