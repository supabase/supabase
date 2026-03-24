'use client'

import { ChevronDown, Palette, RotateCcw } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import {
  Button_Shadcn_ as Button,
  Card,
  CardContent,
  CardHeader,
  Input_Shadcn_ as Input,
  Label_Shadcn_ as Label,
  Slider_Shadcn_ as Slider,
} from 'ui'

type GlobalVariableKey =
  | 'neutralHue'
  | 'neutralSaturation'
  | 'brandHue'
  | 'brandSaturation'
  | 'warningHue'
  | 'warningSaturation'
  | 'destructiveHue'
  | 'destructiveSaturation'

type ThemeName = 'light' | 'dark' | 'classic-dark'
type ThemeVariableKey = 'backgroundBaseLightness' | 'backgroundContrast'
type FontVariableKey = 'sans' | 'mono'

type GlobalVariableValues = Record<GlobalVariableKey, number>
type ThemeVariableValues = Record<ThemeName, Record<ThemeVariableKey, number>>
type FontVariableValues = Record<FontVariableKey, string>

type DevtoolState = {
  global: GlobalVariableValues
  theme: ThemeVariableValues
  fonts: FontVariableValues
}

type VariableDefinition<T extends string> = {
  key: T
  label: string
  cssVariable: string
  min: number
  max: number
  step: number
  unit?: 'deg' | '%'
}

const STORAGE_KEY = 'supabase-studio-theme-variable-devtools'
const STYLE_ELEMENT_ID = 'supabase-theme-variable-devtools-overrides'

const globalVariableDefinitions: Array<VariableDefinition<GlobalVariableKey>> = [
  {
    key: 'neutralHue',
    label: 'Neutral hue',
    cssVariable: '--neutral-hue',
    min: 0,
    max: 360,
    step: 1,
    unit: 'deg',
  },
  {
    key: 'neutralSaturation',
    label: 'Neutral saturation',
    cssVariable: '--neutral-saturation',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
  },
  {
    key: 'brandHue',
    label: 'Brand hue',
    cssVariable: '--brand-hue',
    min: 0,
    max: 360,
    step: 1,
    unit: 'deg',
  },
  {
    key: 'brandSaturation',
    label: 'Brand saturation',
    cssVariable: '--brand-saturation',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
  },
  {
    key: 'warningHue',
    label: 'Warning hue',
    cssVariable: '--warning-hue',
    min: 0,
    max: 360,
    step: 1,
    unit: 'deg',
  },
  {
    key: 'warningSaturation',
    label: 'Warning saturation',
    cssVariable: '--warning-saturation',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
  },
  {
    key: 'destructiveHue',
    label: 'Destructive hue',
    cssVariable: '--destructive-hue',
    min: 0,
    max: 360,
    step: 1,
    unit: 'deg',
  },
  {
    key: 'destructiveSaturation',
    label: 'Destructive saturation',
    cssVariable: '--destructive-saturation',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
  },
]

const themeVariableDefinitions: Array<VariableDefinition<ThemeVariableKey>> = [
  {
    key: 'backgroundBaseLightness',
    label: 'Surface base lightness',
    cssVariable: '--background-base-lightness',
    min: 0,
    max: 100,
    step: 0.1,
    unit: '%',
  },
  {
    key: 'backgroundContrast',
    label: 'Surface contrast',
    cssVariable: '--background-contrast',
    min: 0,
    max: 2,
    step: 0.05,
  },
]

const fontVariableDefinitions: Array<{
  key: FontVariableKey
  label: string
  cssVariable: string
}> = [
  {
    key: 'sans',
    label: 'Sans',
    cssVariable: '--font-custom',
  },
  {
    key: 'mono',
    label: 'Mono',
    cssVariable: '--font-source-code-pro',
  },
]

const themeLabels: Record<ThemeName, string> = {
  light: 'Light',
  dark: 'Dark',
  'classic-dark': 'Classic dark',
}

