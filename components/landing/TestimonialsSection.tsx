"use client"

import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    quote: "We used to spend 3 hours every Monday doing competitor research. Now Navix does it overnight and we start the week with a full content brief ready to go.",
    name: "Sarah Chen",
    role: "Head of Social, Bloom Agency",
  },
  {
    quote: "The Brand Memory feature is unlike anything else. By week 3 it was writing captions that actually sounded like our client not generic AI copy.",
    name: "Marcus Williams",
    role: "Freelance Social Strategist",
  },
  {
    quote: "We manage 12 e-commerce brands. Navix lets us do competitor analysis for all of them in the time it used to take for one.",
    name: "Priya Nair",
    role: "Director of Content, Elevate Digital",
  },
]

export function TestimonialsSection({ className }: { className?: string }) {
  return (
    <section className={cn("w-full", className)}>
      <div className="overflow-hidden bg-dark py-16 md:py-20">
        {/* Auto-scrolling carousel */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex w-max gap-8"
            animate={{ x: ["0%", "-33.33%"] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          >
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={`${t.name}-${i}`} className="flex w-[540px] shrink-0 flex-col gap-5 px-4 md:w-[606px]">
                {/* Speech bubble */}
                <div className="rounded-[24px] border border-green p-10 md:p-12">
                  <p className="text-body-1 font-normal text-white leading-[26px]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                {/* Author */}
                <div className="pl-16">
                  <p className="font-heading text-[20px] font-medium text-green">{t.name}</p>
                  <p className="font-heading text-[18px] font-normal text-white">{t.role}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="mt-16 flex items-center justify-center gap-16 md:mt-20">
          <button className="text-white transition-colors hover:text-green" aria-label="Previous">
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex items-center gap-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn("size-4", i === 2 ? "fill-green text-green" : "fill-alpha-white-30 text-alpha-white-30")}
              />
            ))}
          </div>
          <button className="text-white transition-colors hover:text-green" aria-label="Next">
            <ChevronRight className="size-6" />
          </button>
        </div>
      </div>
    </section>
  )
}
