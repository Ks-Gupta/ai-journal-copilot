'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Target, Lightbulb, Copy, FileDown, Check, FileText, ThumbsUp, ThumbsDown, RotateCw, X, Quote, Hash, Tag, Network, Beaker, Globe, MessageSquareText, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { API_URL } from '@/lib/api'
import { SubmissionReadiness } from '@/components/submission-readiness'
import { JournalCard } from '@/components/journal-card'
import { RelatedPaperCard } from '@/components/related-paper-card'
import { ImprovementsCard } from '@/components/improvements-card'

interface Journal {
  name: string
  match_score: number
  fit_label?: string
  reason?: string
  impact_factor?: number
  quartile?: string
  publisher?: string
  submission_url?: string
  // Live OpenAlex enrichment
  issn?: string
  homepage_url?: string
  h_index?: number
  two_year_mean_citedness?: number
  is_oa?: boolean
  works_count?: number
  openalex_id?: string
}

interface RelatedPaper {
  title: string
  authors: string[]
  total_authors?: number
  year?: number
  venue?: string
  abstract?: string
  url?: string
  preferred_url?: string
  citation_count?: number
  is_oa?: boolean
  oa_url?: string
  type?: string
}

interface Analysis {
  domain: string
  subfield: string
  journals: Journal[]
  acceptance_probability: number
  reasons: string[]
  improvements: string[]
  related_papers?: RelatedPaper[]
  score_breakdown?:  {
      metric: string
      percentage: number
  }[]

  review?: {
    decision: string
    confidence: number
    summary: string
    strengths: string[]
    weaknesses: string[]
  }
}

interface ResultsPanelProps {
  analysis: Analysis | null
  setAnalysis: (data: Analysis) => void
  abstract?: string
}

const openJournal = (journal: Journal) => {
  if (journal.submission_url) {
    window.open(journal.submission_url, '_blank', 'noopener,noreferrer')
    return
  }
  const query = encodeURIComponent(journal.name + ' journal paper')
  window.open(`https://scholar.google.com/scholar?q=${query}`, '_blank')
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
type SignalType = 'semantic' | 'domain' | 'topics' | 'methodology' | 'subfield' | 'generic'

interface MatchSignal {
  type: SignalType
  text: string
  topics?: string[]
}

const SIGNAL_PATTERNS: Array<{
  type: SignalType
  re: RegExp
  build: (m: RegExpMatchArray) => MatchSignal
}> = [
  {
    type: 'semantic',
    re: /(strong|moderate)\s+semantic\s+(similarity|overlap)[^.]*/i,
    build: (m) => ({ type: 'semantic', text: m[1][0].toUpperCase() + m[1].slice(1) + ' semantic match' }),
  },
  {
    type: 'domain',
    re: /aligned with the journal's\s+([^.]+?)\s+scope/i,
    build: (m) => ({ type: 'domain', text: m[1].trim() }),
  },
  {
    type: 'topics',
    re: /covers your topics:\s*([^.]+)/i,
    build: (m) => ({
      type: 'topics',
      text: 'Topic match',
      topics: m[1].split(',').map((s) => s.trim()).filter(Boolean),
    }),
  },
  {
    type: 'methodology',
    re: /methodology fit\s*\(([^)]+)\)/i,
    build: (m) => ({ type: 'methodology', text: m[1].trim() }),
  },
  {
    type: 'subfield',
    re: /adjacent to your\s+([^.]+?)\s+focus/i,
    build: (m) => ({ type: 'subfield', text: m[1].trim() }),
  },
]

function parseSignals(reason?: string): MatchSignal[] {
  if (!reason) return []
  const found: MatchSignal[] = []
  for (const pattern of SIGNAL_PATTERNS) {
    const match = reason.match(pattern.re)
    if (match) found.push(pattern.build(match))
  }
  if (found.length === 0) {
    found.push({ type: 'generic', text: 'Topical relevance' })
  }
  return found
}

function SignalChip({ signal }: { signal: MatchSignal }) {
  const styles: Record<SignalType, { className: string; Icon: typeof Hash }> = {
    semantic: {
      className: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
      Icon: Network,
    },
    domain: {
      className: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
      Icon: Globe,
    },
    topics: {
      className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
      Icon: Hash,
    },
    methodology: {
      className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      Icon: Beaker,
    },
    subfield: {
      className: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      Icon: Tag,
    },
    generic: {
      className: 'border-border bg-secondary/40 text-muted-foreground',
      Icon: Tag,
    },
  }
  const { className, Icon } = styles[signal.type]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
        className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {signal.text}
    </span>
  )
}

const RANK_BADGES: Record<number, string> = {
  1: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  2: 'border-slate-400/40 bg-slate-400/10 text-slate-300',
  3: 'border-amber-700/40 bg-amber-700/10 text-amber-500',
}

function StageBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">
        {n}
      </span>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
  )
}

function WhyTheseJournals({ analysis }: { analysis: Analysis }) {
  const journals = Array.isArray(analysis.journals) ? analysis.journals : []
  if (journals.length === 0) return null

  // Aggregate stats
  const q1Count = journals.filter((j) => j.quartile === 'Q1').length
  const ifValues = journals
    .map((j) => j.two_year_mean_citedness ?? j.impact_factor)
    .filter((v): v is number => typeof v === 'number')
  const avgIf = ifValues.length
    ? (ifValues.reduce((a, b) => a + b, 0) / ifValues.length).toFixed(1)
    : null
  const totalWorks = journals.reduce(
    (sum, j) => sum + (typeof j.works_count === 'number' ? j.works_count : 0),
    0,
  )
  const fmtWorks = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n)

  // Aggregate matched topics across all journals (deduped, frequency-counted)
  const topicFreq = new Map<string, number>()
  journals.forEach((j) => {
    parseSignals(j.reason).forEach((s) => {
      if (s.type === 'topics' && s.topics) {
        s.topics.forEach((t) => {
          topicFreq.set(t, (topicFreq.get(t) ?? 0) + 1)
        })
      }
    })
  })
  const sortedTopics = Array.from(topicFreq.entries()).sort((a, b) => b[1] - a[1])

  // Aggregate signal counts to compute "what mattered" composition
  const signalCounts: Record<SignalType, number> = {
    semantic: 0,
    domain: 0,
    topics: 0,
    methodology: 0,
    subfield: 0,
    generic: 0,
  }
  journals.forEach((j) => {
    parseSignals(j.reason).forEach((s) => {
      signalCounts[s.type] += 1
    })
  })
  const totalSignals = Object.values(signalCounts).reduce((a, b) => a + b, 0)

  const composition: Array<{ type: SignalType; pct: number; label: string; color: string }> = (
    [
      { type: 'semantic', label: 'Semantic similarity', color: 'bg-purple-500' },
      { type: 'topics', label: 'Topic overlap', color: 'bg-cyan-500' },
      { type: 'domain', label: 'Domain alignment', color: 'bg-blue-500' },
      { type: 'methodology', label: 'Methodology fit', color: 'bg-emerald-500' },
      { type: 'subfield', label: 'Subfield adjacency', color: 'bg-amber-500' },
    ] satisfies Array<{ type: SignalType; label: string; color: string }>
  )
    .map((c) => ({
      ...c,
      pct: totalSignals > 0 ? (signalCounts[c.type] / totalSignals) * 100 : 0,
    }))
    .filter((c) => c.pct > 0)

  // Average match score across top journals
  const avgMatch = Math.round(
    journals.reduce((sum, j) => sum + (j.match_score || 0), 0) / journals.length,
  )

  return (
    <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in stagger-4">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              How matches were computed
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Inputs, scoring, and per-journal rationale
            </p>
          </div>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          avg {avgMatch}%
        </span>
      </div>

      {/* Stage 1: DETECTED — what we extracted from your abstract */}
      <div className="mb-5">
        <StageBadge n={1} label="What we detected" />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Globe className="h-3 w-3" />
              Domain
            </div>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {analysis.domain}
              {analysis.subfield && (
                <span className="font-normal text-muted-foreground">
                  {' · '}
                  {analysis.subfield}
                </span>
              )}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              Matching topics
            </div>
            {sortedTopics.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {sortedTopics.slice(0, 6).map(([topic, freq]) => (
                  <span
                    key={topic}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                      freq >= 2
                        ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                        : 'border-cyan-500/25 bg-cyan-500/5 text-cyan-400',
                    )}
                    title={`Matched in ${freq} journal${freq > 1 ? 's' : ''}`}
                  >
                    {topic}
                    {freq > 1 && (
                      <span className="rounded bg-cyan-500/20 px-1 text-[9px] font-bold">
                        ×{freq}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                No keyword overlap — matched on semantic similarity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stage 2: HOW MATCHED — algorithm composition */}
      <div className="mb-5">
        <StageBadge n={2} label="Scoring composition" />
        <div className="mt-2 rounded-lg border border-border/60 bg-secondary/20 p-3">
          {composition.length > 0 ? (
            <>
              <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-secondary/60">
                {composition.map((c) => (
                  <div
                    key={c.type}
                    className={cn('h-full transition-all duration-700', c.color)}
                    style={{ width: `${c.pct}%` }}
                    title={`${c.label}: ${c.pct.toFixed(0)}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
                {composition.map((c) => (
                  <div key={c.type} className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', c.color)} />
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {c.pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 border-t border-border/40 pt-2 text-[10px] leading-relaxed text-muted-foreground/80">
                Score = 70% semantic similarity (sentence embeddings) + 30%
                rule-based (domain, keyword and methodology overlap), then
                normalized to a 55–95 range.
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Matched purely on dense embedding similarity.
            </p>
          )}
        </div>
      </div>

      {/* Stage 3: SELECTED — per-journal rationale */}
      <div>
        <StageBadge n={3} label="Per-journal rationale" />
        <ul className="mt-2 space-y-2">
          {journals.map((journal, i) => {
            const rank = i + 1
            const signals = parseSignals(journal.reason)
            const score = journal.match_score ?? 0

            return (
              <li
                key={i}
                className="rounded-lg border border-border/40 bg-background/30 p-3 transition-colors hover:border-primary/30"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold',
                      RANK_BADGES[rank] ?? RANK_BADGES[3],
                    )}
                  >
                    #{rank}
                  </span>
                  <p className="flex-1 truncate text-sm font-medium text-foreground">
                    {journal.name}
                  </p>
                  <span className="text-xs font-bold tabular-nums text-foreground">
                    {score}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {signals.map((s, si) => (
                    <SignalChip key={si} signal={s} />
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Quality footer */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/40 pt-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          {q1Count}/{journals.length} indexed Q1
        </span>
        {avgIf && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            avg IF {avgIf}
          </span>
        )}
        {totalWorks > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            {fmtWorks(totalWorks)} works indexed
          </span>
        )}
      </div>
    </div>
  )
}

interface ReviewerData {
  decision: string
  confidence: number
  summary: string
  strengths: string[]
  weaknesses: string[]
}

function decisionStyle(decision: string) {
  const d = (decision || '').toLowerCase()
  if (d.includes('accept')) {
    return {
      label: 'Accept',
      icon: ThumbsUp,
      chip: 'border-green-500/40 bg-green-500/15 text-green-400',
      ring: 'ring-green-500/30',
      accent: 'text-green-400',
    }
  }
  if (d.includes('revis') || d.includes('major') || d.includes('minor')) {
    return {
      label: decision || 'Revise',
      icon: RotateCw,
      chip: 'border-amber-500/40 bg-amber-500/15 text-amber-400',
      ring: 'ring-amber-500/30',
      accent: 'text-amber-400',
    }
  }
  if (d.includes('reject')) {
    return {
      label: 'Reject',
      icon: ThumbsDown,
      chip: 'border-red-500/40 bg-red-500/15 text-red-400',
      ring: 'ring-red-500/30',
      accent: 'text-red-400',
    }
  }
  return {
    label: decision || 'Pending',
    icon: X,
    chip: 'border-slate-500/40 bg-slate-500/15 text-slate-400',
    ring: 'ring-slate-500/30',
    accent: 'text-slate-400',
  }
}

function ReviewerCard({ review }: { review: ReviewerData }) {
  const style = decisionStyle(review.decision)
  const DecisionIcon = style.icon
  const confidence = Math.max(0, Math.min(100, Math.round(review.confidence ?? 0)))

  return (
    <div className="glass rounded-2xl border border-border p-6 opacity-0 animate-fade-in stagger-1">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Editorial Review</h3>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1',
              style.chip,
              style.ring,
            )}
          >
            <DecisionIcon className="h-3.5 w-3.5" />
            {style.label}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Confidence
            </span>
            <span className={cn('text-lg font-bold tabular-nums', style.accent)}>
              {confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-out',
            confidence >= 70
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : confidence >= 50
              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
              : 'bg-gradient-to-r from-red-400 to-rose-500',
          )}
          style={{ width: `${confidence}%` }}
        />
      </div>

      {/* Summary as a quote */}
      {review.summary && (
        <div className="mb-6 rounded-xl border border-border/60 bg-secondary/30 p-4">
          <Quote className="h-3 w-3 text-muted-foreground/60" />
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {review.summary}
          </p>
        </div>
      )}

      {/* Strengths / Weaknesses */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/15">
              <ThumbsUp className="h-3.5 w-3.5 text-green-400" />
            </div>
            <h4 className="text-sm font-semibold text-green-400">
              Strengths
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({review.strengths.length})
              </span>
            </h4>
          </div>
          {review.strengths.length > 0 ? (
            <ul className="space-y-2">
              {review.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No strengths flagged</p>
          )}
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15">
              <ThumbsDown className="h-3.5 w-3.5 text-red-400" />
            </div>
            <h4 className="text-sm font-semibold text-red-400">
              Weaknesses
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({review.weaknesses.length})
              </span>
            </h4>
          </div>
          {review.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {review.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span className="text-foreground/90">{w}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No weaknesses flagged</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ResultsPanel({ analysis, setAnalysis, abstract }: ResultsPanelProps) {
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

  const handleReAnalyze = async (newAbstract: string) => {
    try {
      // ✅ store old score BEFORE update
      if (analysis?.acceptance_probability) {
        setPreviousScore(analysis.acceptance_probability)
      }

      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstract: newAbstract }),
      })

      if (res.ok) {
        const data = await res.json()
        setAnalysis(data.analysis)
      }
    } catch (err) {
      console.error("Re-analysis failed", err)
    }
  }

const acceptanceProbability = Number(analysis.acceptance_probability ?? 0)

const [previousScore, setPreviousScore] = useState<number | null>(null)

useEffect(() => {
  if (analysis?.acceptance_probability) {
    setPreviousScore((prev) => {
      if (prev === null) return analysis.acceptance_probability
      return prev
    })
  }
}, [analysis])

const topJournal =
  Array.isArray(analysis.journals) && analysis.journals.length > 0
    ? analysis.journals[0].name
    : 'relevant journals'

const hasMethod =
  analysis.score_breakdown?.some(
    i => i.metric.toLowerCase().includes('technical')
  ) ?? false

const hasResults =
  analysis.score_breakdown?.some(
    i => i.metric.toLowerCase().includes('result')
  ) ?? false

const hasExp =
  analysis.score_breakdown?.some(
    i => i.metric.toLowerCase().includes('experiment')
  ) ?? false

const keyInsight = `
This research demonstrates ${
  acceptanceProbability >= 80
    ? 'strong publication readiness'
    : acceptanceProbability >= 60
    ? 'promising publication potential'
    : 'limited publication readiness'
} in the domain of ${analysis.domain}.

The paper ${
  hasMethod
    ? 'includes structured methodological elements'
    : 'requires stronger methodological clarity'
} and ${
  hasResults
    ? 'provides measurable research outcomes'
    : 'lacks strong quantitative validation'
}.

${
  acceptanceProbability >= 75
    ? 'The work aligns well with high-impact journal expectations.'
    : 'Further refinement could significantly improve journal fit and acceptance probability.'
}
`
return (
    <div className="space-y-6 opacity-0 animate-slide-up">
      {/* Summary */}
      <div className="rounded-2xl border border-border/60 bg-background/40 p-6 opacity-0 animate-fade-in stagger-0">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
            <Quote className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Summary</h3>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">
                {analysis.domain}
                {analysis.subfield ? ` · ${analysis.subfield}` : ''}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{keyInsight}</p>
          </div>
        </div>
      </div>

      {/* AI Reviewer Feedback */}
      {analysis.review && <ReviewerCard review={analysis.review} />}

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

      {/* Acceptance Probability (slim hero) */}
      <div className="rounded-2xl border border-border/60 bg-background/40 p-6 opacity-0 animate-fade-in stagger-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Acceptance probability
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Estimated from top journal fit and abstract signals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {previousScore !== null && acceptanceProbability > previousScore && (
              <span className="text-xs text-green-400">
                ↑ +{acceptanceProbability - previousScore}%
              </span>
            )}
            {previousScore !== null && acceptanceProbability < previousScore && (
              <span className="text-xs text-red-400">
                ↓ {previousScore - acceptanceProbability}%
              </span>
            )}
            <CircularProgress value={analysis?.acceptance_probability ?? 0} />
          </div>
        </div>
      </div>

            {/* Recommended Journals */}
      {Array.isArray(analysis.journals) && analysis.journals.length > 0 ? (
        <div className="glass rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Recommended journals
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.journals.map((journal, index) => (
              <div
                key={index}
                onClick={() => openJournal(journal)}
                className="cursor-pointer"
              >
                <JournalCard
                  journal={journal}
                  rank={index + 1}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
          No suitable journals found
        </div>
      )}

      {/* Related Papers */}
      {Array.isArray(analysis.related_papers) && analysis.related_papers.length > 0 && (
        <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Related papers
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({analysis.related_papers.length})
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  From OpenAlex
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {analysis.related_papers.map((paper, i) => (
              <RelatedPaperCard key={i} paper={paper} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Why These Journals — aggregate match logic */}
      <WhyTheseJournals analysis={analysis} />

      {/* Improvements */}
      <ImprovementsCard improvements={Array.isArray(analysis.improvements) ? analysis.improvements : []} />

      {/* Submission Readiness & AI Improve */}
      {abstract && (
      <SubmissionReadiness
        abstract={abstract}
        acceptance={acceptanceProbability}
        breakdown={analysis.score_breakdown}
        onReAnalyze={handleReAnalyze} 
      />
      )}
    </div>
  )
}
