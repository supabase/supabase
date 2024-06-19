import Panel from 'components/ui/Panel'
import { BASE_PATH } from 'lib/constants'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'
import {
  Label_Shadcn_,
  RadioGroupLargeItem_Shadcn_,
  RadioGroup_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Theme,
  prefixedThemes,
  singleThemes,
} from 'ui'

const ThemeSettings = () => {
  const [mounted, setMounted] = useState(false)

  // @ts-expect-error // remove this ts error if you use this file
  const { theme, setTheme, setSystemPrefixResolve, themePrefix } = useTheme()
  const [mode, setMode] = useState<'system' | 'single-theme'>(
    theme === 'system' ? 'system' : 'single-theme'
  )
  const [prefixedTheme, setPrefixedThemeState] = useState(themePrefix === '' ? 'dark' : themePrefix)

  /**
   * Avoid Hydration Mismatch
   * https://github.com/pacocoursey/next-themes?tab=readme-ov-file#avoid-hydration-mismatch
   */
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  function SingleThemeSelection() {
    return (
      <form>
        <RadioGroup_Shadcn_
          onValueChange={setTheme}
          aria-label="Choose a theme"
          defaultValue={theme}
          value={theme}
          className="flex flex-wrap gap-3"
        >
          {singleThemes
            .filter((x) => x.value !== 'system')
            .map((theme: Theme) => (
              <RadioGroupLargeItem_Shadcn_ key={theme.value} value={theme.value} label={theme.name}>
                <SVG src={`${BASE_PATH}/img/themes/${theme.value}.svg`} />
              </RadioGroupLargeItem_Shadcn_>
            ))}
        </RadioGroup_Shadcn_>
      </form>
    )
  }

  function PrefixThemeSelection() {
    return (
      <form>
        <RadioGroup_Shadcn_
          onValueChange={(value) => {
            setSystemPrefixResolve(value)
            setPrefixedThemeState(value === '' ? 'dark' : value)
          }}
          aria-label="Choose a preferred dark mode"
          defaultValue={prefixedTheme}
          value={prefixedTheme}
          className="flex flex-wrap gap-3"
        >
          <RadioGroupLargeItem_Shadcn_ key={'dark'} value={'dark'} label={'Dark'}>
            <SVG src={`${BASE_PATH}/img/themes/dark.svg`} />
          </RadioGroupLargeItem_Shadcn_>
          {prefixedThemes.map((prefix: Theme) => (
            <RadioGroupLargeItem_Shadcn_
              key={prefix.value}
              value={prefix.value}
              label={prefix.name}
            >
              <SVG src={`${BASE_PATH}/img/themes/${prefix.value}-dark.svg`} />
            </RadioGroupLargeItem_Shadcn_>
          ))}
        </RadioGroup_Shadcn_>
      </form>
    )
  }

  {
    mode === 'system' && (
      <Select_Shadcn_
        onValueChange={(value: string) => {
          setSystemPrefixResolve(value)
          setPrefixedThemeState(value === '' ? 'dark' : value)
        }}
        name="theme-mode"
        value={prefixedTheme}
      >
        <SelectTrigger_Shadcn_ className="w-32">
          <SelectValue_Shadcn_ placeholder="Choose a prefix">{prefixedTheme}</SelectValue_Shadcn_>
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          <SelectItem_Shadcn_ key={'dark'} value={'dark'}>
            dark
          </SelectItem_Shadcn_>
          {prefixedThemes.map((prefix: Theme) => (
            <SelectItem_Shadcn_ key={prefix.value} value={prefix.value}>
              {prefix.name}
            </SelectItem_Shadcn_>
          ))}
        </SelectContent_Shadcn_>
      </Select_Shadcn_>
    )
  }

  const themeModes = {
    'single-theme': {
      value: 'single-theme',
      label: 'Single theme',
    },
    system: {
      value: 'system',
      label: 'Sync with system',
    },
  }

  return (
    <Panel title={<h5 key="panel-title">Appearance</h5>}>
      <Panel.Content className="grid grid-cols-12">
        <div className="col-span-4 flex flex-col gap-5">
          <Label_Shadcn_ htmlFor="theme-mode" className="text-light">
            Theme mode
          </Label_Shadcn_>
          <p className="text-sm text-foreground-light max-w-[220px]">
            Choose how Supabase looks to you. Select a single theme, or sync with your system.
          </p>
        </div>

        <div className="col-span-8 flex flex-col gap-4">
          <Select_Shadcn_
            onValueChange={(value: 'system' | 'single-theme') => {
              setMode(value)
              if (value === 'system') {
                setTheme('system')
              } else {
                setTheme('dark')
                // reset prefix
                setSystemPrefixResolve('')
              }
            }}
            value={mode}
            name="theme-mode"
          >
            <SelectTrigger_Shadcn_ className="w-40">
              <SelectValue_Shadcn_ placeholder="Choose a mode">
                {themeModes[mode].label}
              </SelectValue_Shadcn_>
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ key={'single-theme'} value={'single-theme'}>
                Single theme
              </SelectItem_Shadcn_>
              <SelectItem_Shadcn_ key={'system'} value={'system'}>
                Sync with system
              </SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
          {mode === 'single-theme' && (
            <>
              <p className="text-sm text-light">Supabase will use your selected theme</p>
              <SingleThemeSelection />
            </>
          )}
          {mode === 'system' && (
            <>
              <p className="text-sm text-light">Choose your preferred dark mode</p>
              <PrefixThemeSelection />
            </>
          )}
        </div>
      </Panel.Content>
    </Panel>
  )
}

export default ThemeSettings
