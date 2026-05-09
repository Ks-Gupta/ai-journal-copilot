'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Beaker,
  BookText,
  CheckCircle2,
  Circle,
  FlaskConical,
  Lightbulb,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  improvements: string[]
}

interface Category {
  label: string
  Icon: typeof Beaker
  className: string
  iconClass: string
}

const COMPARISON: Category = {
  label: 'Comparison',
  Icon: BarChart3,
  className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  iconClass: 'text-cyan-400 bg-cyan-500/15',
}
const VALIDATION: Category = {
  label: 'Validation',
  Icon: TrendingUp,
  className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  iconClass: 'text-emerald-400 bg-emerald-500/15',
}
const EXPERIMENTS: Category = {
  label: 'Experiments',
  Icon: FlaskConical,
  className: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  iconClass: 'text-purple-400 bg-purple-500/15',
}
const DISCUSSION: Category = {
  label: 'Discussion',
  Icon: MessageSquare,
  className: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  iconClass: 'text-amber-400 bg-amber-500/15',
}
const LITERATURE: Category = {
  label: 'Literature',
  Icon: BookText,
  className: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  iconClass: 'text-blue-400 bg-blue-500/15',
}
const ABLATION: Category = {
  label: 'Ablation',
  Icon: Beaker,
  className: 'border-pink-500/40 bg-pink-500/10 text-pink-400',
  iconClass: 'text-pink-400 bg-pink-500/15',
}
const GENERIC: Category = {
  label: 'Suggestion',
  Icon: Lightbulb,
  className: 'border-warning/40 bg-warning/10 text-warning',
  iconClass: 'text-warning bg-warning/15',
}

function categorize(text: string): Category {
  const t = text.toLowerCase()
  if (/\b(benchmark|compare|comparative|prior\s+work|state[\s-]of[\s-]the[\s-]art|baseline)\b/.test(t)) {
    return COMPARISON
  }
  if (/\b(statistical|significance|p[\s-]value|confidence\s+interval|standard\s+deviation|metric)\b/.test(t)) {
    return VALIDATION
  }
  if (/\b(ablation|isolate|each\s+component|contribution\s+of)\b/.test(t)) {
    return ABLATION
  }
  if (/\b(experiment|dataset|evaluation|evaluate|empirical|test\s+set)\b/.test(t)) {
    return EXPERIMENTS
  }
  if (/\b(scalab|limitation|threats?\s+to\s+validity|discuss|future\s+work|generaliz)\b/.test(t)) {
    return DISCUSSION
  }
  if (/\b(related\s+work|citation|reference|cite|literature)\b/.test(t)) {
    return LITERATURE
  }
  return GENERIC
}

export function ImprovementsCard({ improvements }: Props) {
  const [done, setDone] = useState<Set<number>>(new Set())

  const items = useMemo(
    () =>
      improvements.map((text, i) => ({
        text,
        category: categorize(text),
        index: i,
      })),
    [improvements],
  )

  const toggleDone = (i: number) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const total = items.length
  const completed = done.size
  const allDone = total > 0 && completed === total
  const progress = total > 0 ? (completed / total) * 100 : 0

  if (total === 0) {
    return (
      <div className="glass rounded-2xl border border-border/60 p-6 opacity-0 animate-fade-in stagger-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Suggested Improvements
          </h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          No improvements suggested
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl border border-border/60 p-6 opacity-0 animate-fade-in stagger-5">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Suggested Improvements
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {total} actionable {total === 1 ? 'step' : 'steps'} to strengthen
              your submission
            </p>
          </div>
        </div>

        {/* Completion pill */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
            allDone
              ? 'border-green-500/40 bg-green-500/10 text-green-400'
              : completed > 0
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground',
          )}
        >
          {allDone && <CheckCircle2 className="h-3 w-3" />}
          {completed}/{total} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-secondary/60">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            allDone
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-cyan-400 to-blue-500',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      <ul className="space-y-2">
        {items.map(({ text, category, index }) => {
          const isDone = done.has(index)
          const Icon = category.Icon
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => toggleDone(index)}
                className={cn(
                  'group flex w-full items-start gap-3 rounded-lg border bg-background/30 p-3 text-left transition-all duration-200',
                  'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm',
                  isDone
                    ? 'border-green-500/30 bg-green-500/5 opacity-60'
                    : 'border-border/40',
                )}
              >
                {/* Number / check */}
                <div
                  className={cn(
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors',
                    isDone
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-secondary/60 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary',
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <p
                    className={cn(
                      'text-sm leading-relaxed text-foreground',
                      isDone && 'line-through decoration-green-500/50',
                    )}
                  >
                    {text}
                  </p>
                  <span
                    className={cn(
                      'inline-flex w-fit items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                      category.className,
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {category.label}
                  </span>
                </div>

                {/* Empty/checked icon on right */}
                <div
                  className={cn(
                    'mt-1 flex-shrink-0 transition-colors',
                    isDone ? 'text-green-400' : 'text-muted-foreground/30 group-hover:text-primary/60',
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Footer hint */}
      <p className="mt-4 border-t border-border/40 pt-3 text-[11px] text-muted-foreground/80">
        Apply changes to your abstract and re-analyze to see the impact on
        readiness scores.
      </p>
    </div>
  )
}
