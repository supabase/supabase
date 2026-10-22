import { DitheredSkeleton } from 'ui'

const variations = [
  { label: 'Fine', pixelSize: 1, grain: 0 },
  { label: 'Sand', pixelSize: 1, grain: 0.5 },
  { label: 'Hairline', pixelSize: 0.5, grain: 0 },
  { label: 'Film', pixelSize: 0.5, grain: 0.8 },
]

export default function DitheredSkeletonFineGrain() {
  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
      {variations.map(({ label, pixelSize, grain }) => (
        <div key={label} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-foreground">{label}</span>
            <span className="font-mono text-xs text-foreground-lighter">
              {`pixelSize={${pixelSize}} grain={${grain}}`}
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <DitheredSkeleton
                pixelSize={pixelSize}
                grain={grain}
                className="size-9 shrink-0 rounded-full"
              />
              <div className="flex flex-1 flex-col gap-1.5">
                <DitheredSkeleton pixelSize={pixelSize} grain={grain} className="h-3 w-3/4" />
                <DitheredSkeleton pixelSize={pixelSize} grain={grain} className="h-3 w-1/2" />
              </div>
            </div>
            <DitheredSkeleton pixelSize={pixelSize} grain={grain} className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
