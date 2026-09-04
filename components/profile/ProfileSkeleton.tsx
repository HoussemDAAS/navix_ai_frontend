'use client'

/** Shimmer placeholder matching the profile hero, stat tiles and posts grid. */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading profile">
      <div className="rounded-[20px] border border-alpha-10 bg-white p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <div className="h-24 w-24 shrink-0 rounded-full bg-alpha-10 animate-pulse" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-8 w-56 max-w-full rounded bg-alpha-10 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-full bg-alpha-5 animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-alpha-5 animate-pulse" />
            </div>
            <div className="h-4 w-full rounded bg-alpha-5 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-alpha-5 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[14px] border border-alpha-10 bg-white p-3.5">
            <div className="h-3 w-16 rounded bg-alpha-5 animate-pulse" />
            <div className="mt-2 h-6 w-12 rounded bg-alpha-10 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="rounded-[20px] border border-secondary-200 bg-secondary-50 p-5 space-y-3">
        <div className="h-5 w-40 rounded bg-alpha-10 animate-pulse" />
        <div className="h-4 w-full rounded bg-alpha-5 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-alpha-5 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[16px] border border-alpha-10 bg-white">
            <div className="aspect-square bg-alpha-10 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-full rounded bg-alpha-5 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-alpha-5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