const themeSelectors: Record<ThemeName, string> = {
  light: "[data-theme='light'], .light",
  dark: "[data-theme='deep-dark'], .deep-dark, [data-theme='dark'], .dark",
  'classic-dark': "[data-theme='classic-dark'], .classic-dark",
}

const getProbeClassName = (theme: ThemeName) => {
  if (theme === 'classic-dark') return 'classic-dark'
  return theme
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parseCssNumber = (value: string) => Number.parseFloat(value.trim())

const formatCssValue = <T extends string>(
  definition: VariableDefinition<T>,
  value: number
) => `${value}${definition.unit ?? ''}`

const normalizeThemeName = (themeName: string | null): ThemeName => {
  if (themeName === 'dark' || themeName === 'deep-dark') return 'dark'
  if (themeName === 'classic-dark') return 'classic-dark'
  return 'light'
}

const normalizeState = (state: DevtoolState): DevtoolState => ({
  global: Object.fromEntries(
    globalVariableDefinitions.map((definition) => [
      definition.key,
      clamp(state.global[definition.key], definition.min, definition.max),
    ])
  ) as GlobalVariableValues,
  theme: Object.fromEntries(
    (Object.keys(themeLabels) as ThemeName[]).map((theme) => [
      theme,
      Object.fromEntries(
        themeVariableDefinitions.map((definition) => [
          definition.key,
          clamp(state.theme[theme][definition.key], definition.min, definition.max),
        ])
      ),
    ])
  ) as ThemeVariableValues,
  fonts: Object.fromEntries(
    fontVariableDefinitions.map((definition) => [definition.key, state.fonts[definition.key].trim()])
  ) as FontVariableValues,
})

const getThemeVariableDefaults = (theme: ThemeName): Record<ThemeVariableKey, number> => {
  const probe = document.createElement('div')
  probe.className = getProbeClassName(theme)
  probe.style.position = 'absolute'
  probe.style.pointerEvents = 'none'
  probe.style.opacity = '0'
  probe.style.inset = '0'
  document.body.appendChild(probe)

  const computedStyle = window.getComputedStyle(probe)
  const values = Object.fromEntries(
    themeVariableDefinitions.map((definition) => [
      definition.key,
      parseCssNumber(computedStyle.getPropertyValue(definition.cssVariable)),
    ])
  ) as Record<ThemeVariableKey, number>

  probe.remove()
  return values
}

const getDefaultState = (): DevtoolState => {
  const rootStyles = window.getComputedStyle(document.documentElement)

  return {
    global: Object.fromEntries(
      globalVariableDefinitions.map((definition) => [
        definition.key,
        parseCssNumber(rootStyles.getPropertyValue(definition.cssVariable)),
      ])
    ) as GlobalVariableValues,
    theme: {
      light: getThemeVariableDefaults('light'),
      dark: getThemeVariableDefaults('dark'),
      'classic-dark': getThemeVariableDefaults('classic-dark'),
    },
    fonts: Object.fromEntries(
      fontVariableDefinitions.map((definition) => [
        definition.key,
        rootStyles.getPropertyValue(definition.cssVariable).trim(),
      ])
    ) as FontVariableValues,
  }
}

const getStoredState = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) return null
    return JSON.parse(value) as DevtoolState
  } catch {
    return null
  }
}

const hasOverrides = (defaults: DevtoolState, values: DevtoolState) =>
  globalVariableDefinitions.some(
    (definition) => defaults.global[definition.key] !== values.global[definition.key]
  ) ||
  fontVariableDefinitions.some(
    (definition) => defaults.fonts[definition.key] !== values.fonts[definition.key]
  ) ||
  (Object.keys(themeLabels) as ThemeName[]).some((theme) =>
    themeVariableDefinitions.some(
      (definition) => defaults.theme[theme][definition.key] !== values.theme[theme][definition.key]
    )
  )

