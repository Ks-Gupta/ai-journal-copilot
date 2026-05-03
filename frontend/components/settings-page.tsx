'use client'

import { useState } from 'react'
import { Palette, Zap, BarChart3, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface SettingsPageProps {
  isDark: boolean
  onThemeToggle: () => void
}

export function SettingsPage({ isDark, onThemeToggle }: SettingsPageProps) {
  const [settings, setSettings] = useState({
    aiModel: 'gpt-4',
    responseStyle: 'balanced',
    showExtraMetrics: true,
    includeSuggestions: true,
    emailAlerts: false,
  })

  const handleSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      {/* Appearance Settings */}
      <div className="glass rounded-2xl border border-border p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-foreground">Appearance</h3>
            <p className="text-sm text-muted-foreground">
              Customize the look and feel of your workspace
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme" className="text-sm font-medium text-foreground">
              Dark Mode
            </Label>
            <Switch
              id="theme"
              checked={isDark}
              onCheckedChange={onThemeToggle}
              className="transition-all duration-300"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Toggle between light and dark theme with smooth transitions
          </p>
        </div>
      </div>

      {/* AI Preferences */}
      <div className="glass rounded-2xl border border-border p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Zap className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-foreground">AI Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Configure how AI analyzes your research papers
            </p>
          </div>
        </div>

        <div className="space-y-5 border-t border-border pt-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm font-medium text-foreground">
              Language Model
            </Label>
            <Select value={settings.aiModel} onValueChange={(value) => handleSetting('aiModel', value)}>
              <SelectTrigger id="model" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 (Most Advanced)</SelectItem>
                <SelectItem value="gpt-3.5">GPT-3.5 (Balanced)</SelectItem>
                <SelectItem value="claude">Claude (Alternative)</SelectItem>
                <SelectItem value="groq">Groq (Fast)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Higher-tier models provide more detailed analysis but may be slower
            </p>
          </div>

          {/* Response Style */}
          <div className="space-y-2">
            <Label htmlFor="style" className="text-sm font-medium text-foreground">
              Response Style
            </Label>
            <Select value={settings.responseStyle} onValueChange={(value) => handleSetting('responseStyle', value)}>
              <SelectTrigger id="style" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise (Quick summaries)</SelectItem>
                <SelectItem value="balanced">Balanced (Detailed but clear)</SelectItem>
                <SelectItem value="detailed">Detailed (Comprehensive analysis)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how verbose you want AI recommendations to be
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Preferences */}
      <div className="glass rounded-2xl border border-border p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50">
            <BarChart3 className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-foreground">Analysis Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Control what metrics and features are displayed
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="metrics" className="text-sm font-medium text-foreground">
              Show Advanced Metrics
            </Label>
            <Switch
              id="metrics"
              checked={settings.showExtraMetrics}
              onCheckedChange={(value) => handleSetting('showExtraMetrics', value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Display additional statistical analysis and confidence indicators
          </p>

          <div className="h-px bg-border my-4" />

          <div className="flex items-center justify-between">
            <Label htmlFor="suggestions" className="text-sm font-medium text-foreground">
              Include Improvement Suggestions
            </Label>
            <Switch
              id="suggestions"
              checked={settings.includeSuggestions}
              onCheckedChange={(value) => handleSetting('includeSuggestions', value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Get AI-powered recommendations to strengthen your manuscript
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass rounded-2xl border border-border p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <Bell className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Manage how and when you receive updates
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Alerts
            </Label>
            <Switch
              id="email"
              checked={settings.emailAlerts}
              onCheckedChange={(value) => handleSetting('emailAlerts', value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Receive email notifications for analysis results and important updates
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button className="flex-1 h-11 rounded-xl font-medium">
          Save Settings
        </Button>
        <Button variant="outline" className="flex-1 h-11 rounded-xl font-medium">
          Reset to Defaults
        </Button>
      </div>

      {/* Footer Note */}
      <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Your preferences are automatically saved and synced across devices
        </p>
      </div>
    </div>
  )
}
