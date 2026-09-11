import { LOCAL_STORAGE_KEYS } from 'common'
import { useTheme } from 'next-themes'
import { CSSProperties, memo, useCallback, useEffect, useRef, useState } from 'react'
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
  ThemeOverrideKey,
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
 * localStorage nor invalidates a React Query. The value is persisted once the
 * gesture ends, which is also when the draft entry is dropped and the stored
 * value takes over as the source of truth. See `commitDraft` for why that is
 * driven from pointer release as well as Radix's own commit callback.
 */
const ThemeOverrideFields = () => {
  const { mode, overrides, setOverride, resetOverrides } = useThemeOverrides()
  const [draft, setDraft] = useState<ThemeOverrides>({})
  /**
   * The draft is mirrored in a ref because `commitDraft` has to read the value
   * a gesture just produced from inside that same gesture, before React has
   * re-rendered. Reading `draft` there would see the previous render's value.
   */
  const draftRef = useRef<ThemeOverrides>({})

  const writeDraft = useCallback((next: ThemeOverrides) => {
    draftRef.current = next
    setDraft(next)
  }, [])

  // Overrides are stored per mode, so an uncommitted dark-mode drag must not
  // be shown against light's values if the resolved mode changes mid-drag.
  useEffect(() => writeDraft({}), [mode, writeDraft])

  const handleReset = useCallback(() => {
    writeDraft({})
    resetOverrides()
  }, [resetOverrides, writeDraft])

  /**
   * Persists a knob's pending value and drops it from the draft.
   *
   * Radix only fires `onValueCommit` when the value at pointer release differs
   * from the one it snapshotted at pointer press, and it reads both from its
   * render closure. A gesture that begins and ends within a single frame — a
   * quick flick, which is how a knob usually gets thrown to one end — leaves
   * React no chance to re-render in between, so Radix sees no change and never
   * commits. The knob had still been previewed imperatively, so the new value
   * was on screen and in the slider while nothing was written; the next knob
   * that did commit then let `applyThemeOverrides` strip the unsaved custom
   * property, resetting the knob to its stylesheet default while the slider
   * carried on showing the dragged number.
   *
   * Flushing on pointer release too means persistence no longer depends on
   * that callback firing. Both paths are idempotent: whichever runs first
   * clears the draft entry, and the other then finds nothing to do.
   */
  const commitDraft = useCallback(
    (key: ThemeOverrideKey, committed?: number) => {
      // Prefer the draft: it holds the last previewed value, which is also the
      // freshest one when Radix commits a value from an earlier render.
      const pending = draftRef.current[key] ?? committed
      if (pending === undefined) return

      setOverride(key, pending)
      const { [key]: _flushed, ...rest } = draftRef.current
      writeDraft(rest)
    },
    [setOverride, writeDraft]
  )

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
                  writeDraft({ ...draftRef.current, [knob.key]: next })
                  previewThemeOverride(knob, next)
                }}
                onValueCommit={([next]) => commitDraft(knob.key, next)}
                // Fires after every pointer gesture, including the ones Radix
                // decides not to commit.
                onLostPointerCapture={() => commitDraft(knob.key)}
              />
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
