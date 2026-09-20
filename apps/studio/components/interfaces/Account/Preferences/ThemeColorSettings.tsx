import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, CardContent, Slider } from 'ui'

import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import {
  applyResolvedThemeOverrides,
  getThemeOverrideValue,
  hasThemeOverrides,
  previewThemeOverride,
  sliderValueToThemeOverride,
  THEME_OVERRIDE_KNOBS,
  ThemeOverrideKey,
  ThemeOverrides,
  themeOverrideToSliderValue,
} from '@/lib/theme-overrides'

export const ThemeColorSettings = ({ isVisible = true }: { isVisible?: boolean }) => {
  const { mode, overrides, setOverride, resetOverrides } = useThemeOverrides()
  const [draft, setDraft] = useState<ThemeOverrides>({})
  const draftRef = useRef<ThemeOverrides>({})
  const modeRef = useRef(mode)
  const overridesRef = useRef(overrides)

  modeRef.current = mode
  overridesRef.current = overrides

  const writeDraft = useCallback((next: ThemeOverrides) => {
    draftRef.current = next
    setDraft(next)
  }, [])

  useEffect(() => writeDraft({}), [mode, writeDraft])

  useEffect(
    () => () => {
      const root = document.documentElement
      applyResolvedThemeOverrides(root, root.dataset.theme, modeRef.current, overridesRef.current)
    },
    []
  )

  const handleReset = useCallback(() => {
    writeDraft({})
    resetOverrides()
  }, [resetOverrides, writeDraft])

  const commitDraft = useCallback(
    (key: ThemeOverrideKey, committed?: number) => {
      const pending = draftRef.current[key] ?? committed
      if (pending === undefined) return

      setOverride(key, pending)
      const { [key]: _flushed, ...rest } = draftRef.current
      writeDraft(rest)
    },
    [setOverride, writeDraft]
  )

  if (!isVisible) return null

  return (
    <CardContent className="grid grid-cols-12 gap-6">
      <div className="col-span-full md:col-span-4 flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground">Theme colors</h3>
        <p className="text-sm text-foreground-lighter">
          Changes are saved separately for light and dark mode.
        </p>
        {hasThemeOverrides(overrides) && (
          <Button variant="default" size="tiny" className="self-start" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      <div className="col-span-full md:col-span-8 flex flex-col gap-6 pb-2">
        {THEME_OVERRIDE_KNOBS.map((knob) => {
          const rawValue = draft[knob.key] ?? getThemeOverrideValue(knob, mode, overrides)
          const sliderValue = themeOverrideToSliderValue(knob, mode, rawValue)

          return (
            <div key={knob.key} className="flex flex-col gap-2">
              <div className="grid grid-cols-[minmax(0,1fr)_2rem] items-start gap-4">
                <div className="min-w-0 flex flex-col gap-1">
                  <span
                    id={`theme-color-${knob.key}-label`}
                    className="text-sm font-medium text-foreground"
                  >
                    {knob.label}
                  </span>
                  <span className="text-sm text-foreground-light">{knob.description}</span>
                </div>
                <span className="text-right text-sm text-foreground-light tabular-nums">
                  {sliderValue}
                </span>
              </div>
              <Slider
                className="[&_[data-slot=slider-track]]:bg-input"
                aria-labelledby={`theme-color-${knob.key}-label`}
                aria-valuetext={`${sliderValue} out of 100`}
                min={0}
                max={100}
                step={1}
                value={[sliderValue]}
                onValueChange={([next]) => {
                  const raw = sliderValueToThemeOverride(knob, mode, next)
                  writeDraft({ ...draftRef.current, [knob.key]: raw })
                  previewThemeOverride(knob, mode, raw)
                }}
                onValueCommit={([next]) =>
                  commitDraft(knob.key, sliderValueToThemeOverride(knob, mode, next))
                }
                onLostPointerCapture={() => commitDraft(knob.key)}
              />
            </div>
          )
        })}
      </div>
    </CardContent>
  )
}
