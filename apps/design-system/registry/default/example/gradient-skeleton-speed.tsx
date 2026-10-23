import { GradientSkeleton } from 'ui'

const SPEEDS = [0.5, 1, 2]

export default function GradientSkeletonSpeed() {
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      {SPEEDS.map((speed) => (
        <div key={speed} className="flex items-center gap-4">
          <span className="w-12 shrink-0 font-mono text-xs text-foreground-light">{speed}x</span>
          <GradientSkeleton speed={speed} className="h-8 flex-1" />
        </div>
      ))}
    </div>
  )
}
