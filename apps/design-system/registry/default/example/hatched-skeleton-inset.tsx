import { HatchedSkeleton } from 'ui'

export default function HatchedSkeletonInset() {
  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
      {[
        { label: 'Flat', inset: false },
        { label: 'Inset', inset: true },
      ].map(({ label, inset }) => (
        <div key={label} className="flex flex-col gap-2">
          <span className="font-mono text-xs text-foreground-lighter">{label}</span>
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <HatchedSkeleton inset={inset} className="size-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <HatchedSkeleton inset={inset} className="h-3 w-3/4" />
                <HatchedSkeleton inset={inset} className="h-3 w-1/2" />
              </div>
            </div>
            <HatchedSkeleton inset={inset} className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
