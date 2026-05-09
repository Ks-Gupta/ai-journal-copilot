'use client'

import { useState } from 'react'
import { Plus, Trash2, Layers, Loader2, Check, AlertCircle, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { API_URL } from '@/lib/api'

type Status = 'pending' | 'running' | 'success' | 'error'

interface BatchItem {
  id: string
  abstract: string
  status: Status
  error?: string
  result?: {
    domain: string
    subfield: string
    acceptance_probability: number
    top_journal?: { name: string; match_score: number; quartile?: string }
    paper_count: number
  }
}

const SAMPLES = [
  'We investigate thermal management in internal combustion engines under high-load conditions, validated through CFD simulation and engine dyno testing.',
  'We present a microservices architecture for cloud-native applications, evaluating scalability under Kubernetes orchestration on a 10k req/sec workload.',
  'We develop a graph neural network for protein-protein interaction prediction across 18 species, achieving AUROC 0.94 on STRING and BioGRID.',
]

function newItem(text = ''): BatchItem {
  return {
    id: crypto.randomUUID(),
    abstract: text,
    status: 'pending',
  }
}

export function BatchPage() {
  const [items, setItems] = useState<BatchItem[]>([newItem(), newItem(), newItem()])
  const [running, setRunning] = useState(false)

  const updateItem = (id: string, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const addItem = () => setItems((prev) => [...prev, newItem()])

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev))
  }

  const loadSamples = () => {
    setItems(SAMPLES.map((s) => newItem(s)))
  }

  const reset = () => {
    setItems((prev) =>
      prev.map((it) => ({ ...it, status: 'pending' as Status, error: undefined, result: undefined })),
    )
  }

  const analyzeOne = async (item: BatchItem) => {
    if (!item.abstract.trim()) {
      updateItem(item.id, { status: 'error', error: 'empty abstract' })
      return
    }

    updateItem(item.id, { status: 'running', error: undefined, result: undefined })

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstract: item.abstract }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      const a = data.analysis

      updateItem(item.id, {
        status: 'success',
        result: {
          domain: a.domain,
          subfield: a.subfield,
          acceptance_probability: a.acceptance_probability,
          top_journal: a.journals?.[0]
            ? {
                name: a.journals[0].name,
                match_score: a.journals[0].match_score,
                quartile: a.journals[0].quartile,
              }
            : undefined,
          paper_count: (a.related_papers ?? []).length,
        },
      })
    } catch (e: any) {
      updateItem(item.id, { status: 'error', error: e.message ?? 'failed' })
    }
  }

  const runAll = async () => {
    setRunning(true)
    reset()
    // Sequential to avoid overwhelming OpenAlex / LLM
    for (const it of items) {
      // eslint-disable-next-line no-await-in-loop
      await analyzeOne(it)
    }
    setRunning(false)
  }

  const filled = items.filter((it) => it.abstract.trim().length > 0).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Batch Analyze</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Run multiple abstracts through the pipeline at once. Each is sent through{' '}
            <code className="text-xs">/analyze</code> and the result row updates as it completes.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSamples} disabled={running}>
            Load samples
          </Button>
          <Button variant="outline" size="sm" onClick={addItem} disabled={running}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <Button
            size="sm"
            onClick={runAll}
            disabled={running || filled === 0}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Running...' : `Analyze ${filled}`}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <BatchRow
            key={item.id}
            index={idx}
            item={item}
            onChange={(text) => updateItem(item.id, { abstract: text })}
            onRemove={() => removeItem(item.id)}
            disabled={running}
          />
        ))}
      </div>
    </div>
  )
}

function BatchRow({
  index,
  item,
  onChange,
  onRemove,
  disabled,
}: {
  index: number
  item: BatchItem
  onChange: (text: string) => void
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <div
      className={cn(
        'glass rounded-xl border border-border p-4 transition-colors',
        item.status === 'running' && 'border-primary/40',
        item.status === 'success' && 'border-green-500/30',
        item.status === 'error' && 'border-red-500/30',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-2 pt-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-secondary/40 text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>
          <StatusIcon status={item.status} />
        </div>

        <div className="flex-1 space-y-2">
          <textarea
            value={item.abstract}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste an abstract..."
            disabled={disabled}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background/40 p-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary/50 disabled:opacity-60"
          />

          {item.status === 'success' && item.result && <ResultRow result={item.result} />}
          {item.status === 'error' && (
            <p className="text-xs text-red-400">{item.error}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="text-muted-foreground hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'running') {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" />
  }
  if (status === 'success') {
    return <Check className="h-4 w-4 text-green-400" />
  }
  if (status === 'error') {
    return <AlertCircle className="h-4 w-4 text-red-400" />
  }
  return <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
}

function ResultRow({ result }: { result: NonNullable<BatchItem['result']> }) {
  return (
    <div className="rounded-lg border border-border bg-background/30 p-3">
      <div className="grid gap-2 text-xs sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Domain</p>
          <p className="font-medium text-foreground">
            {result.domain}
            {result.subfield ? <span className="text-muted-foreground"> · {result.subfield}</span> : null}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Acceptance</p>
          <p className="font-medium text-foreground">{result.acceptance_probability}%</p>
        </div>
        <div className="sm:col-span-1">
          <p className="text-muted-foreground">Top journal</p>
          {result.top_journal ? (
            <p className="font-medium text-foreground">
              {result.top_journal.name}
              <span className="ml-1 text-muted-foreground">
                · {result.top_journal.match_score}%
                {result.top_journal.quartile ? ` · ${result.top_journal.quartile}` : ''}
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground">Related papers</p>
          <p className="font-medium text-foreground">{result.paper_count}</p>
        </div>
      </div>
    </div>
  )
}
