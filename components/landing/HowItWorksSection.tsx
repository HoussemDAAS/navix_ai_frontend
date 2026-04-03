"use client"

import { ArrowUpRight, Users, BarChart3, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Step {
  number: string
  title: string
  description: string
  icon: React.ElementType
  bg: "lime" | "dark"
}

const steps: Step[] = [
  {
    number: "01",
    title: "Map Your Niche",
    description: "Define your brand kit and let AI instantly map 10–30 relevant competitor accounts fighting for your exact audience.",
    icon: Users,
    bg: "lime",
  },
  {
    number: "02",
    title: "Draft Viral Content",
    description: "Deep dive to find winning market hooks and generate high converting drafts co created.",
    icon: BarChart3,
    bg: "dark",
  },
  {
    number: "03",
    title: "Refine & Schedule",
    description: "Tweak draft results via a feedback loop. Train your AI agent to perfect your voice and schedule posts to your calendar.",
    icon: Sparkles,
    bg: "lime",
  },
]

const cardStyles = {
  lime: {
    card: "bg-secondary-200 border-primary-900",
    number: "text-black/15",
    title: "text-primary-btn",
    desc: "text-primary-btn",
    iconBg: "bg-primary-btn",
    iconColor: "text-secondary-400",
    arrowBg: "bg-primary-900 text-white",
    link: "text-primary-900",
  },
  dark: {
    card: "bg-primary-btn border-primary-900",
    number: "text-white/15",
    title: "text-white",
    desc: "text-white",
    iconBg: "bg-secondary-400",
    iconColor: "text-primary-btn",
    arrowBg: "bg-white text-primary-900",
    link: "text-white",
  },
}

export function HowItWorksSection({ className }: { className?: string }) {
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
          How It <span className="text-secondary-400">Works</span> !
        </motion.h2>

        {/* Cards */}
        <div className="mt-12 flex flex-col gap-6 md:mt-12 md:flex-row md:gap-7">
          {steps.map((step, i) => {
            const s = cardStyles[step.bg]
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className={cn(
                  "relative flex flex-col justify-between overflow-hidden rounded-[32px] border p-8 shadow-[0px_5px_0px_0px_#191a23] transition-shadow duration-200 hover:shadow-[0px_8px_0px_0px_#191a23] sm:p-10 md:rounded-[45px]",
                  "w-full md:w-1/3 md:min-h-[400px]",
                  s.card
                )}
              >
                {/* Icon circle */}
                <div className={cn("flex size-[42px] items-center justify-center rounded-full", s.iconBg)}>
                  <step.icon className={cn("size-5", s.iconColor)} />
                </div>

                {/* Big number watermark */}
                <span className={cn("absolute right-6 top-6 text-[128px] font-extrabold leading-none tracking-tight select-none md:right-8 md:top-8", s.number)}>
                  {step.number}
                </span>

                {/* Text */}
                <div className="mt-10 flex flex-col gap-3">
                  <h3 className={cn("text-h5 font-bold", s.title)}>{step.title}</h3>
                  <p className={cn("text-body-1 font-medium text-justify", s.desc)}>{step.description}</p>
                </div>

                {/* Learn more */}
                <div className="group/link mt-10 flex cursor-pointer items-center gap-4">
                  <div className={cn("flex size-10 items-center justify-center rounded-full transition-all duration-300 group-hover/link:scale-110 group-hover/link:shadow-lg", s.arrowBg)}>
                    <ArrowUpRight className="size-5 transition-transform duration-300 group-hover/link:rotate-45" />
                  </div>
                  <span className={cn("text-subheadline font-medium", s.link)}>Learn more</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
