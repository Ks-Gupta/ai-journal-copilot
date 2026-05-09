'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PIPELINE_STEPS = [
  'Extracting research domain',
  'Evaluating methodology',
  'Matching journal scope',
  'Computing acceptance probability',
  'Generating reviewer feedback',
]

const STEP_DURATION_MS = 900

interface AIThinkingProps {
  isActive: boolean
}

export function AIThinking({ isActive }: AIThinkingProps) {
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setCompleted(0)
      return
    }

    let step = 0
    const interval = setInterval(() => {
      step += 1
      // Hold at the last step until isActive flips off — analysis may still be running
      setCompleted(Math.min(step, PIPELINE_STEPS.length - 1))
      if (step >= PIPELINE_STEPS.length - 1) {
        clearInterval(interval)
      }
    }, STEP_DURATION_MS)

    return () => clearInterval(interval)
  }, [isActive])

  if (!isActive) return null

  const progress = ((completed + 1) / PIPELINE_STEPS.length) * 100

  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-6 animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="font-semibold text-foreground">Analyzing</h3>
        <div className="flex gap-1">
          <span className="h-1 w-1 rounded-full bg-muted-foreground animate-pulse" />
          <span
            className="h-1 w-1 rounded-full bg-muted-foreground animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
          <span
            className="h-1 w-1 rounded-full bg-muted-foreground animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>

      <ul className="space-y-2.5">
        {PIPELINE_STEPS.map((step, i) => {
          const done = i < completed
          const active = i === completed
          return (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 text-sm transition-all duration-300',
                done
                  ? 'text-foreground'
                  : active
                  ? 'text-foreground'
                  : 'text-muted-foreground/60'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors',
                  done
                    ? 'border-green-500/50 bg-green-500/15 text-green-400'
                    : active
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-border bg-secondary/40 text-muted-foreground/40'
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : active ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={cn(active && 'font-medium')}>{step}</span>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent"
          style={{
            width: `${progress}%`,
            transition: 'width 0.5s ease-out',
          }}
        />
      </div>
    </div>
  )
}
