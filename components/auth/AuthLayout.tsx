'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  variant?: 'login' | 'signup'
}

const copy = {
  login: {
    heading: 'Welcome back.',
    accent: 'Your insights await.',
    sub: 'Pick up where you left off — your competitor intelligence is ready.',
  },
  signup: {
    heading: 'Know your competitors.',
    accent: 'Own your niche.',
    sub: 'AI-powered competitor intelligence that helps you create content that actually stands out.',
  },
}

function FloatingCards() {
  return (
    <div className="relative w-full h-[320px] xl:h-[360px]">
      {/* Card 1 — large, lime accent */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-4 top-8 w-[200px] xl:w-[220px] rounded-[20px] border border-alpha-white-10 bg-alpha-white-5 backdrop-blur-sm p-5 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-secondary-300" />
          <div className="h-2 w-20 rounded-full bg-alpha-white-10" />
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[3px]"
              style={{
                height: `${h}%`,
                background: i === 5 ? '#BEF264' : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-1.5 w-12 rounded-full bg-secondary-300/60" />
          <div className="h-1.5 w-8 rounded-full bg-alpha-white-10" />
        </div>
      </motion.div>

      {/* Card 2 — small, top right */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute right-2 top-0 w-[140px] xl:w-[150px] rounded-[16px] border border-alpha-white-10 bg-alpha-white-5 backdrop-blur-sm p-4 shadow-lg"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-2 w-14 rounded-full bg-alpha-white-10" />
          <div className="w-2 h-2 rounded-full bg-secondary-400" />
        </div>
        <div className="flex items-center justify-center h-14">
          {/* Donut chart */}
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle cx="26" cy="26" r="20" fill="none" stroke="#BEF264" strokeWidth="6" strokeDasharray="88 126" strokeLinecap="round" transform="rotate(-90 26 26)" />
          </svg>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-alpha-white-10" />
      </motion.div>

      {/* Card 3 — bottom center, line chart */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[180px] xl:w-[200px] rounded-[16px] border border-alpha-white-10 bg-alpha-white-5 backdrop-blur-sm p-4 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-secondary-300/20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary-300" />
          </div>
          <div className="h-2 w-16 rounded-full bg-alpha-white-10" />
        </div>
        <svg viewBox="0 0 160 40" className="w-full h-10">
          <polyline
            points="0,35 20,30 40,32 60,20 80,22 100,12 120,15 140,5 160,8"
            fill="none"
            stroke="#BEF264"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="0,35 20,30 40,32 60,20 80,22 100,12 120,15 140,5 160,8"
            fill="url(#lineGrad)"
            stroke="none"
          />
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BEF264" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#BEF264" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating dots */}
      <motion.div
        animate={{ y: [0, -12, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-16 top-24 w-1.5 h-1.5 rounded-full bg-secondary-300"
      />
      <motion.div
        animate={{ y: [0, 8, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute left-2 bottom-20 w-1 h-1 rounded-full bg-secondary-400"
      />
    </div>
  )
}

export function AuthLayout({ children, variant = 'login' }: AuthLayoutProps) {
  const c = copy[variant]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left panel — dark navy with floating glass cards */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] shrink-0 bg-primary-btn relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(190,242,100,0.06),transparent_70%)]" />

        <div className="flex flex-col justify-between p-10 xl:p-14 relative z-10 w-full">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img
              src="/logo_navix.svg"
              alt="Navix"
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>

          {/* Floating cards animation */}
          <FloatingCards />

          {/* Marketing copy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3"
          >
            <h1 className="text-h5 xl:text-h4 font-bold text-white leading-tight">
              {c.heading}{' '}
              <span className="text-secondary-300">{c.accent}</span>
            </h1>
            <p className="text-caption-1 font-medium text-alpha-white-50 max-w-sm">
              {c.sub}
            </p>
          </motion.div>
        </div>

        {/* Watermark icon */}
        <img
          src="/logo_navix_ico.svg"
          alt=""
          className="absolute -right-8 -bottom-8 w-[280px] h-auto opacity-[0.03] select-none pointer-events-none brightness-0 invert"
        />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/">
            <img
              src="/logo_navix.svg"
              alt="Navix"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  )
}
