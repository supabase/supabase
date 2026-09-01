import { LOCAL_STORAGE_KEYS } from 'common'
import { useTheme } from 'next-themes'
import { CSSProperties, memo, useCallback, useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'
import {
  Button,
  Card,
  CardContent,
  Label,
  RadioGroup,
  RadioGroupLargeItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  singleThemes,
  Slider,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DEFAULT_SIDEBAR_BEHAVIOR } from '@/components/interfaces/Sidebar'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useThemeOverrides } from '@/hooks/misc/useThemeOverrides'
import { BASE_PATH } from '@/lib/constants'
import {
  formatThemeOverrideValue,
  getThemeOverrideValue,
  hasThemeOverrides,
  previewThemeOverride,
  THEME_OVERRIDE_KNOBS,
  ThemeOverrides,
} from '@/lib/theme-overrides'

/**
 * POC: the picker is limited to System / Dark / Light. `classic-dark` stays
 * registered in `singleThemes` (other apps and the account dropdown still list
 * it) but is not offered here.
 */
const THEME_MODE_VALUES = ['system', 'dark', 'light']
const themeModes = singleThemes.filter((theme) => THEME_MODE_VALUES.includes(theme.value))

/**
 * Declared at module scope and memoized deliberately. While this lived inside
 * `ThemeSettings` React saw a brand new component type on every parent render
 * and remounted the whole radio group, so the four `react-inlinesvg` previews
 * restarted their fetch and rendered nothing until it resolved — collapsing
 * the cards for a frame. That was invisible while the parent only re-rendered
 * on a theme change, but it became a continuous flicker once dragging a
 * customize-theme slider started re-rendering the parent every frame.
 */
const SingleThemeSelection = memo(function SingleThemeSelection({
  theme,
  setTheme,
}: {
  theme: string | undefined
  setTheme: (theme: string) => void
}) {
  return (
    <RadioGroup
      name="theme"
      onValueChange={setTheme}
      aria-label="Choose a theme"
      defaultValue={theme}
      value={theme}
      className="grid grid-cols-2 gap-4"
    >
      {themeModes.map((themeMode) => (
        <RadioGroupLargeItem
          className="p-3 w-full"
          key={themeMode.value}
          value={themeMode.value}
          label={themeMode.name}
        >
          <SVG src={`${BASE_PATH}/img/themes/${themeMode.value}.svg?v=2`} />
        </RadioGroupLargeItem>
      ))}
    </RadioGroup>
  )
})

/**
 * Owns `useThemeOverrides` so that persisting a value only re-renders this
 * section, never the theme mode cards above it.
 *
 * A drag is held in local `draft` state and pushed straight to the document
 * element via `previewThemeOverride`, so moving a slider neither writes to
 * localStorage nor invalidates a React Query. The value is persisted once on
 * commit (pointer or key release), which is also when the draft is dropped and
 * the stored value takes over as the source of truth.
 */
const ThemeOverrideFields = () => {
  const { mode, overrides, setOverride, resetOverrides } = useThemeOverrides()
  const [draft, setDraft] = useState<ThemeOverrides>({})

  // Overrides are stored per mode, so an uncommitted dark-mode drag must not
  // be shown against light's values if the resolved mode changes mid-drag.
  useEffect(() => setDraft({}), [mode])

  const handleReset = useCallback(() => {
    setDraft({})
    resetOverrides()
  }, [resetOverrides])

  return (
    <CardContent className="grid grid-cols-12 gap-6">
      <div className="col-span-full md:col-span-4 flex flex-col gap-2">
        <Label className="text-foreground">Customize theme</Label>
        <p className="text-sm text-foreground-light">
          Adjust the colour-system inputs the {mode} theme is built from. Overrides are saved per
          theme mode.
        </p>
        {hasThemeOverrides(overrides) && (
          <Button variant="default" size="tiny" className="self-start" onClick={handleReset}>
            Reset to defaults
          </Button>
        )}
      </div>

      <div className="col-span-full md:col-span-8 flex flex-col gap-6">
        {THEME_OVERRIDE_KNOBS.map((knob) => {
          const value = draft[knob.key] ?? getThemeOverrideValue(knob, mode, overrides)
          return (
            <div key={knob.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-foreground">{knob.label}</Label>
                <span className="text-sm font-mono text-foreground-light tabular-nums">
                  {formatThemeOverrideValue(knob, value)}
                </span>
              </div>
              <Slider
                variant="expressive"
                style={{ '--slider-track-image': knob.trackImage } as CSSProperties}
                aria-label={knob.label}
                min={knob.min}
                max={knob.max}
                step={knob.step}
                value={[value]}
                onValueChange={([next]) => {
                  setDraft((current) => ({ ...current, [knob.key]: next }))
                  previewThemeOverride(knob, next)
                }}
                onValueCommit={([next]) => {
                  setOverride(knob.key, next)
                  setDraft(({ [knob.key]: _committed, ...rest }) => rest)
                }}
              />
              <p className="text-sm text-foreground-lighter">{knob.description}</p>
            </div>
          )
        })}
      </div>
    </CardContent>
  )
}

export const ThemeSettings = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  const [sidebarBehaviour, setSidebarBehaviour] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )
  /**
   * Avoid Hydration Mismatch
   * https://github.com/pacocoursey/next-themes?tab=readme-ov-file#avoid-hydration-mismatch
   */
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Appearance</PageSectionTitle>
          <PageSectionDescription>
            Choose how Supabase looks and behaves in the dashboard.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="grid grid-cols-12 gap-6">
            <div className="col-span-full md:col-span-4 flex flex-col gap-2">
              <Label htmlFor="theme" className="text-foreground">
                Theme mode
              </Label>
              <p className="text-sm text-foreground-light">
                Choose how Supabase looks to you. Select a single theme, or sync with your system.
              </p>
            </div>

            <div className="col-span-full md:col-span-8 flex flex-col gap-4">
              <SingleThemeSelection theme={theme} setTheme={setTheme} />
            </div>
          </CardContent>
          <Separator />
          <ThemeOverrideFields />
          <Separator />
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              label="Sidebar behavior"
              layout="flex-row-reverse"
              description="Choose your preferred sidebar behavior: open, closed, or expand on hover."
            >
              <Select
                value={sidebarBehaviour}
                onValueChange={setSidebarBehaviour}
                aria-label="Select an option"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Expanded</SelectItem>
                  <SelectItem value="closed">Collapsed</SelectItem>
                  <SelectItem value="expandable">Expand on hover</SelectItem>
                </SelectContent>
              </Select>
            </FormItemLayout>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