const applyOverrides = (defaults: DevtoolState, values: DevtoolState) => {
  const rootStyle = document.documentElement.style

  globalVariableDefinitions.forEach((definition) => {
    const value = values.global[definition.key]
    const defaultValue = defaults.global[definition.key]

    if (value === defaultValue) {
      rootStyle.removeProperty(definition.cssVariable)
      return
    }

    rootStyle.setProperty(definition.cssVariable, formatCssValue(definition, value))
  })

  fontVariableDefinitions.forEach((definition) => {
    const value = values.fonts[definition.key]
    const defaultValue = defaults.fonts[definition.key]

    if (!value || value === defaultValue) {
      rootStyle.removeProperty(definition.cssVariable)
      return
    }

    rootStyle.setProperty(definition.cssVariable, value)
  })

  const cssBlocks = (Object.keys(themeLabels) as ThemeName[])
    .map((theme) => {
      const declarations = themeVariableDefinitions
        .map((definition) => {
          const value = values.theme[theme][definition.key]
          const defaultValue = defaults.theme[theme][definition.key]

          if (value === defaultValue) return null

          return `  ${definition.cssVariable}: ${formatCssValue(definition, value)};`
        })
        .filter(Boolean)
        .join('\n')

      if (!declarations) return null

      return `${themeSelectors[theme]} {\n${declarations}\n}`
    })
    .filter(Boolean)
    .join('\n\n')

  const existingStyleElement = document.getElementById(STYLE_ELEMENT_ID)

  if (!cssBlocks) {
    existingStyleElement?.remove()
    return
  }

  const styleElement =
    existingStyleElement ?? Object.assign(document.createElement('style'), { id: STYLE_ELEMENT_ID })

  styleElement.textContent = cssBlocks

  if (!styleElement.parentNode) {
    document.head.appendChild(styleElement)
  }
}

const getActiveTheme = () => normalizeThemeName(document.documentElement.getAttribute('data-theme'))

const VariableControl = <T extends string>({
  definition,
  value,
  onChange,
}: {
  definition: VariableDefinition<T>
  value: number
  onChange: (value: number) => void
}) => {
  const precision = definition.step >= 1 ? 0 : 2

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs text-foreground">{definition.label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min={definition.min}
            max={definition.max}
            step={definition.step}
            value={value}
            onChange={(event) => {
              const nextValue = Number.parseFloat(event.target.value)
              if (Number.isNaN(nextValue)) return
              onChange(clamp(nextValue, definition.min, definition.max))
            }}
            className="h-8 w-24 text-right font-mono text-xs"
          />
          <span className="w-8 text-right text-xs text-foreground-lighter">{definition.unit ?? ''}</span>
        </div>
      </div>
      <Slider
        min={definition.min}
        max={definition.max}
        step={definition.step}
        value={[value]}
        onValueChange={([nextValue]) => {
          if (typeof nextValue !== 'number') return
          onChange(clamp(Number(nextValue.toFixed(precision)), definition.min, definition.max))
        }}
      />
    </div>
  )
}

