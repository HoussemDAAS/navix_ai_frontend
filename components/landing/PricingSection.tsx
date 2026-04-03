"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Feature {
  text: string
  included: boolean
}

interface Plan {
  name: string
  badge: string
  price: string
  period: string
  features: Feature[]
  cta: string
  ctaHref: string
  highlighted: boolean
}

const plans: Plan[] = [
  {
    name: "Starter",
    badge: "Free",
    price: "$0",
    period: "/month",
    features: [
      { text: "3 Social Profiles", included: true },
      { text: "10 AI Generations / mo", included: true },
      { text: "Competitor Tracking", included: false },
    ],
    cta: "Start For Free",
    ctaHref: "/signup",
    highlighted: false,
  },
  {
    name: "Professional",
    badge: "Most popular",
    price: "$48",
    period: "/month",
    features: [
      { text: "Unlimited Social Profiles", included: true },
      { text: "500 AI Generations / mo", included: true },
      { text: "Full Competitor insights", included: true },
      { text: "Priority Support", included: true },
    ],
    cta: "Get Pro Now",
    ctaHref: "/signup",
    highlighted: true,
  },
  {
    name: "Agency",
    badge: "Most popular",
    price: "$199",
    period: "/month",
    features: [
      { text: "Custom Team Access", included: true },
      { text: "Unlimited AI Generations", included: true },
      { text: "White label Reports", included: true },
    ],
    cta: "Talk to Sales",
    ctaHref: "/signup",
    highlighted: false,
  },
]

export function PricingSection({ className }: { className?: string }) {
  return (
    <section className={cn("w-full", className)} id="pricing">
      <div className="mx-auto max-w-[1340px] px-5 py-10 sm:px-6 md:px-12 md:py-16 lg:px-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-h3 font-bold text-primary-900"
        >
          Simple <span className="text-secondary-400">Pricing</span>
        </motion.h2>

        <div className="mt-12 flex flex-col items-start gap-6 md:mt-12 md:flex-row md:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={`${plan.name}-${plan.price}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "flex w-full flex-col gap-6 rounded-[24px] border p-6 md:w-1/3",
                plan.highlighted
                  ? "border-alpha-10 bg-gradient-pricing shadow-card"
                  : "border-alpha-10 bg-white shadow-card"
              )}
            >
              {/* Header */}
              <div className="flex flex-col gap-12">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-h6 font-semibold text-primary-900">{plan.name}</span>
                    <span className={cn(
                      "flex h-6 items-center rounded-[20px] px-2 text-caption-1 font-medium",
                      plan.highlighted
                        ? "bg-white text-primary-900"
                        : "bg-alpha-5 text-primary-900"
                    )}>
                      {plan.badge}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-h3 font-semibold text-primary-900">{plan.price}</span>
                  <span className="text-body-2 font-normal text-alpha-60">{plan.period}</span>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-t border-alpha-10" />

              {/* Features */}
              <div className="flex flex-col gap-4">
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-3">
                    {f.included ? (
                      <Check className="size-6 shrink-0 text-primary-900" />
                    ) : (
                      <X className="size-6 shrink-0 text-alpha-30" />
                    )}
                    <span className={cn(
                      "text-body-2 font-medium",
                      f.included ? "text-primary-900" : "text-alpha-40"
                    )}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <hr className="border-t border-alpha-10" />

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={cn(
                  "flex w-full items-center justify-center rounded-[12px] px-4 py-3 text-body-2 font-medium shadow-card transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
                  plan.highlighted
                    ? "bg-primary-900 text-white hover:bg-primary-700"
                    : "border border-alpha-10 bg-white text-primary-900 hover:bg-alpha-5"
                )}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
