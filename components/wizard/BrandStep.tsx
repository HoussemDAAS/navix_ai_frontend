"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { motion } from "framer-motion"
import { MessageSquare, Zap, Target, BookOpen } from "lucide-react"

import { StepProps, VoiceStyle } from "@/types/onboarding"

const voiceOptions = [
  { id: "professional", label: "Professionnel", icon: Target, desc: "Expert et rassurant" },
  { id: "casual", label: "Décontracté", icon: MessageSquare, desc: "Amical et proche" },
  { id: "energetic", label: "Énergique", icon: Zap, desc: "Motivant et punchy" },
  { id: "educational", label: "Éducatif", icon: BookOpen, desc: "Pédagogue et précis" },
]

export function BrandStep({ data, updateData }: StepProps) {
  return (
    <div className="space-y-12 py-2">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-end border-b border-border/40 pb-4">
            <Label className="text-base font-bold text-foreground/80 tracking-wide uppercase leading-none">Ton de la marque</Label>
            <span className="text-primary font-black text-xl italic tracking-tighter">
                {data.tone}% {data.tone < 50 ? "Analytique" : "Créatif"}
            </span>
        </div>
        <Slider 
          value={[data.tone]} 
          onValueChange={(val: number[]) => updateData({ tone: val[0] })}
          max={100}
          step={1}
          className="py-4"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
            <span>Rigoureux</span>
            <span>Inspirant</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <Label className="text-base font-bold text-foreground/80 tracking-wide uppercase">Style de voix dominant</Label>
        <div className="grid grid-cols-2 gap-4">
            {voiceOptions.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => updateData({ voice: opt.label as VoiceStyle })}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 relative group overflow-hidden ${
                        data.voice === opt.label 
                        ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5" 
                        : "border-border/40 bg-background hover:border-primary/40"
                    }`}
                >
                    <div className={`transition-colors duration-300 ${data.voice === opt.label ? "text-primary" : "text-muted-foreground group-hover:text-primary/60"}`}>
                        <opt.icon size={24} strokeWidth={2.5} className="mb-4" />
                    </div>
                    <div className="font-black text-foreground tracking-tight text-lg">{opt.label}</div>
                    <div className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed opacity-80">{opt.desc}</div>
                    
                    {data.voice === opt.label && (
                        <motion.div 
                            layoutId="active-voice"
                            className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary"
                        />
                    )}
                </button>
            ))}
        </div>
      </motion.div>
    </div>
  )
}
