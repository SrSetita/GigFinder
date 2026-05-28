export function SkeletonCard() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="h-36 skeleton" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <div className="h-4 skeleton rounded w-1/2" />
          <div className="h-5 w-14 skeleton rounded-full" />
        </div>
        <div className="h-3 skeleton rounded w-1/3" />
        <div className="flex gap-1 mt-1">
          <div className="h-5 w-12 skeleton rounded-full" />
          <div className="h-5 w-16 skeleton rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="h-44 skeleton" />
      <div className="px-5 pb-5">
        <div className="flex items-end gap-4 -mt-10 mb-4">
          <div className="w-20 h-20 rounded-full skeleton shrink-0 border-2 border-[var(--surface)]" />
          <div className="flex-1 pb-2 flex flex-col gap-2">
            <div className="h-6 skeleton rounded w-40" />
            <div className="h-4 skeleton rounded w-28" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-4 skeleton rounded w-full" />
          <div className="h-4 skeleton rounded w-5/6" />
          <div className="h-4 skeleton rounded w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} />
}

export function SkeletonGigCard() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="h-5 skeleton rounded w-3/5" />
        <div className="h-5 w-20 skeleton rounded-full" />
      </div>
      <div className="h-3 skeleton rounded w-1/3" />
      <div className="h-3 skeleton rounded w-2/3" />
      <div className="flex gap-1 mt-1">
        <div className="h-5 w-10 skeleton rounded-full" />
        <div className="h-5 w-14 skeleton rounded-full" />
      </div>
    </div>
  )
}
