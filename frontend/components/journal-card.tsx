'use client'

import {
  ArrowUpRight,
  Crown,
  Medal,
  Award,
  Unlock,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface JournalCardData {
  name: string
  match_score: number
  fit_label?: string
  reason?: string
  impact_factor?: number
  quartile?: string
  publisher?: string
  submission_url?: string
  issn?: string
  homepage_url?: string
  h_index?: number
  two_year_mean_citedness?: number
  is_oa?: boolean
  works_count?: number
}

interface JournalCardProps {
  journal: JournalCardData
  rank: number
}

interface RankStyle {
  label: string
  Icon: typeof Crown
  stripe: string
  borderHover: string
  pillBg: string
  pillText: string
  pillBorder: string
  scoreText: string
}

const RANK_STYLES: Record<number, RankStyle> = {
  1: {
    label: 'Best Match',
    Icon: Crown,
    stripe: 'from-yellow-400 via-amber-400 to-orange-400',
    borderHover: 'hover:border-yellow-500/50 hover:shadow-yellow-500/10',
    pillBg: 'bg-yellow-500/15',
    pillText: 'text-yellow-400',
    pillBorder: 'border-yellow-500/40',
    scoreText: 'text-yellow-400',
  },
  2: {
    label: 'Strong Match',
    Icon: Medal,
    stripe: 'from-slate-300 via-slate-400 to-slate-500',
    borderHover: 'hover:border-slate-300/40 hover:shadow-slate-400/10',
    pillBg: 'bg-slate-400/15',
    pillText: 'text-slate-300',
    pillBorder: 'border-slate-400/40',
    scoreText: 'text-slate-300',
  },
  3: {
    label: 'Good Match',
    Icon: Award,
    stripe: 'from-amber-700 via-orange-700 to-amber-800',
    borderHover: 'hover:border-amber-600/40 hover:shadow-amber-700/10',
    pillBg: 'bg-amber-700/15',
    pillText: 'text-amber-500',
    pillBorder: 'border-amber-700/40',
    scoreText: 'text-amber-500',
  },
}

function getRankStyle(rank: number): RankStyle {
  return RANK_STYLES[rank] ?? RANK_STYLES[3]
}

function fmtCompact(n?: number): string | null {
  if (typeof n !== 'number' || !isFinite(n)) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function bestImpact(j: JournalCardData): { value: number; isLive: boolean } | null {
  if (typeof j.two_year_mean_citedness === 'number') {
    return { value: Number(j.two_year_mean_citedness.toFixed(1)), isLive: true }
  }
  if (typeof j.impact_factor === 'number') {
    return { value: j.impact_factor, isLive: false }
  }
  return null
}

function quartileTone(q?: string): string {
  if (q === 'Q1') return 'border-green-500/40 bg-green-500/10 text-green-400'
  if (q === 'Q2') return 'border-blue-500/40 bg-blue-500/10 text-blue-400'
  if (q === 'Q3') return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
  return 'border-slate-500/40 bg-slate-500/10 text-slate-400'
}

function scoreBarColor(score: number): string {
  if (score >= 85) return 'from-green-400 to-emerald-500'
  if (score >= 70) return 'from-cyan-400 to-blue-500'
  if (score >= 55) return 'from-yellow-400 to-orange-500'
  return 'from-orange-400 to-red-500'
}

export function JournalCard({ journal, rank }: JournalCardProps) {
  const style = getRankStyle(rank)
  const RankIcon = style.Icon
  const href = journal.homepage_url || journal.submission_url
  const impact = bestImpact(journal)
  const works = fmtCompact(journal.works_count)

  // Build secondary stats line (h-index · works · OA)
  const stats: string[] = []
  if (typeof journal.h_index === 'number') stats.push(`h-${journal.h_index}`)
  if (works) stats.push(`${works} works`)

  const handleOpen = () => {
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      role={href ? 'link' : undefined}
      tabIndex={href ? 0 : -1}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (href && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleOpen()
        }
      }}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/50',
        'backdrop-blur-sm transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-xl',
        href && 'cursor-pointer',
        style.borderHover,
      )}
    >
      {/* Rank stripe */}
      <div
        aria-hidden
        className={cn('h-1 w-full bg-gradient-to-r', style.stripe)}
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header: rank pill + score */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
              style.pillBg,
              style.pillText,
              style.pillBorder,
            )}
          >
            <RankIcon className="h-3 w-3" />
            #{rank}
          </span>

          <div className="flex items-baseline gap-1">
            <span className={cn('text-xl font-bold tabular-nums', style.scoreText)}>
              {journal.match_score}
            </span>
            <span className="text-xs text-muted-foreground">% match</span>
          </div>
        </div>

        {/* Match score bar */}
        <div className="h-1 overflow-hidden rounded-full bg-secondary/60">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out',
              scoreBarColor(journal.match_score),
            )}
            style={{ width: `${journal.match_score}%` }}
          />
        </div>

        {/* Hero: Journal name + publisher */}
        <div>
          <h4 className="flex items-start gap-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            <span className="line-clamp-2">{journal.name}</span>
            {href && (
              <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            )}
          </h4>
          {journal.publisher && (
            <p className="mt-1 text-xs text-muted-foreground">
              {journal.publisher}
            </p>
          )}
        </div>

        {/* Quality chips: Q + IF (the two metrics that matter most) */}
        <div className="flex flex-wrap items-center gap-2">
          {journal.quartile && (
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold',
                quartileTone(journal.quartile),
              )}
            >
              {journal.quartile}
            </span>
          )}
          {impact && (
            <span
              className="inline-flex items-baseline gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
              title={impact.isLive ? '2-year mean citedness (OpenAlex, live)' : 'Impact factor'}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-70">IF</span>
              {impact.value}
            </span>
          )}
          {typeof journal.is_oa === 'boolean' && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium',
                journal.is_oa
                  ? 'border-green-500/40 bg-green-500/10 text-green-400'
                  : 'border-border bg-secondary/40 text-muted-foreground',
              )}
            >
              {journal.is_oa ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
              {journal.is_oa ? 'Open Access' : 'Closed'}
            </span>
          )}
        </div>

        {/* Secondary stats line */}
        {stats.length > 0 && (
          <p className="text-[11px] text-muted-foreground/80">
            {stats.join(' · ')}
          </p>
        )}

        {/* Footer: ISSN + click hint */}
        <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-3">
          <span className="font-mono text-[10px] tracking-tight text-muted-foreground/70">
            {journal.issn ? `ISSN ${journal.issn}` : ' '}
          </span>
          {href && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              Open
              <ArrowUpRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
