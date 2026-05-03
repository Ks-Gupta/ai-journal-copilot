'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Target, Lightbulb, AlertTriangle, Trophy, Copy, FileDown, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SubmissionReadiness } from '@/components/submission-readiness'

interface Journal {
  name: string
  match_score: number
}

interface Analysis {
  domain: string
  subfield: string
  journals: Journal[]
  acceptance_probability: number
  reasons: string[]
  improvements: string[]
  score_breakdown?: string[]
}

interface ResultsPanelProps {
  analysis: Analysis | null
  abstract?: string
}

const openJournal = (name: string) => {
  const query = encodeURIComponent(name + " journal paper")
  window.open(`https://scholar.google.com/scholar?q=${query}`, "_blank")
}
function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const safeValue = Number.isFinite(value) ? value : 0
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      setDisplayValue(Math.floor(easeOutQuart * safeValue))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [safeValue, duration])

  return <span>{displayValue}</span>
}
function CircularProgress({ value, size = 140 }: { value: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  // ✅ SAFE VALUE (CRITICAL FIX)
  const safeValue = Number.isFinite(value) ? value : 0

  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (safeValue / 100) * circumference)
    }, 100)
    return () => clearTimeout(timer)
  }, [safeValue, circumference])

  const getColor = (val: number) => {
    if (val >= 70) return '#10b981'
    if (val >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getLabel = (val: number) => {
    if (val >= 70) return 'High'
    if (val >= 40) return 'Moderate'
    return 'Low'
  }

  const getGlow = (val: number) => {
    if (val >= 70) return 'shadow-lg shadow-green-500/30'
    if (val >= 40) return 'shadow-lg shadow-yellow-500/30'
    return 'shadow-lg shadow-red-500/30'
  }

  return (
    <div className={cn('relative', getGlow(safeValue))} style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getColor(safeValue)} stopOpacity="0.5" />
            <stop offset="100%" stopColor={getColor(safeValue)} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background */}
        <circle
          className="text-secondary"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Progress */}
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={getColor(safeValue)}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            transition: 'stroke-dashoffset 1s ease-out, filter 0.3s ease',
            filter: `drop-shadow(0 0 8px ${getColor(safeValue)}40)`,
          }}
        />
      </svg>

      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: getColor(safeValue) }}>
          <AnimatedNumber value={safeValue} />%
        </span>
        <span className="mt-1 text-xs font-semibold text-muted-foreground">
          {getLabel(safeValue)} Chance
        </span>
      </div>
    </div>
  )
}
function JournalCard({ journal, rank }: { journal: Journal; rank: number }) {
  const getRankBadge = (r: number) => {
    if (r === 1) return { color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', label: '#1' }
    if (r === 2) return { color: 'bg-slate-400/20 text-slate-400 border-slate-400/30', label: '#2' }
    return { color: 'bg-amber-700/20 text-amber-600 border-amber-700/30', label: '#3' }
  }

  const badge = getRankBadge(rank)

  return (
    <div className="glass group rounded-xl p-5 opacity-0 animate-fade-in transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className={cn('rounded-md border px-2 py-0.5 text-xs font-bold', badge.color)}>
            {badge.label}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {journal.match_score}% Match
        </Badge>
      </div>
      <h4 className="mb-4 text-base font-semibold text-foreground line-clamp-2">
        {journal.name}
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Match Score</span>
          <span className="font-medium text-foreground">{journal.match_score}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${journal.match_score}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function ResultsPanel({ analysis, abstract }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false)

  if (!analysis) return null

  const handleCopy = async () => {
    const text = `
Domain: ${analysis.domain}
Subfield: ${analysis.subfield}
Acceptance Probability: ${analysis.acceptance_probability}%

Recommended Journals:
${analysis.journals.map((j, i) => `${i + 1}. ${j.name} (${j.match_score}% match)`).join('\n')}

Why This Analysis:
${analysis.reasons.map(r => `• ${r}`).join('\n')}

Suggested Improvements:
${analysis.improvements.map(i => `• ${i}`).join('\n')}
    `.trim()

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

 const acceptanceProbability = Number(analysis.acceptance_probability ?? 0)

// 🔍 smarter detection
const hasMethod = analysis.score_breakdown?.some(i => i.includes('Methodology'))
const hasResults = analysis.score_breakdown?.some(i => i.includes('Results'))
const hasExp = analysis.score_breakdown?.some(i => i.includes('Experimental'))

const keyInsight = `This paper demonstrates ${
  acceptanceProbability >= 80 ? 'strong' :
  acceptanceProbability >= 60 ? 'good' : 'moderate'
} publication potential in ${
  analysis.journals[0]?.name ?? 'relevant journals'
}.

The study ${
  hasMethod ? 'clearly defines its methodology' : 'needs a clearer methodology description'
}, ${
  hasResults ? 'presents strong quantitative results' : 'lacks strong quantitative results'
}, and ${
  hasExp ? 'includes experimental validation' : 'needs stronger experimental validation'
}.

Addressing the remaining gaps could further improve acceptance chances in top-tier journals.`
  return (
    <div className="space-y-6 opacity-0 animate-slide-up">
      {/* Key Insight Highlight */}
      <div className="glass rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 to-primary/5 p-6 opacity-0 animate-fade-in stagger-0">
        <div className="flex gap-4">
          <div className="flex-shrink-0 pt-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
              <span className="text-lg">📌</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-accent">Key Insight</h3>
            <p className="text-sm text-foreground leading-relaxed">
              {keyInsight}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Results'}
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Domain & Subfield */}
      <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in stagger-1">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Research Classification</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl bg-primary/10 px-4 py-2">
            <span className="text-xs text-muted-foreground">Domain</span>
            <p className="font-medium text-primary">{analysis.domain}</p>
          </div>
          <div className="rounded-xl bg-secondary px-4 py-2">
            <span className="text-xs text-muted-foreground">Subfield</span>
            <p className="font-medium text-foreground">{analysis.subfield}</p>
          </div>
        </div>
      </div>

      {/* Acceptance + Score */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        
        {/* Acceptance */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Acceptance Rate</h3>
          </div>

          <div className="flex justify-center py-4">
            <CircularProgress value={analysis?.acceptance_probability ?? 0} />
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Based on journal fit
          </p>
        </div>

        {/* Score Breakdown */}
        {analysis.score_breakdown && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-3">Why this score?</h3>
            <ul className="space-y-2 text-sm">
              {analysis.score_breakdown.map((item, i) => {
                  const isPositive = item.includes("✔")

                  return (
                    <li key={i} className="flex gap-2 items-start">
                      <span className={isPositive ? "text-green-500" : "text-red-500"}>
                        {isPositive ? "✔" : "✖"}
                      </span>
                      <span>{item.replace("✔", "").replace("✖", "").trim()}</span>
                    </li>
                  )
                })}
            </ul>
          </div>
        )}
      </div>
        
          {/* Recommended Journals */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-5 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recommended Journals</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analysis.journals.map((journal, index) => {
            const getRankColor = () => {
              if (index === 0) return "bg-yellow-100 text-yellow-700"
              if (index === 1) return "bg-gray-200 text-gray-700"
              return "bg-orange-100 text-orange-700"
            }

            return (
              <div
                key={index}
                onClick={() => openJournal(journal.name)}
                className="group cursor-pointer rounded-xl border border-border p-5 transition-all hover:scale-[1.03] hover:shadow-xl hover:border-primary/40"
              >
                {/* Top Row */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRankColor()}`}>
                    #{index + 1}
                  </span>

                  <span className="text-sm font-bold text-primary">
                    {journal.match_score}%
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-semibold leading-snug line-clamp-2">
                  {journal.name}
                </h4>

                {/* Progress */}
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${journal.match_score}%` }}
                  />
                </div>

                {/* CTA */}
                <p className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                  View papers →
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reasons & Improvements Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reasons */}
        <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in stagger-4">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Why These Journals</h3>
          </div>
          <ul className="space-y-3">
            {analysis.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="glass rounded-2xl border-warning/20 bg-warning/5 p-6 opacity-0 animate-fade-in stagger-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-foreground">Suggested Improvements</h3>
          </div>
          <ul className="space-y-3">
            {analysis.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Submission Readiness & AI Improve */}
      {abstract && <SubmissionReadiness abstract={abstract} />}
    </div>
  )
}
