"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

import { StepProps } from "@/types/onboarding"

export function ProjectStep({ data, updateData }: StepProps) {
  return (
    <div className="space-y-10 py-2">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <Label htmlFor="name" className="text-base font-bold text-foreground/80 tracking-wide uppercase">Nom de votre marque</Label>
        <Input 
          id="name"
          placeholder="Ex: Navix Fitness"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="h-14 bg-muted/20 border-border/40 focus:bg-white transition-all text-lg rounded-2xl"
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <Label htmlFor="niche" className="text-base font-bold text-foreground/80 tracking-wide uppercase">Votre Niche / Secteur</Label>
        <Input 
          id="niche"
          placeholder="Ex: Coaching Sportif à domicile"
          value={data.niche}
          onChange={(e) => updateData({ niche: e.target.value })}
          className="h-14 bg-muted/20 border-border/40 focus:bg-white transition-all text-lg rounded-2xl"
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <Label htmlFor="location" className="text-base font-bold text-foreground/80 tracking-wide uppercase">Localisation cible</Label>
        <Input 
          id="location"
          placeholder="Ex: Paris, France ou Global"
          value={data.location}
          onChange={(e) => updateData({ location: e.target.value })}
          className="h-14 bg-muted/20 border-border/40 focus:bg-white transition-all text-lg rounded-2xl"
        />
      </motion.div>
    </div>
  )
}
