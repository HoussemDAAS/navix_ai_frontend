import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("flex flex-col", className)} data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ value?: string; onValueChange?: (v: string) => void }>, {
            value,
            onValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
  value?: string
  onValueChange?: (value: string) => void
}

function TabsList({ children, className, value, onValueChange }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-[12px] bg-[rgba(47,43,67,0.05)] p-1",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ activeValue?: string; onSelect?: (v: string) => void }>, {
            activeValue: value,
            onSelect: onValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

interface TabsTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  value: string
  activeValue?: string
  onSelect?: (value: string) => void
}

function TabsTrigger({
  value,
  activeValue,
  onSelect,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const isActive = value === activeValue
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onSelect?.(value)}
      className={cn(
        "inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-[8px] transition-colors",
        isActive
          ? "bg-white text-foreground shadow-[0px_1px_3px_rgba(47,43,67,0.1)]"
          : "text-[rgba(47,43,67,0.6)] hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

function TabsContent({ value, children, className, ...props }: TabsContentProps & { value?: string }) {
  return (
    <div role="tabpanel" className={cn("mt-2", className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
