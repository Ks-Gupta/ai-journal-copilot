'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

const THINKING_MESSAGES = [
  'Analyzing research domain...',
  'Examining methodology and novelty...',
  'Matching journals to your paper...',
  'Evaluating acceptance probability...',
  'Analyzing publication impact...',
  'Generating improvement suggestions...',
  'Finalizing recommendations...',
]

interface AIThinkingProps {
  isActive: boolean
}

export function AIThinking({ isActive }: AIThinkingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    if (!isActive) {
      setCurrentMessageIndex(0)
      setDisplayedText('')
      return
    }

    const message = THINKING_MESSAGES[currentMessageIndex]
    let charIndex = 0

    const typingTimer = setInterval(() => {
      if (charIndex < message.length) {
        setDisplayedText(message.substring(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typingTimer)
        // Move to next message after a delay
        const nextMessageTimer = setTimeout(() => {
          setCurrentMessageIndex((prev) => (prev + 1) % THINKING_MESSAGES.length)
          setDisplayedText('')
        }, 1500)
        return () => clearTimeout(nextMessageTimer)
      }
    }, 50)

    return () => clearInterval(typingTimer)
  }, [currentMessageIndex, isActive])

  if (!isActive) return null

  return (
    <div className="glass rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-8 animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Glowing AI Orb */}
        <div className="relative flex-shrink-0">
          <div className="relative h-12 w-12">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-pulse" />
            
            {/* Middle ring with slower pulse */}
            <div className="absolute inset-2 rounded-full border border-primary/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
            
            {/* Inner glowing orb */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/50" />
            
            {/* Center glow */}
            <div className="absolute inset-4 rounded-full bg-white/20 blur" />
          </div>
        </div>

        {/* Thinking Messages */}
        <div className="flex-1 pt-1">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-semibold text-primary">AI is Analyzing</h3>
            <div className="flex gap-1">
              <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <span className="h-1 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="h-1 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>

          {/* Typing Text */}
          <p className="text-sm text-muted-foreground">
            <span className="block min-h-5">
              {displayedText}
              {displayedText.length > 0 && displayedText.length < THINKING_MESSAGES[currentMessageIndex].length && (
                <span className="ml-1 animate-pulse">▊</span>
              )}
            </span>
          </p>

          {/* Progress Bar */}
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent animate-pulse"
              style={{
                width: `${((currentMessageIndex + 1) / THINKING_MESSAGES.length) * 100}%`,
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
