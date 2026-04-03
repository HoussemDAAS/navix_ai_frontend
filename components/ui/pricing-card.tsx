import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingCardProps {
  plan: string
  price: number
  period?: string
  description?: string
  features: string[]
  featureSubLabels?: string[]
  popular?: boolean
  highlighted?: boolean
  buttonLabel?: string
  onSelect?: () => void
  className?: string
}

export function PricingCard({
  plan,
  price,
  period = "/month",
  description,
  features,
  featureSubLabels,
  popular = false,
  highlighted = false,
  buttonLabel = "Get started",
  onSelect,
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-6 rounded-[24px] border p-6 w-full",
        "shadow-card",
        highlighted
          ? "border-alpha-white-10 bg-gradient-pricing-highlighted text-white"
          : "border-alpha-10 bg-gradient-pricing",
        className
      )}
    >
      {popular && (
        <div
          className={cn(
            "absolute top-6 right-6 flex items-center h-6 px-2 rounded-[20px]",
            highlighted ? "bg-accent text-accent-foreground" : "bg-white text-primary-900"
          )}
        >
          <span className="text-caption-1 font-medium whitespace-nowrap">Most popular</span>
        </div>
      )}

      <div className="flex flex-col gap-2 w-full">
        <p className={cn("text-h6 font-semibold", highlighted ? "text-white" : "text-primary-900")}>
          {plan}
        </p>
        {description && (
          <p className={cn("text-body-2 font-normal", highlighted ? "text-alpha-white-60" : "text-alpha-60")}>
            {description}
          </p>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 w-full">
        <span className={cn("text-h3 font-semibold", highlighted ? "text-white" : "text-primary-900")}>
          ${price}
        </span>
        <span className={cn("text-body-2 font-normal", highlighted ? "text-alpha-white-60" : "text-alpha-60")}>
          {period}
        </span>
      </div>

      <hr className={cn("w-full border-t", highlighted ? "border-alpha-white-10" : "border-alpha-10")} />

      <ul className="flex flex-col gap-4 w-full">
        {features.map((feature, i) => (
          <li key={feature} className="flex items-center gap-3">
            <Check
              size={24}
              className={cn("shrink-0", highlighted ? "text-accent" : "text-primary-900")}
            />
            <div className="flex flex-col gap-0.5">
              <span className={cn("text-body-2 font-medium", highlighted ? "text-white" : "text-primary-900")}>
                {feature}
              </span>
              {featureSubLabels?.[i] && (
                <span className={cn("text-caption-1 font-normal", highlighted ? "text-alpha-white-60" : "text-alpha-60")}>
                  {featureSubLabels[i]}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <hr className={cn("w-full border-t", highlighted ? "border-alpha-white-10" : "border-alpha-10")} />

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full flex items-center justify-center px-4 py-3 rounded-[12px] text-body-2 font-medium transition-opacity shadow-card",
          "hover:opacity-90 active:opacity-80",
          highlighted ? "bg-accent text-accent-foreground" : "bg-primary-900 text-white"
        )}
      >
        {buttonLabel}
      </button>
    </div>
  )
}
