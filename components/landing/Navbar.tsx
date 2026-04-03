"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "About us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
]

export function Navbar({ className }: { className?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className={cn("w-full bg-white", className)}>
      <nav className="mx-auto flex max-w-[1340px] items-center justify-between pl-3 pr-3 py-3 sm:px-6 sm:py-4 md:px-12 lg:px-16">
        <Link href="/" className="shrink-0">
          <img src="/logo_navix.svg" alt="Navix" className="h-5 w-auto sm:h-8" />
        </Link>

        <div className="hidden items-center gap-10 font-heading text-xl font-normal leading-7 text-primary-900 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-alpha-60"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/signup"
          className="hidden items-center justify-center rounded-[12px] bg-primary-btn px-4 py-3 text-body-2 font-medium text-white shadow-card transition-all duration-200 hover:bg-primary-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] md:inline-flex"
        >
          Sign Up
        </Link>

        <button
          className="text-primary-900 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="flex flex-col gap-5 border-t border-alpha-10 bg-white px-4 py-5 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-heading text-lg font-normal text-primary-900"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/signup"
            className="flex w-full items-center justify-center rounded-[12px] bg-primary-btn px-4 py-3 text-body-2 font-medium text-white shadow-card"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  )
}
