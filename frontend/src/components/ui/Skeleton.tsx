export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="h-36 bg-white/[0.06]" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-white/[0.07] rounded w-1/2" />
          <div className="h-5 w-14 bg-white/[0.05] rounded-full" />
        </div>
        <div className="h-3 bg-white/[0.04] rounded w-1/3" />
        <div className="flex gap-1 mt-1">
          <div className="h-5 w-12 bg-white/[0.04] rounded-full" />
          <div className="h-5 w-16 bg-white/[0.04] rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse">
      <div className="h-52 bg-white/[0.06]" />
      <div className="px-8 pb-8">
        <div className="flex items-end gap-4 -mt-12 mb-6">
          <div className="w-24 h-24 rounded-2xl bg-white/[0.1] shrink-0 border-2 border-[var(--background)]" />
          <div className="flex-1 pb-2 flex flex-col gap-2">
            <div className="h-7 bg-white/[0.08] rounded w-48" />
            <div className="h-4 bg-white/[0.05] rounded w-32" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-white/[0.05] rounded w-full" />
          <div className="h-4 bg-white/[0.05] rounded w-5/6" />
          <div className="h-4 bg-white/[0.05] rounded w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded ${className}`} />
}

export function SkeletonGigCard() {
  return (
    <div className="glass rounded-2xl p-5 animate-pulse flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="h-5 bg-white/[0.07] rounded w-3/5" />
        <div className="h-5 w-20 bg-white/[0.05] rounded-full" />
      </div>
      <div className="h-3 bg-white/[0.04] rounded w-1/3" />
      <div className="h-3 bg-white/[0.04] rounded w-2/3" />
      <div className="flex gap-1 mt-1">
        <div className="h-5 w-10 bg-white/[0.04] rounded-full" />
        <div className="h-5 w-14 bg-white/[0.04] rounded-full" />
      </div>
    </div>
  )
}
