'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function ResultsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in animate-pulse">
      {/* Actions skeleton */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Domain & Subfield skeleton */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-16 w-32 rounded-xl" />
          <Skeleton className="h-16 w-40 rounded-xl" />
        </div>
      </div>

      {/* Acceptance & Journals grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Acceptance Probability skeleton */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex justify-center py-4">
            <Skeleton className="h-[120px] w-[120px] rounded-full" />
          </div>
          <Skeleton className="mx-auto mt-4 h-4 w-48" />
        </div>

        {/* Journals skeleton */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-44" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="mb-4 h-5 w-full" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reasons & Improvements skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="mt-1.5 h-1.5 w-1.5 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-44" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="mt-1.5 h-1.5 w-1.5 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
