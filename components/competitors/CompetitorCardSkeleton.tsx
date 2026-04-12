import { cn } from '@/lib/utils'

interface CompetitorCardSkeletonProps {
  index: number
}

export function CompetitorCardSkeleton({ index }: CompetitorCardSkeletonProps) {
  const isEven = index % 2 === 0

  return (
    <div
      className={cn(
        'border border-alpha-10 rounded-[28px] sm:rounded-[40px] overflow-hidden animate-pulse',
        isEven ? 'bg-primary-50' : 'bg-secondary-50',
      )}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar skeleton */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-alpha-10 shrink-0" />

          <div className="flex-1 space-y-3">
            {/* Handle + badges */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 rounded bg-alpha-10" />
              <div className="h-4 w-20 rounded-full bg-alpha-10" />
              <div className="h-4 w-16 rounded-full bg-alpha-10" />
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-16 rounded-full bg-alpha-10" />
              <div className="h-5 w-14 rounded-full bg-alpha-10" />
              <div className="h-5 w-18 rounded-full bg-alpha-10" />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-alpha-10" />
              <div className="h-3 w-3/4 rounded bg-alpha-10" />
            </div>
          </div>
        </div>

        {/* Button skeletons */}
        <div className="flex items-center gap-2 mt-4 ml-0 sm:ml-14">
          <div className="h-8 w-32 rounded-[10px] bg-alpha-10" />
          <div className="h-8 w-28 rounded-[10px] bg-alpha-10" />
        </div>
      </div>
    </div>
  )
}
