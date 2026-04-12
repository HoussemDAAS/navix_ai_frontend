"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const floatingItems = [
  { src: "/assets/landing/CTA/Item.svg", className: "top-[12%] left-[19%] size-16" },
  { src: "/assets/landing/CTA/Item-1.svg", className: "top-[16%] right-[22%] size-16" },
  { src: "/assets/landing/CTA/Item-3.svg", className: "bottom-0 right-[17%] size-12" },
  { src: "/assets/landing/CTA/Item-4.svg", className: "top-[46%] right-0 size-12" },
  { src: "/assets/landing/CTA/Item-6.svg", className: "top-[4%] left-[3%] size-10" },
  { src: "/assets/landing/CTA/Item-7.svg", className: "bottom-[10%] left-[6%] size-14" },
  { src: "/assets/landing/CTA/Item-9.svg", className: "bottom-[33%] left-[24%] size-9" },
  { src: "/assets/landing/CTA/Item-10.svg", className: "top-[30%] right-[1%] size-9" },
  { src: "/assets/landing/CTA/Item-11.svg", className: "bottom-[24%] left-[14%] size-20" },
  { src: "/assets/landing/CTA/Item-12.svg", className: "top-[39%] right-[14%] size-20" },
]

const emojis = [
  { emoji: "👍", className: "top-[14%] left-[11%] text-[22px]" },
  { emoji: "😀", className: "top-[55%] left-[7%] text-[36px]" },
  { emoji: "😍", className: "bottom-[12%] right-[5%] text-[38px]" },
  { emoji: "🤟", className: "bottom-[8%] left-[23%] text-[18px]" },
  { emoji: "🤪", className: "top-[42%] right-[27%] text-[24px]" },
  { emoji: "🙄", className: "top-[6%] right-[13%] text-[28px]" },
]

export function CTABanner({ className }: { className?: string }) {
  return (
    <section className={cn("relative w-full overflow-hidden", className)}>
      <div className="relative mx-auto min-h-[400px] max-w-[1340px] px-5 py-20 sm:px-6 md:min-h-[400px] md:px-12 md:py-20 lg:px-16">
        {/* Floating avatars hidden on mobile */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {floatingItems.map((item, i) => (
            <motion.img
              key={item.src}
              src={item.src}
              alt=""
              animate={{ y: [0, i % 2 === 0 ? -8 : 8, 0] }}
              transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              className={cn("absolute", item.className)}
            />
          ))}
          {emojis.map((e) => (
            <motion.span
              key={e.emoji}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className={cn("absolute", e.className)}
            >
              {e.emoji}
            </motion.span>
          ))}
        </div>

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-6 text-center"
        >
          <h2 className="text-h4 font-bold text-primary-900 md:text-h3">
            Grow your brand
            <br />
            presence on social media.
          </h2>

          <p className="text-body-1 font-medium text-alpha-60">
            Try Navix free for 14 days. No credit card required.
          </p>

          <Link
            href="/signup"
            className="group mt-4 inline-flex items-center justify-center rounded-[12px] bg-secondary-300 px-5 py-3.5 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px]"
          >
            Sign Up for Free Trial
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
