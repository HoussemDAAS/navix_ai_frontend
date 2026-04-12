"use client"

import { ShoppingBag, Building2, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Persona {
  icon: React.ElementType
  title: string
  tagline: string
  body: string
  stat: string
  statLabel: string
}

const personas: Persona[] = [
  {
    icon: ShoppingBag,
    title: "E-Commerce Brands",
    tagline: "Outsmart your category",
    body: "Discover what competitor product brands are posting, what formats convert, and get content ideas that match your product category  not generic advice.",
    stat: "3x",
    statLabel: "faster content ideation",
  },
  {
    icon: Building2,
    title: "Marketing Agencies",
    tagline: "Scale without the overhead",
    body: "Run competitor analysis for every client in one place. Get client-ready briefs, content directions, and drafts you can deliver  without starting from scratch each time.",
    stat: "12+",
    statLabel: "brands managed at once",
  },
  {
    icon: Sparkles,
    title: "Content Creators",
    tagline: "Create what actually works",
    body: "Know exactly what's working in your niche before you post. Get AI drafts that match your voice  not a template that sounds like everyone else.",
    stat: "80%",
    statLabel: "less time on research",
  },
]

export function WhoItsForSection({ className }: { className?: string }) {
  return (
    <section className={cn("w-full", className)}>
      <div className="mx-auto max-w-[1340px] px-5 py-10 sm:px-6 md:px-12 md:py-16 lg:px-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-h3 font-bold text-primary-900"
        >
          Built for people who <span className="text-secondary-400">actually post</span>
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 gap-0 md:grid-cols-3">
          {personas.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={cn(
                "group relative flex flex-col gap-6 px-8 py-10 transition-colors duration-200 md:py-12",
                i < personas.length - 1 && "border-b border-alpha-10 md:border-b-0 md:border-r"
              )}
            >
              {/* Hover highlight bar */}
              <div className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-secondary-400 transition-transform duration-300 group-hover:scale-x-100" />

              {/* Icon + title row */}
              <div className="flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-[12px] bg-secondary-200">
                  <p.icon className="size-5 text-primary-btn" />
                </div>
                <span className="text-h6 font-bold text-primary-900">{p.title}</span>
              </div>

              {/* Tagline */}
              <p className="text-subheadline font-semibold italic text-secondary-500">
                &ldquo;{p.tagline}&rdquo;
              </p>

              {/* Body */}
              <p className="text-body-2 font-normal leading-relaxed text-alpha-60">
                {p.body}
              </p>

              {/* Stat */}
              <div className="mt-auto flex items-baseline gap-2 pt-4">
                <span className="font-heading text-h2 font-bold text-primary-btn">{p.stat}</span>
                <span className="text-caption-1 font-medium text-alpha-40">{p.statLabel}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
