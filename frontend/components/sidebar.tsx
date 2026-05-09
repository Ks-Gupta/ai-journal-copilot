'use client'

import { FileText, History, Settings, Sparkles, Moon, Sun, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isDark: boolean
  onThemeToggle: () => void
  onLogoClick: () => void
}

const menuItems = [
  { id: 'analyze', label: 'Analyze Paper', icon: FileText },
  { id: 'batch', label: 'Batch Analyze', icon: Layers },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ activeTab, onTabChange, isDark, onThemeToggle, onLogoClick }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo - clickable to return to landing */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-3 px-6 py-6 transition-opacity hover:opacity-80"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <h1 className="font-semibold text-sidebar-foreground">AI Journal Copilot</h1>
          <p className="text-xs text-muted-foreground">Research Assistant</p>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* User Profile & Theme Toggle */}
      <div className="border-t border-border">
        <div className="space-y-0.5 p-4">
          {/* User Profile - Hover Card */}
          <div className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer hover:shadow-sm">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 font-semibold text-white shadow-lg shadow-cyan-400/20">
              K
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">Khushi Gupta</span>
              <span className="text-xs text-muted-foreground truncate">Student Researcher</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onThemeToggle}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </div>
    </aside>
  )
}
