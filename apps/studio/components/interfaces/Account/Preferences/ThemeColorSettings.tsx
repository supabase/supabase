import { useFlag } from 'common'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button, CardContent, cn, Slider } from 'ui'

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
  ThemeOverrideMode,
  ThemeOverrides,
  themeOverrideToSliderValue,
} from '@/lib/theme-overrides'

/** Full-hue OKLCH spectrum for the spot colour track. */
const HUE_SPECTRUM_TRACK =
  'linear-gradient(to right, oklch(0.7 0.14 0), oklch(0.7 0.14 60), oklch(0.7 0.14 120), oklch(0.7 0.14 180), oklch(0.7 0.14 240), oklch(0.7 0.14 300), oklch(0.7 0.14 360))'

type SliderTrackStyle = CSSProperties & {
  '--slider-track-fill': string
}

const PRIMARY_SWATCHES = [
  { label: 'Solid', variable: '--primary-solid' },
  { label: 'Primary', variable: '--primary' },
  { label: 'Bright', variable: '--primary-bright' },
] as const

// `background` shorthand (not transparent + background-image) avoids a dark
// hairline at rounded caps in dark mode. A light outline keeps pale tracks
// visible against the card without eating into the fill.
const SPECTRUM_SLIDER_CLASS = cn(
  '[&_[data-slot=slider-track]]:outline',
  '[&_[data-slot=slider-track]]:outline-1',
  '[&_[data-slot=slider-track]]:outline-foreground/10',
  '[&_[data-slot=slider-track]]:outline-offset-0',
  '[&_[data-slot=slider-track]]:[background:var(--slider-track-fill)]',
  '[&_[data-slot=slider-range]]:invisible'
)

function sliderTrackStyle(
  key: ThemeOverrideKey,
  mode: ThemeOverrideMode
): SliderTrackStyle | undefined {
  switch (key) {
    case 'primaryHue':
      return { '--slider-track-fill': HUE_SPECTRUM_TRACK }
    case 'chroma':
      // Grey → tinted at the live surface hue (follows spot via CSS offset).
      return {
        '--slider-track-fill':
          mode === 'dark'
            ? 'linear-gradient(to right, oklch(0.4 0 var(--surface-hue)), oklch(0.4 0.07 var(--surface-hue)))'
            : 'linear-gradient(to right, oklch(0.9 0 var(--surface-hue)), oklch(0.9 0.05 var(--surface-hue)))',
      }
    case 'contrast':
      return {
        '--slider-track-fill':
          mode === 'dark'
            ? 'linear-gradient(to right, oklch(0.35 0 0), oklch(0.9 0 0))'
            : 'linear-gradient(to right, oklch(0.82 0 0), oklch(0.2 0 0))',
      }
    case 'surface':
      // Chroma 0 at the ends avoids out-of-gamut flashes at the caps.
      return {
        '--slider-track-fill':
          'linear-gradient(to right, oklch(0.14 0 0), oklch(0.5 0.015 var(--surface-hue)), oklch(0.97 0 0))',
      }
    case 'elevationStep':
      // Flat → stronger lift between layers (smooth ramp, not hard bands).
      return {
        '--slider-track-fill':
          mode === 'dark'
            ? 'linear-gradient(to right, oklch(0.28 0 var(--surface-hue)), oklch(0.55 0 var(--surface-hue)))'
            : 'linear-gradient(to right, oklch(0.92 0 var(--surface-hue)), oklch(0.99 0 var(--surface-hue)))',
      }
  }
}

export const ThemeColorSettings = () => {
  const isSpotColorEnabled = useFlag(APPEARANCE_SPOT_COLOR_FLAG)
  const { mode, overrides, setOverride, resetOverrides } = useThemeOverrides()
  const visibleOverrides = resolveThemeOverridesForFlags(overrides, { isSpotColorEnabled })
  const [draft, setDraft] = useState<ThemeOverrides>({})
  const draftRef = useRef<ThemeOverrides>({})
  const interactionRafRef = useRef<number | null>(null)
  const pendingPreviewRef = useRef<{ knob: ThemeOverrideKnob; raw: number } | null>(null)
  const modeRef = useRef(mode)
  const overridesRef = useRef(visibleOverrides)

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
      previewThemeOverride(pending.knob, modeRef.current, pending.raw)
    })
  }, [])

  useEffect(() => flushDraft({}), [mode, flushDraft])

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
