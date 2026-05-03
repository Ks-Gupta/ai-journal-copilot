'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Copy, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SubmissionReadinessProps {
  abstract: string
}

interface ReadinessScores {
  clarity: number
  novelty: number
  technical_depth: number
  journal_fit: number
  overall: number
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const getColor = (val: number) => {
    if (val >= 70) return 'bg-green-500'
    if (val >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-2 opacity-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-out', getColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function CircularProgressScore({ value, size = 100 }: { value: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (value / 100) * circumference)
    }, 100)
    return () => clearTimeout(timer)
  }, [value, circumference])

  const getColor = (val: number) => {
    if (val >= 70) return '#22c55e'
    if (val >= 40) return '#eab308'
    return '#ef4444'
  }

  return (
    <div className="relative opacity-0 animate-fade-in" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          className="text-secondary"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={getColor(value)}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground animate-counter">
          {Math.round(value)}%
        </span>
        <span className="text-xs text-muted-foreground">Ready</span>
      </div>
    </div>
  )
}

export function SubmissionReadiness({ abstract }: SubmissionReadinessProps) {
  const [scores, setScores] = useState<ReadinessScores | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [improvedAbstract, setImprovedAbstract] = useState<string | null>(null)
  const [isImproving, setIsImproving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  useEffect(() => {
    if (!abstract.trim()) return

    setIsLoading(true)
    const timer = setTimeout(() => {
      // Mock scores based on abstract length and quality
      const words = abstract.trim().split(/\s+/).length
      const hasNumbers = /\d/.test(abstract)
      const hasQuotes = /["']/.test(abstract)
      
      const clarity = Math.min(95, 60 + (words / 20) + (hasQuotes ? 10 : 0))
      const novelty = Math.min(95, 50 + Math.random() * 30)
      const technical_depth = Math.min(95, 55 + (hasNumbers ? 20 : 0) + Math.random() * 15)
      const journal_fit = Math.min(95, 65 + Math.random() * 20)
      const overall = Math.round((clarity + novelty + technical_depth + journal_fit) / 4)

      setScores({
        clarity: Math.round(clarity),
        novelty: Math.round(novelty),
        technical_depth: Math.round(technical_depth),
        journal_fit: Math.round(journal_fit),
        overall: overall,
      })
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [abstract])

  const handleImproveAbstract = async () => {
   if (!abstract || !abstract.trim()) return
   console.log("IMPROVE ABSTRACT:", abstract)

    setIsImproving(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstract: abstract || ""
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.improved_abstract) {
          setImprovedAbstract(data.improved_abstract)
        }
      }
    } catch {
      // Mock improved abstract for demo
      const mockImproved = `${abstract}\n\nEnhanced with improved clarity, stronger technical terminology, and better alignment with high-impact journal standards. Key improvements: strengthened methodology description, added quantitative impact metrics, and optimized for journal audience expectations.`
      setImprovedAbstract(mockImproved)
    } finally {
      setIsImproving(false)
    }
  }

  const handleCopy = async () => {
    if (!improvedAbstract) return
    await navigator.clipboard.writeText(improvedAbstract)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!abstract.trim()) return null
  if (isLoading) return <div className="h-40" />

  return (
    <div className="space-y-6">
      {/* Submission Readiness Score */}
      <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in stagger-6">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Submission Readiness</h3>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Overall Score */}
          <div className="flex justify-center">
            {scores && <CircularProgressScore value={scores.overall} size={120} />}
          </div>

          {/* Breakdown */}
          <div className="space-y-4">
            {scores && (
              <>
                <ScoreBar label="Clarity Score" value={scores.clarity} />
                <ScoreBar label="Novelty Score" value={scores.novelty} />
                <ScoreBar label="Technical Depth" value={scores.technical_depth} />
                <ScoreBar label="Journal Fit" value={scores.journal_fit} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Improve Abstract Section */}
      <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in stagger-7">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Enhance with AI</h3>
          </div>
          <Button
            onClick={handleImproveAbstract}
            disabled={isImproving}
            size="sm"
            className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30"
          >
            <Sparkles className="h-4 w-4" />
            {isImproving ? 'Improving...' : 'Improve Abstract'}
          </Button>
        </div>

        {improvedAbstract && (
          <div className="space-y-3 opacity-0 animate-fade-in">
            {/* Toggle */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <button
                onClick={() => setCompareMode(false)}
                className={cn(
                  'px-3 py-1 text-sm font-medium transition-colors rounded',
                  !compareMode ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Improved
              </button>
              <button
                onClick={() => setCompareMode(true)}
                className={cn(
                  'px-3 py-1 text-sm font-medium transition-colors rounded',
                  compareMode ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Compare
              </button>
            </div>

            {/* Content */}
            <div className={cn(
              'rounded-lg bg-secondary/50 p-4 text-sm text-foreground leading-relaxed',
              'max-h-40 overflow-y-auto'
            )}>
              {compareMode ? (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Original</p>
                    <p className="text-xs text-muted-foreground">{abstract}</p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Improved</p>
                    <p className="text-xs">{improvedAbstract}</p>
                  </div>
                </div>
              ) : (
                <p>{improvedAbstract}</p>
              )}
            </div>

            {/* Copy Button */}
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Improved Abstract'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
