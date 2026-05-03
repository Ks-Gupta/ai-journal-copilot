'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight, Sparkles, Zap, Target, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LandingPageProps {
  onStartAnalysis: () => void
}

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Analysis',
    description: 'Advanced NLP algorithms analyze your research abstract in seconds',
  },
  {
    icon: Target,
    title: 'Perfect Match',
    description: 'Find journals that align with your research domain and methodology',
  },
  {
    icon: BarChart3,
    title: 'Success Prediction',
    description: 'Get acceptance probability estimates based on content analysis',
  },
]

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Initialize particles on resize
      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: 80 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
        }))
      }
    }
    resize()
    window.addEventListener('resize', resize)

    let time = 0
    let animationId: number

    const animate = () => {
      // Clear with dark background
      ctx.fillStyle = '#0a0e16'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw 3 moving gradient orbs
      const orbs = [
        { x: 0.2, y: 0.3, size: 350, color: 'rgba(6, 182, 212, 0.2)' },
        { x: 0.7, y: 0.5, size: 400, color: 'rgba(34, 211, 238, 0.15)' },
        { x: 0.5, y: 0.8, size: 320, color: 'rgba(20, 184, 166, 0.12)' },
      ]

      orbs.forEach((orb, i) => {
        const x = canvas.width * (orb.x + Math.sin(time * (0.3 + i * 0.1)) * 0.15)
        const y = canvas.height * (orb.y + Math.cos(time * (0.25 + i * 0.08)) * 0.15)

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.size)
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })

      // Update and draw particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Draw particle with glow
        const brightness = Math.sin(time * 2 + p.x) * 0.3 + 0.6
        ctx.fillStyle = `rgba(34, 211, 238, ${brightness * 0.8})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Glow
        ctx.fillStyle = `rgba(34, 211, 238, ${brightness * 0.15})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw connections between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i]
          const p2 = particlesRef.current[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 200) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.15 * (1 - dist / 200)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      time += 0.008
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
    />
  )
}

export function LandingPage({ onStartAnalysis }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-6 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/20">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-semibold text-white">AI Journal Copilot</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-16 lg:px-12">
          <div className="w-full max-w-3xl space-y-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">AI-Powered Research Assistant</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-10xl font-bold leading-tight text-white tracking-tight">
              Find the Perfect Journal
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                for Your Research
              </span>
            </h1>

            {/* Subtitle */}
           <p className="mx-auto max-w-xl text-base sm:text-lg text-gray-300 leading-relaxed opacity-90">
                Paste your research abstract and let our AI analyze it to recommend the most suitable academic journals, predict acceptance probability, and provide actionable improvements.
              </p>

            {/* CTA Button */}
            <div className="mt-4 flex justify-center">
              <div className="relative">
                
                {/* glow */}
                <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-2xl" />

                <Button
                  size="lg"
                  onClick={onStartAnalysis}
                  className="relative z-10 h-14 px-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40"
                >
                  Start Analysis
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 lg:gap-16">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400">10,000+</span>
                <span>Journals Indexed</span>
              </div>
              <div className="hidden h-4 w-px bg-gray-700 sm:block" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400">95%</span>
                <span>Accuracy Rate</span>
              </div>
              <div className="hidden h-4 w-px bg-gray-700 sm:block" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400">50,000+</span>
                <span>Papers Analyzed</span>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="relative z-10 px-6 py-12 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 sm:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="group rounded-2xl p-6 transition-all duration-300 bg-white/5 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 hover:bg-white/10"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 transition-colors duration-300 group-hover:bg-cyan-500/20">
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 px-6 py-6 text-center text-sm text-gray-500 lg:px-12">
          <p>Built with AI to accelerate your research journey</p>
        </footer>
      </div>
    </div>
  )
}
