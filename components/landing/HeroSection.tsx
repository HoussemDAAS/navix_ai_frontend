"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const logos = [
  { src: "/assets/landing/linkedin.png", alt: "LinkedIn" },
  { src: "/assets/landing/facebook.png", alt: "Facebook" },
  { src: "/assets/landing/instagram.png", alt: "Instagram" },
  { src: "/assets/landing/X.png", alt: "X" },
  { src: "/assets/landing/Company logo.png", alt: "Notion" },
]

export function HeroSection({ className }: { className?: string }) {
  return (
    <section className={cn("w-full", className)}>
      {/* Hero */}
      <div className="mx-auto flex max-w-[1340px] flex-col gap-8 px-5 pt-10 sm:px-6 md:flex-row md:items-center md:justify-between md:px-12 md:pt-16 lg:px-16 lg:pt-14">
        {/* Left Text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex max-w-[531px] flex-col gap-9 shrink-0"
        >
          <h1 className="text-h2 font-semibold text-primary-900 md:text-h2">
            Analyze
            <br />
            competitors.
            <br />
            Create with your
            <br />
            <span className="text-secondary-500">vision</span>.
          </h1>

          <p className="max-w-[498px] text-subheadline font-normal text-primary-900">
            Navix is a market and competitor intelligence copilot for social media. We find your real competitors, summarize what is working in your niche, and help you co-create fast, guided, and brand-consistent content.
          </p>

          <Link
            href="/signup"
            className="group inline-flex w-fit items-center gap-2 rounded-[12px] bg-primary-btn px-5 py-3.5 text-subheadline font-medium text-white shadow-card transition-all duration-200 hover:bg-primary-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Try Navix Free
            <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Right Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center md:justify-end"
        >
          <img
            src="/assets/landing/Hero_Illustration.png"
            alt="Navix hero illustration"
            className="h-auto w-[340px] sm:w-[380px] md:w-[400px] lg:w-[500px]"
          />
        </motion.div>
      </div>

      {/* Spacing between hero and logos */}
      <div className="h-10 md:h-14" />

      {/* Logotypes bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative mx-auto max-w-[1340px] pb-10 md:pb-14"
      >
        {/* Desktop: static row */}
        <div className="hidden items-center justify-between px-5 sm:px-6 md:flex md:px-12 lg:px-16">
          {logos.map((logo) => (
            <div key={logo.alt} className="flex h-12 w-[150px] shrink-0 items-center justify-center">
              <img
                src={logo.src}
                alt={logo.alt}
                className="max-h-full max-w-full object-contain opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
              />
            </div>
          ))}
        </div>

        {/* Mobile: infinite marquee */}
        <div className="relative overflow-hidden md:hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />
          <motion.div
            className="flex w-max items-center gap-14"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
          >
            {[...logos, ...logos].map((logo, i) => (
              <div key={`${logo.alt}-${i}`} className="flex h-10 w-[120px] shrink-0 items-center justify-center">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-full max-w-full object-contain opacity-60 grayscale"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
