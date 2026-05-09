"use client"

import React from "react"


type HistoryItem = {
id: string
timestamp: string
abstract: string
domain: string
subfield: string
acceptanceProbability: number
journals: { name: string; match_score: number }[]
reasons: string[]
improvements: string[]
}

interface Props {
  history: HistoryItem[]
  onSelectHistory: (item: HistoryItem) => void
}


export function HistoryPage({ history, onSelectHistory }: Props) {
return ( <div className="space-y-6 animate-fade-in">

  {/* HEADER */}
  <div>
    <h1 className="text-2xl font-semibold">History</h1>
    <p className="text-muted-foreground text-sm">
      Your recent analyses appear here in real-time
    </p>
  </div>

  {/* EMPTY STATE */}
  {history.length === 0 ? (
    <div className="text-center py-10 text-muted-foreground">
      No history yet. Run an analysis to see results here.
    </div>
  ) : (
    <div className="space-y-4">

      {history.map((item, index) => (
        <div
          key={item.id}
          onClick={() => onSelectHistory(item)}
          className="group cursor-pointer rounded-xl border border-border bg-background/60 p-5 transition-all hover:shadow-lg hover:scale-[1.01] hover:border-primary/40"
        >

          <div className="flex justify-between items-start gap-4">

            {/* LEFT */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">
               {item.abstract.split('--- Improved Version ---')[0]}
              </h3>

              <p className="mt-2 text-xs text-muted-foreground">
                {item.domain} • {item.subfield}
              </p>

              <p className="mt-1 text-xs text-muted-foreground opacity-70">
                {item.journals.slice(0, 2).map(j => j.name).join(" • ")}
              </p>

              {/* Timestamp */}
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-sm font-bold ${
                  item.acceptanceProbability >= 80
                    ? "text-green-500"
                    : item.acceptanceProbability >= 60
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {item.acceptanceProbability}%
              </span>

              <span className="text-xs text-muted-foreground">
                {item.acceptanceProbability >= 80
                  ? "High"
                  : item.acceptanceProbability >= 60
                  ? "Medium"
                  : "Low"}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${item.acceptanceProbability}%` }}
            />
          </div>

          {/* Hover CTA */}
          <p className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
            View full analysis →
          </p>
        </div>
      ))}

    </div>
  )}
</div>

)
}
