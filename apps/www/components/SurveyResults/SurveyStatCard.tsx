export function SurveyStatCard({
  unit = '%',
  label,
  progressValue,
  maxValue = 100,
}: {
  unit?: string
  label: string
  progressValue?: number
  maxValue?: number
}) {
  return (
    <div className="flex-1 px-6 py-8 flex flex-col gap-4">
      {/* Progress bar */}
      {progressValue !== undefined && (
        <div
          className="h-[6px] flex items-center mr-12"
          style={
            {
              background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 3px,
                  color-mix(in srgb, hsl(var(--foreground-muted)) 50%, transparent) 3px,
                  color-mix(in srgb, hsl(var(--foreground-muted)) 50%, transparent) 4px
                )`,
            } as React.CSSProperties
          }
        >
          <div
            className="h-full bg-brand"
            style={{
              width: `calc(max(0.5%, (${progressValue} / ${maxValue}) * 100%))`,
            }}
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="-ml-1 md:mt-8 text:2xl md:text-6xl font-mono tracking-tight inline-block flex flex-row items-baseline text-foreground">
          {progressValue}
          <span className="text-sm md:text-4xl">{unit}</span>
        </p>
        <p className="text-foreground-light text-sm">{label}</p>
      </div>
    </div>
  )
}
