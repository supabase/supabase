import { useFlag } from 'common'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, CardContent, cn, Slider } from 'ui'

import { sliderTrackStyle } from './ThemeColorSettings.utils'
import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import {
  APPEARANCE_SPOT_COLOR_FLAG,
  applyThemeOverrides,
  getThemeOverrideValue,
  hasThemeOverrides,
  previewThemeOverride,
  resolveThemeOverridesForFlags,
  sliderValueToThemeOverride,
  THEME_OVERRIDE_KNOBS,
  ThemeOverrideKey,
  ThemeOverrideKnob,
  ThemeOverrides,
  themeOverrideToSliderValue,
} from '@/lib/theme-overrides'

const PRIMARY_SWATCHES = [
  { label: 'Solid', variable: '--primary-solid' },
  { label: 'Primary', variable: '--primary' },
  { label: 'Bright', variable: '--primary-bright' },
] as const

// `background` shorthand (not transparent + background-image) avoids a dark
// hairline at rounded caps in dark mode.
const SPECTRUM_SLIDER_CLASS = cn(
  // eslint-disable-next-line shadcn/no-arbitrary-values -- Dynamic theme preview gradient uses the background shorthand for rounded caps.
  '[&_[data-slot=slider-track]]:[background:var(--slider-track-fill)]',
  '[&_[data-slot=slider-range]]:invisible'
)

export const ThemeColorSettings = () => {
  const isSpotColorEnabled = useFlag(APPEARANCE_SPOT_COLOR_FLAG)
  const { mode, overrides, setOverride, resetOverrides } = useThemeOverrides()
  const visibleOverrides = resolveThemeOverridesForFlags(overrides, { isSpotColorEnabled })
  const [draft, setDraft] = useState<ThemeOverrides>({})
  const draftRef = useRef<ThemeOverrides>({})
  const interactionRafRef = useRef<number | null>(null)
  const pendingPreviewRef = useRef<{ knob: ThemeOverrideKnob; raw: number } | null>(null)
  const isSpotColorEnabledRef = useRef(isSpotColorEnabled)
  const modeRef = useRef(mode)
  const overridesRef = useRef(visibleOverrides)

  isSpotColorEnabledRef.current = isSpotColorEnabled
  modeRef.current = mode
  overridesRef.current = visibleOverrides

  const knobs = THEME_OVERRIDE_KNOBS.filter(
    (knob) => knob.key !== 'primaryHue' || isSpotColorEnabled
  )

  const cancelQueuedInteraction = useCallback(() => {
    if (interactionRafRef.current === null) return
    cancelAnimationFrame(interactionRafRef.current)
    interactionRafRef.current = null
  }, [])

  const flushDraft = useCallback(
    (next: ThemeOverrides) => {
      cancelQueuedInteraction()
      draftRef.current = next
      setDraft(next)
    },
    [cancelQueuedInteraction]
  )

  /** One React paint + one CSS preview per frame while dragging. */
  const queueInteraction = useCallback((knob: ThemeOverrideKnob, raw: number) => {
    draftRef.current = { ...draftRef.current, [knob.key]: raw }
    pendingPreviewRef.current = { knob, raw }
    if (interactionRafRef.current !== null) return

    interactionRafRef.current = requestAnimationFrame(() => {
      interactionRafRef.current = null
      setDraft(draftRef.current)
      const pending = pendingPreviewRef.current
      if (pending === null) return
      if (pending.knob.key === 'primaryHue' && !isSpotColorEnabledRef.current) return
      previewThemeOverride(pending.knob, modeRef.current, pending.raw)
    })
  }, [])

  useEffect(() => {
    flushDraft({})
    applyThemeOverrides(document.documentElement, modeRef.current, overridesRef.current)
  }, [mode, isSpotColorEnabled, flushDraft])

  useEffect(
    () => () => {
      cancelQueuedInteraction()
      applyThemeOverrides(document.documentElement, modeRef.current, overridesRef.current)
    },
    [cancelQueuedInteraction]
  )

  const handleReset = useCallback(() => {
    flushDraft({})
    resetOverrides()
  }, [flushDraft, resetOverrides])

  const commitDraft = useCallback(
    (key: ThemeOverrideKey, committed?: number) => {
      const pending = draftRef.current[key] ?? committed
      if (pending === undefined) return

      const knob = THEME_OVERRIDE_KNOBS.find((candidate) => candidate.key === key)
      if (knob !== undefined) previewThemeOverride(knob, modeRef.current, pending)

      setOverride(key, pending)
      const { [key]: _flushed, ...rest } = draftRef.current
      flushDraft(rest)
    },
    [flushDraft, setOverride]
  )

  return (
    <CardContent className="grid grid-cols-12 gap-6">
      <div className="col-span-full md:col-span-4 flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground">Theme colors</h3>
        <p className="text-sm text-foreground-lighter">
          Changes are saved separately for light and dark mode.
        </p>
        {hasThemeOverrides(visibleOverrides) && (
          <Button variant="default" size="tiny" className="self-start" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      <div className="col-span-full md:col-span-8 flex flex-col gap-6 pb-2">
        {knobs.map((knob) => {
          const isSpotHue = knob.key === 'primaryHue'
          const rawValue = draft[knob.key] ?? getThemeOverrideValue(knob, mode, visibleOverrides)
          const sliderValue = themeOverrideToSliderValue(knob, mode, rawValue)
          const roundedHue = Math.round(rawValue)
          const trackStyle = sliderTrackStyle(knob.key, mode)

          return (
            <div key={knob.key} className="flex flex-col gap-2">
              <div
                className={cn(
                  'grid items-start gap-4',
                  isSpotHue ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_2rem]'
                )}
              >
                <div className="min-w-0 flex flex-col gap-1">
                  <span
                    id={`theme-color-${knob.key}-label`}
                    className="text-sm font-medium text-foreground"
                  >
                    {knob.label}
                  </span>
                  <span className="text-sm text-foreground-light">{knob.description}</span>
                </div>
                {isSpotHue ? (
                  <span className="flex items-center justify-end gap-2 text-sm text-foreground-light">
                    <span className="flex items-center gap-1" aria-hidden>
                      {PRIMARY_SWATCHES.map((swatch) => (
                        <span
                          key={swatch.variable}
                          title={swatch.label}
                          className="size-2.5 rounded-full border border-foreground/15"
                          style={{ background: `var(${swatch.variable})` }}
                        />
                      ))}
                    </span>
                    <span className="tabular-nums">{roundedHue}°</span>
                  </span>
                ) : (
                  <span className="text-right text-sm text-foreground-light tabular-nums">
                    {sliderValue}
                  </span>
                )}
              </div>
              <Slider
                className={
                  trackStyle ? SPECTRUM_SLIDER_CLASS : '[&_[data-slot=slider-track]]:bg-input'
                }
                style={trackStyle}
                aria-labelledby={`theme-color-${knob.key}-label`}
                aria-valuetext={isSpotHue ? `${roundedHue} degrees` : `${sliderValue} out of 100`}
                min={0}
                max={100}
                step={1}
                value={[sliderValue]}
                onValueChange={([next]) => {
                  queueInteraction(knob, sliderValueToThemeOverride(knob, mode, next))
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
