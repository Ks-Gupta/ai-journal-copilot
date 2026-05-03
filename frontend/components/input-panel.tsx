'use client'

import { useState } from 'react'
import { Sparkles, Trash2, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface InputPanelProps {
  abstract: string
  onAbstractChange: (value: string) => void
  onAnalyze: () => void
  isLoading: boolean
}

const EXAMPLE_ABSTRACT = `This study investigates the application of transformer-based neural networks for automated detection of diabetic retinopathy in fundus images. We propose a novel attention mechanism that focuses on clinically relevant regions of the retina, achieving state-of-the-art performance on benchmark datasets. Our model demonstrates 97.3% sensitivity and 96.8% specificity, outperforming existing methods while requiring significantly less computational resources. The findings suggest that AI-assisted screening could substantially improve early detection rates in resource-limited settings, potentially preventing vision loss in millions of patients worldwide.`

const MAX_CHARS = 5000

export function InputPanel({ abstract, onAbstractChange, onAnalyze, isLoading }: InputPanelProps) {
  const charCount = abstract.length
  const charPercentage = (charCount / MAX_CHARS) * 100

  const handleTryExample = () => {
    onAbstractChange(EXAMPLE_ABSTRACT)
  }

  const handleClear = () => {
    onAbstractChange('')
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Research Abstract</h2>
          <p className="text-sm text-muted-foreground">
            Paste your paper abstract to get AI-powered journal recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTryExample}
            disabled={isLoading}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
            Try Example
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isLoading || !abstract}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="relative">
        <Textarea
          placeholder="Paste your research abstract here..."
          value={abstract}
          onChange={(e) => onAbstractChange(e.target.value)}
          disabled={isLoading}
          className="min-h-[200px] resize-none rounded-xl border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
          maxLength={MAX_CHARS}
        />
        
        {/* Character counter */}
        <div className="mt-2 flex items-center justify-between">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(charPercentage, 100)}%` }}
            />
          </div>
          <span className={`ml-3 text-xs font-medium ${charCount > MAX_CHARS * 0.9 ? 'text-warning' : 'text-muted-foreground'}`}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={onAnalyze}
          disabled={isLoading || !abstract.trim()}
          size="lg"
          className="group relative overflow-hidden rounded-xl bg-primary px-8 py-6 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
                Analyze Abstract
              </>
            )}
          </span>
          {!isLoading && (
            <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          )}
        </Button>
      </div>
    </div>
  )
}
