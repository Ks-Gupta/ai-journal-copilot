'use client'

import { Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
      {/* Background decoration */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
      
      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered Analysis</span>
        </div>
        
        <h1 className="mb-3 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Find the Perfect Journal for Your Research
        </h1>
        
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Paste your research abstract and let our AI analyze it to recommend the best academic 
          journals for publication, complete with acceptance probability and improvement suggestions.
        </p>
      </div>  
    </div>
  )
}
