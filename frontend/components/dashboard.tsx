'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { LandingPage } from '@/components/landing-page'
import { HeroSection } from '@/components/hero-section'
import { InputPanel } from '@/components/input-panel'
import { ResultsPanel } from '@/components/results-panel'
import { ResultsSkeleton } from '@/components/results-skeleton'
import { AIThinking } from '@/components/ai-thinking'
import { HistoryPage } from '@/components/history-page'
import { SettingsPage } from '@/components/settings-page'
import { AlertCircle, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Analysis {
  domain: string
  subfield: string
  journals: { name: string; match_score: number }[]
  acceptance_probability: number
  reasons: string[]
  improvements: string[]
  score_breakdown?: string[]
}

// Mock data for demo purposes (used when API is unavailable)
const MOCK_ANALYSIS: Analysis = {
  domain: "Medical Informatics & Artificial Intelligence",
  subfield: "Ophthalmic Image Analysis & Deep Learning",
  journals: [
    { name: "Nature Medicine", match_score: 87 },
    { name: "The Lancet Digital Health", match_score: 82 },
    { name: "JAMA Ophthalmology", match_score: 76 }
  ],
  acceptance_probability: 72,
  reasons: [
    "Strong methodological approach using transformer architecture aligns with current publication trends",
    "Clear clinical impact statement addressing resource-limited settings appeals to high-impact journals",
    "Quantitative results (97.3% sensitivity, 96.8% specificity) exceed benchmark standards",
    "Novel attention mechanism contributes to the advancement of the field"
  ],
  improvements: [
    "Consider adding comparison with additional state-of-the-art methods beyond baseline",
    "Include external validation dataset to strengthen generalizability claims",
    "Address potential demographic biases in training data",
    "Expand discussion on regulatory pathway for clinical deployment"
  ]
}

interface HistoryItem {
  id: number
  timestamp: string
  abstract: string
  domain: string
  subfield: string
  acceptanceProbability: number
  journals: { name: string; match_score: number }[]
  reasons: string[]
  improvements: string[]
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

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
    
    // Load last analysis from localStorage
    const savedAnalysis = localStorage.getItem('lastAnalysis')
    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

      // ✅ Load history
      useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("analysisHistory") || "[]")
        setHistory(stored)
      }, [])

    useEffect(() => {
      if (analysis) {
        const newItem = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
         abstract: abstract.split(' ').slice(0, 25).join(' ') + '...',
          domain: analysis.domain,
          subfield: analysis.subfield,
          acceptanceProbability: analysis.acceptance_probability,
          journals: analysis.journals,
          reasons: analysis.reasons,
          improvements: analysis.improvements,
        }

        setHistory((prev) => {
          const updated = [newItem, ...prev].slice(0, 20)

          // persist properly
          localStorage.setItem("analysisHistory", JSON.stringify(updated))

          return updated
        })
      }
    }, [analysis])

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
    if (!abstract.trim()) return  

    try {
      setError(null)
      setAnalysis(null)
      setIsLoading(true)

      console.log("ABSTRACT:", abstract)

      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          abstract: abstract,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze abstract")
      }

      const data = await response.json()

      if (data.status === "success" && data.analysis) {
        setAnalysis({
          ...data.analysis,
          acceptanceProbability: data.analysis.acceptance_probability || 0
        })

        localStorage.setItem(
          "lastAnalysis",
          JSON.stringify(data.analysis)
        )
      }else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      console.error(error)
      setError(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectHistoryItem = (item: HistoryItem) => {
    const analysis: Analysis = {
      domain: item.domain,
      subfield: item.subfield,
      journals: item.journals,
      acceptance_probability: item.acceptanceProbability,
      reasons: item.reasons,
      improvements: item.improvements,
    }
    setAnalysis(analysis)
    setActiveTab('analyze')
    setTimeout(() => {
    const resultsElement = document.getElementById('results-section')
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
  }

  // Landing Page Screen
  if (currentScreen === 'landing') {
    return (
      <div className="transition-all duration-300 ease-in-out">
        <LandingPage onStartAnalysis={handleStartAnalysis} />
      </div>
    )
  }

  // Dashboard Screen
  return (
    <div className="flex h-screen overflow-hidden bg-background animate-fade-in">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <button 
            onClick={handleReturnToLanding}
            className="font-semibold hover:text-primary transition-colors"
          >
            AI Journal Copilot
          </button>
          <div className="w-9" /> {/* Spacer for centering */}
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
              />

              {/* AI Thinking Panel */}
              {isThinking && <AIThinking isActive={isThinking} />}

              {/* Error Banner */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 animate-fade-in">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-warning" />
                  <p className="text-sm text-warning">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && !isThinking && <ResultsSkeleton />}

              {/* Results */}
              {!isLoading && analysis && (
                <div id="results-section">
                  <ResultsPanel analysis={analysis} abstract={abstract} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
          <HistoryPage
              history={history}
              onSelectHistory={handleSelectHistoryItem}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage isDark={isDark} onThemeToggle={handleThemeToggle} />
          )}
        </div>
      </main>
    </div>
  )
}
