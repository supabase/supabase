import { useMemo, useState } from 'react'
import { Slider, Toggle } from 'ui'
import { Trace, type TimeWindow } from 'ui-patterns/Trace'

import { createSampleTrace } from './trace-sample'

export default function TraceMinimapDemo() {
  const [isLarge, setIsLarge] = useState(false)
  const sample = useMemo(() => createSampleTrace({ spanCount: isLarge ? 5000 : 0 }), [isLarge])
  const [window, setWindow] = useState<TimeWindow | undefined>(undefined)

  const start = sample.spans[0].startMs
  const bounds: TimeWindow = [start, sample.nowMs]
  const current = window ?? bounds

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Toggle variant="outline" size="sm" pressed={isLarge} onPressedChange={setIsLarge}>
          5,000 spans (density mode)
        </Toggle>
        <label className="flex flex-1 items-center gap-2 text-xs text-foreground-light">
          Window
          <Slider
            className="min-w-40 flex-1"
            min={bounds[0]}
            max={bounds[1]}
            step={1}
            minStepsBetweenThumbs={5}
            value={[current[0], current[1]]}
            onValueChange={([a, b]) => setWindow([a, b])}
          />
        </label>
      </div>
      <Trace.Root trace={sample} window={window} onWindowChange={setWindow}>
        <Trace.Minimap />
      </Trace.Root>
    </div>
  )
}
