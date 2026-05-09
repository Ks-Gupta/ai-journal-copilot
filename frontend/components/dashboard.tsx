'use client'

import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '@/components/sidebar'
import { LandingPage } from '@/components/landing-page'
import { HeroSection } from '@/components/hero-section'
import { InputPanel } from '@/components/input-panel'
import { ResultsPanel } from '@/components/results-panel'
import { ResultsSkeleton } from '@/components/results-skeleton'
import { AIThinking } from '@/components/ai-thinking'
import { HistoryPage } from '@/components/history-page'
import { BatchPage } from '@/components/batch-page'
import { SettingsPage } from '@/components/settings-page'
import { AlertCircle, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_URL } from '@/lib/api'

interface Journal {
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
  openalex_id?: string
}

interface Analysis {
  domain: string
  subfield: string
  journals: Journal[]
  acceptance_probability: number
  reasons: string[]
  improvements: string[]

  score_breakdown?: {
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

interface HistoryItem {
  id: string
  timestamp: string
  abstract: string
  domain: string
  subfield: string
  acceptanceProbability: number
  journals: { name: string; match_score: number }[]
  reasons: string[]
  improvements: string[]
  score_breakdown?: Analysis['score_breakdown']
  review?: Analysis['review']
}

export function Dashboard() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'dashboard'>('landing')
  const [activeTab, setActiveTab] = useState('analyze')
  const [isDark, setIsDark] = useState(true)

  const [abstract, setAbstract] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [autoAnalyze, setAutoAnalyze] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const lastAnalyzedRef = useRef<string>('')

  const fetchHistory = async () => {
    setLoadingHistory(true)

    try {
      const res = await fetch(`${API_URL}/history`)
      const data = await res.json()

      if (data.status === 'success') {
        const formatted = data.history.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          timestamp: item.created_at || new Date().toISOString(),
          abstract: item.abstract || 'No abstract',

          domain: item.analysis?.domain || 'N/A',
          subfield: item.analysis?.subfield || 'N/A',

          acceptanceProbability:
            item.analysis?.acceptance_probability || 0,

          journals: item.analysis?.journals || [],
          reasons: item.analysis?.reasons || [],
          improvements: item.analysis?.improvements || [],
          score_breakdown: item.analysis?.score_breakdown,
          review: item.analysis?.review,
        }))

        setHistory(formatted)
      }
    } catch (err) {
      console.error('History fetch error:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Debounced auto-analyze: re-runs when the abstract is stable for 1.5s
  useEffect(() => {
    if (!autoAnalyze) return
    const trimmed = abstract.trim()
    if (trimmed.length < 200) return
    if (trimmed === lastAnalyzedRef.current) return

    const timer = setTimeout(() => {
      handleAnalyze()
    }, 1500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abstract, autoAnalyze])

  const handleThemeToggle = () => {
    setIsDark(!isDark)

    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  const handleStartAnalysis = () => {
    setCurrentScreen('dashboard')
  }

  const handleReturnToLanding = () => {
    setCurrentScreen('landing')
  }

  const handleAnalyze = async () => {
    const trimmed = abstract.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    lastAnalyzedRef.current = trimmed

    try {
      setError(null)
      setAnalysis(null)
      setIsLoading(true)
      setIsThinking(true)

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abstract,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error('Backend error: ' + response.status)
      }

      const data = await response.json()

      if (data.status === 'success' && data.analysis) {
        const formattedAnalysis: Analysis = {
          ...data.analysis,
          acceptance_probability:
            data.analysis.acceptance_probability || 0,
        }

        setAnalysis(formattedAnalysis)

        fetchHistory()

        localStorage.setItem(
          'lastAnalysis',
          JSON.stringify(formattedAnalysis)
        )
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return
      console.error('ERROR:', error)
      setError(error.message || 'Something went wrong')
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
        setIsThinking(false)
      }
    }
  }

  const handleSelectHistoryItem = (item: HistoryItem) => {
    const selectedAnalysis: Analysis = {
      domain: item.domain,
      subfield: item.subfield,
      journals: item.journals,
      acceptance_probability: item.acceptanceProbability,
      reasons: item.reasons,
      improvements: item.improvements,
      score_breakdown: item.score_breakdown ?? [],
      review: item.review,
    }

    setAnalysis(selectedAnalysis)

    setActiveTab('analyze')

    setTimeout(() => {
      const resultsElement = document.getElementById('results-section')

      if (resultsElement) {
        resultsElement.scrollIntoView({
          behavior: 'smooth',
        })
      }
    }, 100)
  }

  if (currentScreen === 'landing') {
    return (
      <div className="transition-all duration-300 ease-in-out">
        <LandingPage onStartAnalysis={handleStartAnalysis} />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background animate-fade-in">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setSidebarOpen(false)
          }}
          isDark={isDark}
          onThemeToggle={handleThemeToggle}
          onLogoClick={handleReturnToLanding}
        />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          <button
            onClick={handleReturnToLanding}
            className="font-semibold hover:text-primary transition-colors"
          >
            AI Journal Copilot
          </button>

          <div className="w-9" />
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          <HeroSection />

          {activeTab === 'analyze' && (
            <div className="space-y-8">
              <InputPanel
                abstract={abstract}
                onAbstractChange={setAbstract}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                autoAnalyze={autoAnalyze}
                onAutoAnalyzeChange={setAutoAnalyze}
              />

              {isThinking && (
                <AIThinking isActive={isThinking} />
              )}

              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 animate-fade-in">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning" />

                  <p className="text-sm text-warning">{error}</p>
                </div>
              )}

              {isLoading && !isThinking && (
                <ResultsSkeleton />
              )}

              {!isLoading && analysis && (
                <div id="results-section">
                  <ResultsPanel
                    analysis={analysis}
                    setAnalysis={setAnalysis}
                    abstract={abstract}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'batch' && <BatchPage />}

          {activeTab === 'history' && (
            <>
              {loadingHistory && <p>Loading history...</p>}

              {!loadingHistory &&
                history.length === 0 && (
                  <p>No history yet</p>
                )}

              {!loadingHistory &&
                history.length > 0 && (
                  <HistoryPage
                    history={history}
                    onSelectHistory={
                      handleSelectHistoryItem
                    }
                  />
                )}
            </>
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              isDark={isDark}
              onThemeToggle={handleThemeToggle}
            />
          )}
        </div>
      </main>
    </div>
  )
}