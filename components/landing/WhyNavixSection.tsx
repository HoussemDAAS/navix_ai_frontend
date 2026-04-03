"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const stats = [
  { value: "10–30", label: "Competitors mapped per project" },
  { value: "< 3 min", label: "Time to first competitive insight" },
  { value: "2–4 weeks", label: "Editorial calendar generated" },
]

export function WhyNavixSection({ className }: { className?: string }) {
  return (
    <section className={cn("w-full", className)}>
      <div className="mx-auto max-w-[1340px] px-5 py-10 sm:px-6 md:px-12 md:py-16 lg:px-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:justify-between">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center gap-2 text-center md:items-start md:text-left"
            >
              <span className="font-heading text-h3 font-bold text-primary-btn md:text-h2">{stat.value}</span>
              <span className="text-body-1 font-medium text-alpha-60">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
