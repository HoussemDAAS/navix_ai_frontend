"use client"

import { ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FeatureCard {
  title: string[]
  image: string
  bg: "light" | "lime" | "dark"
}

const rows: [FeatureCard, FeatureCard][] = [
  [
    { title: ["AI Competitor", "Mapping"], image: "/assets/landing/search.png", bg: "light" },
    { title: ["Viral Trend", "Spotting"], image: "/assets/landing/social.png", bg: "lime" },
  ],
  [
    { title: ["AI Content", "Co Creation"], image: "/assets/landing/content.png", bg: "lime" },
    { title: ["Adaptive AI Agent"], image: "/assets/landing/analytics.png", bg: "dark" },
  ],
]

const bgStyles = {
  light: "bg-primary-50 border-primary-900",
  lime: "bg-secondary-300 border-primary-900",
  dark: "bg-primary-btn border-primary-900",
}

const textStyles = {
  light: "text-primary-900",
  lime: "text-primary-900",
  dark: "text-white",
}

const labelStyles = {
  light: "bg-secondary-300",
  lime: "bg-white",
  dark: "bg-secondary-300",
}

const arrowStyles = {
  light: "bg-primary-900 text-white",
  lime: "bg-primary-900 text-white",
  dark: "bg-white text-primary-900",
}

export function FeaturesSection({ className }: { className?: string }) {
  return (
    <section className={cn("w-full", className)}>
      <div className="mx-auto max-w-[1340px] px-5 py-10 sm:px-6 md:px-12 md:py-16 lg:px-16">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-h3 font-bold text-primary-900 md:text-h3"
        >
          Stop wasting hours on manual
          <br />
          <span className="text-secondary-500">social media strategy</span>
        </motion.h2>

        {/* Cards grid */}
        <div className="mt-12 flex flex-col gap-7 md:mt-12">
          {rows.map((row, ri) => (
            <div key={ri} className="flex flex-col gap-6 md:flex-row md:gap-7">
              {row.map((card, ci) => (
                <motion.div
                  key={card.title[0]}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: ci * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between overflow-hidden rounded-[32px] border p-8 shadow-[0px_5px_0px_0px_#191a23] transition-shadow duration-200 hover:shadow-[0px_8px_0px_0px_#191a23] md:rounded-[45px] md:p-10",
                    "w-full md:w-1/2",
                    bgStyles[card.bg]
                  )}
                >
                  {/* Text */}
                  <div className="flex flex-col gap-16 shrink-0">
                    <div className="flex flex-col items-start">
                      {card.title.map((line) => (
                        <span
                          key={line}
                          className={cn(
                            "inline-block rounded-[7px] px-1.5 text-h6 font-medium md:text-h5",
                            labelStyles[card.bg]
                          )}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                    <div className="group/link flex cursor-pointer items-center gap-4">
                      <div className={cn(
                        "flex size-10 items-center justify-center rounded-full transition-all duration-300 group-hover/link:scale-110 group-hover/link:shadow-lg",
                        arrowStyles[card.bg]
                      )}>
                        <ArrowUpRight className="size-5 transition-transform duration-300 group-hover/link:rotate-45" />
                      </div>
                      <span className={cn(
                        "text-subheadline font-medium transition-all duration-200 group-hover/link:tracking-wide",
                        textStyles[card.bg]
                      )}>
                        Learn more
                      </span>
                    </div>
                  </div>

                  {/* Illustration */}
                  <img
                    src={card.image}
                    alt={card.title.join(" ")}
                    className="h-[120px] w-auto object-contain sm:h-[150px] md:h-[170px]"
                  />
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
