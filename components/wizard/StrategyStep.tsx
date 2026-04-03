"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

import { StepProps } from "@/types/onboarding"

const objectiveOptions = [
  "Trouver de l'inspiration virale",
  "Identifier les hooks gagnants",
  "Optimiser mon temps de production",
  "Comprendre les failles de mes concurrents",
]

export function StrategyStep({ data, updateData }: StepProps) {
  const toggleObjective = (obj: string) => {
    const next = data.objectives.includes(obj)
      ? data.objectives.filter((o: string) => o !== obj)
      : [...data.objectives, obj]
    updateData({ objectives: next })
  }

  return (
    <div className="space-y-12 py-2">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <Label className="text-base font-bold text-foreground/80 tracking-wide uppercase">Objectifs prioritaires</Label>
        <div className="grid gap-3">
          {objectiveOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleObjective(opt)}
              className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 group ${
                data.objectives.includes(opt)
                  ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5"
                  : "border-border/40 bg-background hover:border-primary/30"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                data.objectives.includes(opt) 
                ? "bg-primary border-primary rotate-0" 
                : "border-border/60 group-hover:border-primary/40 rotate-45 group-hover:rotate-0"
              }`}>
                {data.objectives.includes(opt) && <CheckCircle2 size={16} className="text-white" />}
              </div>
              <span className={`text-sm font-bold tracking-tight transition-colors ${data.objectives.includes(opt) ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/70"}`}>
                {opt}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
            <Label htmlFor="avoid" className="text-base font-bold text-foreground/80 tracking-wide uppercase">Sujets à éviter</Label>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Optionnel</span>
        </div>
        <Textarea 
          id="avoid"
          placeholder="Ex: Politique, langage familier, emojis excessifs..."
          className="min-h-[140px] rounded-2xl bg-muted/20 border-border/40 focus:bg-white transition-all p-5 text-base"
          value={data.avoidSubjects || ""}
          onChange={(e) => updateData({ avoidSubjects: e.target.value })}
        />
      </motion.div>
    </div>
  )
}
