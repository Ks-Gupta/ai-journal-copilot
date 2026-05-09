'use client'

import { useEffect, useState } from 'react'
import {
  Copy,
  Check,
  PenLine,
  Lightbulb,
  Beaker,
  Target,
  Gauge,
  RefreshCw,
  ArrowRight,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { API_URL } from '@/lib/api'

interface SubmissionReadinessProps {
  abstract: string
  acceptance: number
  breakdown?: (string | { metric: string; percentage: number })[]
  onReAnalyze?: (newAbstract: string) => void
}

interface ReadinessScores {
  clarity: number
  novelty: number
  technical_depth: number
  journal_fit: number
  overall: number
}

interface Tier {
  label: string
  blurb: string
  color: string
  ringColor: string
  bg: string
  text: string
  border: string
  bar: string
}

function getTier(value: number): Tier {
  if (value >= 85) {
    return {
      label: 'Strong',
      blurb: 'Ready to submit. Minor polish only.',
      color: '#22c55e',
      ringColor: 'ring-green-500/30',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/40',
      bar: 'from-green-400 to-emerald-500',
    }
  }
  if (value >= 70) {
    return {
      label: 'Promising',
      blurb: 'Strong direction. Tighten weak metrics before submitting.',
      color: '#06b6d4',
      ringColor: 'ring-cyan-500/30',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/40',
      bar: 'from-cyan-400 to-blue-500',
    }
  }
  if (value >= 50) {
    return {
      label: 'Improvable',
      blurb: 'Reasonable foundation. Substantial revision recommended.',
      color: '#eab308',
      ringColor: 'ring-yellow-500/30',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/40',
      bar: 'from-yellow-400 to-orange-500',
    }
  }
  return {
    label: 'Needs work',
    blurb: 'Significant revision needed across multiple dimensions.',
    color: '#ef4444',
    ringColor: 'ring-red-500/30',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/40',
    bar: 'from-red-400 to-rose-500',
  }
}

function CircularScore({
  value,
  tier,
  size = 140,
}: {
  value: number
  tier: Tier
  size?: number
}) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (value / 100) * circumference)
    }, 100)
    return () => clearTimeout(t)
  }, [value, circumference])

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          className="text-secondary/60"
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
          stroke={tier.color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {Math.round(value)}
          <span className="text-base font-semibold text-muted-foreground">%</span>
        </span>
        <span
          className={cn(
            'mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            tier.border,
            tier.bg,
            tier.text,
          )}
        >
          {tier.label}
        </span>
      </div>
    </div>
  )
}

interface MetricMeta {
  key: keyof Omit<ReadinessScores, 'overall'>
  label: string
  caption: string
  Icon: typeof PenLine
}

const METRICS: MetricMeta[] = [
  { key: 'clarity', label: 'Clarity', caption: 'Writing & structure', Icon: PenLine },
  { key: 'novelty', label: 'Novelty', caption: 'Innovation level', Icon: Lightbulb },
  { key: 'technical_depth', label: 'Technical Depth', caption: 'Methodology rigor', Icon: Beaker },
  { key: 'journal_fit', label: 'Journal Fit', caption: 'Topic alignment', Icon: Target },
]

