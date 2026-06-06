import { Slider } from 'ui'

type DebugSliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

export function DebugSlider({ label, value, min, max, step, onChange }: DebugSliderProps) {
  return (
    <label className="grid gap-1.5 text-[10px] text-foreground-lighter">
      <span className="flex items-center justify-between tabular-nums">
        <span>{label}</span>
        <span className="text-foreground">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next ?? value)}
      />
    </label>
  )
}
