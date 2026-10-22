import { Navbar } from "@/components/landing/Navbar"
import { HeroSection } from "@/components/landing/HeroSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { CTABanner } from "@/components/landing/CTABanner"
import { WhyNavixSection } from "@/components/landing/WhyNavixSection"
import { WhoItsForSection } from "@/components/landing/WhoItsForSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
// Pricing is hidden until the plans are final: re-add <PricingSection /> and the Pricing links in Navbar and Footer.
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { Footer } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CTABanner />
      <WhyNavixSection />
      <WhoItsForSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <Footer />
    </main>
  )
}
