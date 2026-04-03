"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ProjectStep } from "@/components/wizard/ProjectStep"
import { BrandStep } from "@/components/wizard/BrandStep"
import { StrategyStep } from "@/components/wizard/StrategyStep"
import { ChevronLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { OnboardingData } from "@/types/onboarding"

const steps = [
  { id: 1, title: "Projet", description: "Définissons votre univers" },
  { id: 2, title: "Identité", description: "Le ton de votre marque" },
  { id: 3, title: "Stratégie", description: "Vos objectifs de croissance" },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    niche: "",
    location: "Global",
    tone: 50,
    voice: "Professionnel",
    objectives: [] as string[],
    avoidSubjects: ""
  })

  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const updateData = (newData: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden">
      {/* Top Navbar */}
      <nav className="w-full max-w-5xl px-6 py-10 flex justify-between items-center bg-transparent z-20">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-foreground p-2.5 rounded-2xl shadow-xl shadow-foreground/5">
            <Image src="/logo_navix.png" alt="Navix Logo" width={32} height={32} className="brightness-200" />
          </div>
          <span className="font-heading font-extrabold text-2xl tracking-tighter text-foreground">Navix AI</span>
        </Link>
        <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] bg-muted/30 px-5 py-2.5 rounded-full border border-border/40 backdrop-blur-sm">
                Étape {currentStep} <span className="text-border mx-2">/</span> {steps.length}
            </div>
        </div>
      </nav>

      {/* Centered Content */}
      <div className="w-full max-w-2xl px-6 flex-1 flex flex-col justify-center pb-20 relative z-10">
        <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-12"
            >
                <div className="space-y-4 text-center sm:text-left">
                    <h2 className="text-4xl sm:text-5xl font-heading font-black text-foreground tracking-tight leading-[1.1]">
                        {currentStep === 1 && "Commençons par votre projet"}
                        {currentStep === 2 && "Définissons votre style"}
                        {currentStep === 3 && "Vos orientations stratégiques"}
                    </h2>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-lg mx-auto sm:mx-0">
                        {currentStep === 1 && "Identifiez votre niche pour que notre IA puisse scanner vos concurrents directs."}
                        {currentStep === 2 && "Ajustez le ton pour que chaque contenu généré résonne parfaitement."}
                        {currentStep === 3 && "Ciblez les lacunes du marché pour créer du contenu qui se démarque vraiment."}
                    </p>
                </div>

                <div className="bg-card rounded-[2.5rem] p-8 sm:p-10 border border-border/40 shadow-2xl shadow-foreground/5 relative overflow-hidden group">
                    <div className="relative z-10">
                        {currentStep === 1 && <ProjectStep data={formData} updateData={updateData} />}
                        {currentStep === 2 && <BrandStep data={formData} updateData={updateData} />}
                        {currentStep === 3 && <StrategyStep data={formData} updateData={updateData} />}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>

        {/* Footer Navigation Bar */}
        <div className="mt-16 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className={`flex items-center gap-2.5 font-bold text-sm transition-all duration-300 ${
              currentStep === 1 ? "opacity-0 pointer-events-none" : "text-muted-foreground hover:text-foreground hover:-translate-x-1"
            }`}
          >
            <ChevronLeft size={18} strokeWidth={3} />
            Retour
          </button>
          
          <div className="flex items-center gap-10">
            <div className="w-32 hidden sm:block h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary shadow-[0_0_12px_rgba(59,123,177,0.4)]" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "circOut" }}
              />
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              className="px-12"
            >
              {currentStep === steps.length ? "Finaliser mon profil" : "Étape suivante"}
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Minimalist Background Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,123,177,0.015),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(119,163,201,0.015),transparent_50%)] pointer-events-none -z-10" />
    </main>
  )
}
