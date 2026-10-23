import { DitheredSkeleton, DitheredSkeletonGif, DitheredSkeletonLite, GradientSkeleton } from 'ui'

const VARIANTS = [
  { label: 'Canvas', Component: DitheredSkeleton },
  { label: 'Lite', Component: DitheredSkeletonLite },
  { label: 'GIF', Component: DitheredSkeletonGif },
  { label: 'Gradient', Component: GradientSkeleton },
]

export default function DitheredSkeletonComparison() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {VARIANTS.map(({ label, Component }) => (
        <div key={label} className="flex flex-col gap-2">
          <span className="font-mono text-xs text-foreground-lighter">{label}</span>
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Component className="size-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Component className="h-3 w-3/4" />
                <Component className="h-3 w-1/2" />
              </div>
            </div>
            <Component className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
