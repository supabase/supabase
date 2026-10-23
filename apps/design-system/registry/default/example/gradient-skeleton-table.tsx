import { GradientSkeleton } from 'ui'

const ROWS = ['w-36', 'w-28', 'w-44', 'w-32', 'w-40']

export default function GradientSkeletonTable() {
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-lg border">
      <div className="flex items-center gap-4 border-b bg-surface-100 px-4 py-2.5">
        <GradientSkeleton className="h-3 w-20" />
        <GradientSkeleton className="ml-auto h-3 w-16" />
        <GradientSkeleton className="h-3 w-12" />
      </div>
      <div className="divide-y">
        {ROWS.map((width, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <GradientSkeleton className="size-4 shrink-0 rounded" />
            <GradientSkeleton className={`h-3.5 ${width}`} />
            <GradientSkeleton className="ml-auto h-5 w-16 rounded-full" />
            <GradientSkeleton className="h-3.5 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
