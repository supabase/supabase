import { DitheredSkeleton } from 'ui'

export default function DitheredSkeletonPixelSize() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {[1, 2, 4].map((pixelSize) => (
        <div key={pixelSize} className="flex items-center gap-3">
          <span className="w-16 shrink-0 font-mono text-xs text-foreground-lighter">
            {pixelSize}px
          </span>
          <DitheredSkeleton pixelSize={pixelSize} className="h-10 flex-1 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
