import { GradientSkeleton } from 'ui'

export default function GradientSkeletonDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4 rounded-lg border p-5">
      <div className="flex items-center gap-4">
        <GradientSkeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <GradientSkeleton className="h-4 w-2/5" />
          <GradientSkeleton className="h-3 w-1/4" />
        </div>
      </div>
      <GradientSkeleton className="h-40 w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <GradientSkeleton className="h-3 w-full" />
        <GradientSkeleton className="h-3 w-11/12" />
        <GradientSkeleton className="h-3 w-3/5" />
      </div>
    </div>
  )
}