function MetricRow({
  meta,
  value,
}: {
  meta: MetricMeta
  value: number
}) {
  const tier = getTier(value)
  const Icon = meta.Icon
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', tier.bg)}>
          <Icon className={cn('h-3.5 w-3.5', tier.text)} />
        </div>
        <div className="flex flex-1 items-baseline justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground leading-none">{meta.label}</p>
            <p className="text-[11px] text-muted-foreground">{meta.caption}</p>
          </div>
          <span className={cn('text-lg font-bold tabular-nums', tier.text)}>
            {Math.round(value)}
            <span className="text-xs text-muted-foreground">%</span>
          </span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out',
            tier.bar,
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function buildVerdict(scores: ReadinessScores): string {
  const tier = getTier(scores.overall)
  const lowest = METRICS.reduce<{ key: string; label: string; value: number } | null>(
    (worst, m) => {
      const v = scores[m.key]
      if (worst === null || v < worst.value) {
        return { key: m.key, label: m.label, value: v }
      }
      return worst
    },
    null,
  )

  if (!lowest) return tier.blurb

  if (scores.overall >= 70 && lowest.value < 60) {
    return `${tier.blurb} Focus on ${lowest.label.toLowerCase()} (${Math.round(lowest.value)}%).`
  }
  if (scores.overall >= 50 && lowest.value < 50) {
    return `${tier.blurb} Weakest dimension: ${lowest.label} at ${Math.round(lowest.value)}%.`
  }
  return tier.blurb
}

export function SubmissionReadiness({
  abstract,
  acceptance,
  breakdown,
  onReAnalyze,
}: SubmissionReadinessProps) {
  const [scores, setScores] = useState<ReadinessScores | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [improvedAbstract, setImprovedAbstract] = useState<string | null>(null)
  const [isImproving, setIsImproving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  const safeAcceptance = Number.isFinite(acceptance) ? acceptance : 0

  const getMetric = (name: string) => {
    const item = breakdown?.find((i) => {
      const text = typeof i === 'string' ? i : i?.metric ?? ''
      return text.toLowerCase().includes(name)
    })
    if (!item) return 0
    if (typeof item === 'string') {
      const match = item.match(/\((\+?\d+)\)/)
      return match ? parseInt(match[1]) : 0
    }
    return item.percentage ?? 0
  }

  useEffect(() => {
    if (!abstract.trim()) return
    setIsLoading(true)

    const timer = setTimeout(() => {
      const clarity =
        getMetric('clarity') ||
        getMetric('length') ||
        Math.min(100, 50 + safeAcceptance / 2)
      const novelty = getMetric('novel') || 50

      const directTechDepth = getMetric('technical')
      const methodology = getMetric('methodology')
      const results = getMetric('result')
      const experiments = getMetric('experiment')
      const technical_depth =
        directTechDepth ||
        Math.min(100, methodology * 0.4 + experiments * 0.3 + results * 0.3)

      const journal_fit = safeAcceptance
      const overall = Math.round(
        (clarity + novelty + technical_depth + journal_fit) / 4,
      )

      setScores({ clarity, novelty, technical_depth, journal_fit, overall })
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [abstract, safeAcceptance, breakdown])

  const handleImproveAbstract = async () => {
    if (!abstract || !abstract.trim()) return
    setIsImproving(true)
    try {
      const response = await fetch(`${API_URL}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstract: abstract || '' }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.improved_abstract) {
          setImprovedAbstract(data.improved_abstract)
          if (onReAnalyze) onReAnalyze(data.improved_abstract)
        }
      }
    } catch {
      const mockImproved = `${abstract}\n\nEnhanced with improved clarity, stronger technical terminology, and better alignment with high-impact journal standards.`
      if (onReAnalyze) onReAnalyze(mockImproved)
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
  if (isLoading || !scores) return <div className="h-40" />

  const tier = getTier(scores.overall)

  return (
    <div className="space-y-6">
      {/* Submission Readiness */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/40 p-6 opacity-0 animate-fade-in stagger-6">
        {/* Header */}
        <div className="relative mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Submission readiness
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Score from clarity, novelty, methodology, and journal fit
            </p>
          </div>
        </div>

        <div className="relative grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          {/* Hero score */}
          <div className="flex flex-col items-center">
            <CircularScore value={scores.overall} tier={tier} size={150} />
          </div>

          {/* Metric rows */}
          <div className="space-y-4">
            {METRICS.map((m) => (
              <MetricRow key={m.key} meta={m} value={scores[m.key]} />
            ))}
          </div>
        </div>

        {/* Verdict banner */}
        <div
          className={cn(
            'relative mt-6 flex items-start gap-3 rounded-xl border p-3.5',
            tier.border,
            tier.bg,
          )}
        >
          <Lightbulb className={cn('mt-0.5 h-4 w-4 flex-shrink-0', tier.text)} />
          <p className="text-sm leading-relaxed text-foreground/90">
            {buildVerdict(scores)}
          </p>
        </div>
      </div>

      {/* Refine Abstract */}
      <div className="rounded-2xl border border-border/60 bg-background/40 p-6 opacity-0 animate-fade-in stagger-7">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Refine abstract
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Rewrite for clarity, sharper claims, and better journal fit
              </p>
            </div>
          </div>

          <Button
            onClick={handleImproveAbstract}
            disabled={isImproving}
            size="sm"
            variant={improvedAbstract ? 'outline' : 'default'}
            className="gap-2"
          >
            {isImproving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : improvedAbstract ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {isImproving
              ? 'Rewriting…'
              : improvedAbstract
              ? 'Regenerate'
              : 'Rewrite'}
            {!isImproving && !improvedAbstract && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>

        {!improvedAbstract && !isImproving && (
          <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-6 text-center">
            <Wand2 className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Click <span className="font-medium text-foreground">Rewrite</span> to
              produce a polished version of your abstract.
            </p>
          </div>
        )}

        {isImproving && (
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-6 text-center">
            <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Rewriting your abstract…
            </p>
          </div>
        )}

        {improvedAbstract && !isImproving && (
          <div className="space-y-3 opacity-0 animate-fade-in">
            {/* Segmented tabs */}
            <div className="inline-flex rounded-lg border border-border bg-secondary/30 p-0.5">
              <button
                onClick={() => setCompareMode(false)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  !compareMode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Rewritten
              </button>
              <button
                onClick={() => setCompareMode(true)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  compareMode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Compare
              </button>
            </div>

            {/* Content */}
            {compareMode ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Original
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {abstract}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="mb-2 text-xs font-medium text-foreground">
                    Rewritten
                  </p>
                  <p className="text-xs leading-relaxed text-foreground">
                    {improvedAbstract}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {improvedAbstract}
                </p>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied' : 'Copy rewritten'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