export const ThemeVariableDevtools = () => {
  const { theme, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTheme, setActiveTheme] = useState<ThemeName>('light')
  const [defaults, setDefaults] = useState<DevtoolState | null>(null)
  const [values, setValues] = useState<DevtoolState | null>(null)

  useEffect(() => {
    const defaultState = getDefaultState()
    const storedState = getStoredState()
    const nextState = storedState
      ? normalizeState({
          global: { ...defaultState.global, ...storedState.global },
          theme: {
            light: { ...defaultState.theme.light, ...storedState.theme?.light },
            dark: { ...defaultState.theme.dark, ...storedState.theme?.dark },
            'classic-dark': {
              ...defaultState.theme['classic-dark'],
              ...storedState.theme?.['classic-dark'],
            },
          },
          fonts: { ...defaultState.fonts, ...(storedState.fonts ?? {}) },
        })
      : defaultState

    setDefaults(defaultState)
    setValues(nextState)
    setActiveTheme(getActiveTheme())
  }, [])

  useEffect(() => {
    if (!defaults || !values) return

    applyOverrides(defaults, values)
    if (hasOverrides(defaults, values)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [defaults, values])

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setActiveTheme(getActiveTheme())
    })

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })

    return () => observer.disconnect()
  }, [])

  const displayTheme = useMemo(() => {
    if (theme && theme !== 'system') return theme
    if (resolvedTheme) return resolvedTheme
    return activeTheme
  }, [activeTheme, resolvedTheme, theme])

  if (!defaults || !values) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3">
      {isOpen ? (
        <Card className="w-[360px] max-w-[calc(100vw-2rem)] border-border-default bg-background-surface-100 shadow-2xl">
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="rounded-full border border-border-default bg-background-200 px-2 py-1 font-mono uppercase tracking-wide text-foreground-light">
                {displayTheme}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 px-2 text-xs"
                  onClick={() => {
                    setValues(defaults)
                    window.localStorage.removeItem(STORAGE_KEY)
                  document.getElementById(STYLE_ELEMENT_ID)?.remove()
                  globalVariableDefinitions.forEach((definition) => {
                    document.documentElement.style.removeProperty(definition.cssVariable)
                  })
                  fontVariableDefinitions.forEach((definition) => {
                    document.documentElement.style.removeProperty(definition.cssVariable)
                  })
                }}
              >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setIsOpen(false)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[70vh] space-y-5 overflow-y-auto">
            <section className="space-y-4">
              <div className="space-y-4">
                {globalVariableDefinitions.slice(0, 2).map((definition) => (
                  <VariableControl
                    key={definition.key}
                    definition={definition}
                    value={values.global[definition.key]}
                    onChange={(nextValue) => {
                      setValues((current) =>
                        current
                          ? {
                              ...current,
                              global: {
                                ...current.global,
                                [definition.key]: nextValue,
                              },
                            }
                          : current
                      )
                    }}
                  />
                ))}

                {themeVariableDefinitions.map((definition) => (
                  <VariableControl
                    key={`${activeTheme}-${definition.key}`}
                    definition={{
                      ...definition,
                      label: `${definition.label} (${themeLabels[activeTheme]})`,
                    }}
                    value={values.theme[activeTheme][definition.key]}
                    onChange={(nextValue) => {
                      setValues((current) =>
                        current
                          ? {
                              ...current,
                              theme: {
                                ...current.theme,
                                [activeTheme]: {
                                  ...current.theme[activeTheme],
                                  [definition.key]: nextValue,
                                },
                              },
                            }
                          : current
                      )
                    }}
                  />
                ))}

                {globalVariableDefinitions.slice(2).map((definition) => (
                  <VariableControl
                    key={definition.key}
                    definition={definition}
                    value={values.global[definition.key]}
                    onChange={(nextValue) => {
                      setValues((current) =>
                        current
                          ? {
                              ...current,
                              global: {
                                ...current.global,
                                [definition.key]: nextValue,
                              },
                            }
                          : current
                      )
                    }}
                  />
                ))}
              </div>
            </section>
            <section className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wide text-foreground-light">
                Fonts
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-foreground">Sans</Label>
                  <Input
                    type="text"
                    value={values.fonts.sans}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setValues((current) =>
                        current
                          ? {
                              ...current,
                              fonts: {
                                ...current.fonts,
                                sans: nextValue,
                              },
                            }
                          : current
                      )
                    }}
                    className="h-8 font-mono text-xs"
                    placeholder="Inter, sans-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-foreground">Mono</Label>
                  <Input
                    type="text"
                    value={values.fonts.mono}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setValues((current) =>
                        current
                          ? {
                              ...current,
                              fonts: {
                                ...current.fonts,
                                mono: nextValue,
                              },
                            }
                          : current
                      )
                    }}
                    className="h-8 font-mono text-xs"
                    placeholder="IBM Plex Mono, monospace"
                  />
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-full border-border-default bg-background/95 px-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Palette className="mr-2 h-4 w-4" />
        Theme vars
      </Button>
    </div>
  )
}
