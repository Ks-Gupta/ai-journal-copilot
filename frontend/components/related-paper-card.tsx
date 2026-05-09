'use client'

import { ArrowUpRight, Quote, TrendingUp, Unlock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RelatedPaperData {
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

interface Props {
  paper: RelatedPaperData
  index: number
}

function fmtCites(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function authorsLine(paper: RelatedPaperData): string {
  const visible = paper.authors.slice(0, 3)
  const total = paper.total_authors ?? paper.authors.length
  const extra = Math.max(0, total - visible.length)
  if (visible.length === 0) return 'Unknown authors'
  return extra > 0
    ? `${visible.join(', ')} · +${extra} more`
    : visible.join(', ')
}

function citationTier(n?: number): {
  label: string
  className: string
} | null {
  if (typeof n !== 'number') return null
  if (n >= 1000) {
    return {
      label: `${fmtCites(n)} citations`,
      className: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    }
  }
  if (n >= 100) {
    return {
      label: `${fmtCites(n)} citations`,
      className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    }
  }
  if (n >= 10) {
    return {
      label: `${n} citations`,
      className: 'border-primary/30 bg-primary/10 text-primary',
    }
  }
  if (n > 0) {
    return {
      label: `${n} citation${n === 1 ? '' : 's'}`,
      className: 'border-border bg-secondary/40 text-muted-foreground',
    }
  }
  return null
}

export function RelatedPaperCard({ paper, index }: Props) {
  const href = paper.preferred_url || paper.url
  const cites = citationTier(paper.citation_count)

  const handleOpen = () => {
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <article
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
        'group relative flex gap-4 rounded-xl border border-border/60 bg-background/40 p-4',
        'transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
        href && 'cursor-pointer',
      )}
    >
      {/* Index badge */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-xs font-bold text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary">
          {index + 1}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Title */}
        <h4 className="flex items-start gap-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          <span className="line-clamp-2">{paper.title}</span>
          {href && (
            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary group-hover:opacity-100" />
          )}
        </h4>

        {/* Authors */}
        <p className="text-xs text-muted-foreground/90">
          {authorsLine(paper)}
        </p>

        {/* Venue + Year */}
        {(paper.venue || paper.year) && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
            {paper.year && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {paper.year}
              </span>
            )}
            {paper.venue && (
              <>
                {paper.year && <span className="opacity-50">·</span>}
                <span className="line-clamp-1 italic">{paper.venue}</span>
              </>
            )}
          </div>
        )}

        {/* Abstract preview */}
        {paper.abstract && (
          <div className="mt-1 flex gap-2 rounded-md border-l-2 border-border bg-secondary/20 px-2.5 py-1.5">
            <Quote className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/80">
              {paper.abstract}
            </p>
          </div>
        )}

        {/* Footer chips */}
        {(cites || paper.is_oa) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {cites && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium',
                  cites.className,
                )}
              >
                <TrendingUp className="h-2.5 w-2.5" />
                {cites.label}
              </span>
            )}
            {paper.is_oa && (
              <span className="inline-flex items-center gap-1 rounded-md border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                <Unlock className="h-2.5 w-2.5" />
                Open Access
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
