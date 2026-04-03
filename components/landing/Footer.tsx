import Link from "next/link"
import { cn } from "@/lib/utils"
import { Linkedin, Facebook, Twitter } from "lucide-react"

const navLinks = [
  { label: "About us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
]

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("w-full bg-dark", className)}>
      <div className="mx-auto max-w-[1340px] px-6 pb-12 pt-14 sm:px-8 md:px-16 md:pb-12 md:pt-14 lg:px-12">
        {/* Top row Nav + Social */}
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-10 font-heading text-[18px] text-white">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="underline underline-offset-4 transition-colors hover:text-green">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <Link href="#" className="text-white transition-colors hover:text-green"><Linkedin className="size-7" /></Link>
            <Link href="#" className="text-white transition-colors hover:text-green"><Facebook className="size-7" /></Link>
            <Link href="#" className="text-white transition-colors hover:text-green"><Twitter className="size-7" /></Link>
          </div>
        </div>

        {/* Middle Contact + Subscribe */}
        <div className="mt-16 flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Contact */}
          <div className="flex flex-col gap-7">
            <span className="inline-block w-fit rounded-[7px] bg-green px-2 font-heading text-[20px] font-medium text-dark">
              Contact us:
            </span>
            <div className="flex flex-col gap-5 font-heading text-[18px] text-white">
              <p>Email: info@navix.com</p>
              <p>Address: San Francisco, CA</p>
            </div>
          </div>

          {/* Subscribe */}
          <div className="flex flex-col gap-4 rounded-[14px] bg-dark-card px-8 py-10 sm:flex-row sm:items-center sm:gap-5 md:px-10 md:py-14">
            <div className="flex w-full items-center rounded-[14px] border border-white px-8 py-5 sm:w-[285px]">
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-transparent font-heading text-[18px] text-white placeholder:text-white outline-none"
              />
            </div>
            <button className="rounded-[14px] bg-green px-8 py-5 font-heading text-[20px] font-normal text-dark transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]">
              Subscribe to news
            </button>
          </div>
        </div>

        {/* Divider */}
        <hr className="mt-12 border-t border-alpha-white-20" />

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center gap-4 font-heading text-[18px] text-white sm:flex-row sm:justify-center sm:gap-10">
          <p>© 2026 Navix. All Rights Reserved.</p>
          <Link href="/privacy" className="underline underline-offset-4 transition-colors hover:text-green">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
