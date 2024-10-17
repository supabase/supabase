import Panel from 'components/ui/Panel'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { BASE_PATH, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'
import {
  Label_Shadcn_,
  RadioGroup_Shadcn_,
  RadioGroupLargeItem_Shadcn_,
  Separator,
  singleThemes,
  Switch,
  Theme,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const ThemeSettings = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  const [allowNavPanelToExpand, setAllowNavPanelToExpand] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.EXPAND_NAVIGATION_PANEL,
    true
  )

  const [expandNavigationPanel, setExpandNavigationPanel] = useState(allowNavPanelToExpand)

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
          name="theme"
          onValueChange={setTheme}
          aria-label="Choose a theme"
          defaultValue={theme}
          value={theme}
          className="flex flex-wrap gap-5"
        >
          {singleThemes.map((theme: Theme) => (
            <RadioGroupLargeItem_Shadcn_
              className="grow p-3"
              key={theme.value}
              value={theme.value}
              label={theme.name}
            >
              <SVG src={`${BASE_PATH}/img/themes/${theme.value}.svg?v=2`} />
            </RadioGroupLargeItem_Shadcn_>
          ))}
        </RadioGroup_Shadcn_>
      </form>
    )
  }

  function handleExpandNavigationPanel() {
    setExpandNavigationPanel(!expandNavigationPanel)
    setAllowNavPanelToExpand(!allowNavPanelToExpand)
  }

  return (
    <Panel title={<h5 key="panel-title">Appearance</h5>}>
      <Panel.Content className="grid gap-8">
        <div className="grid grid-cols-12">
          <div className="col-span-4 flex flex-col gap-5">
            <Label_Shadcn_ htmlFor="theme" className="text-light">
              Theme mode
            </Label_Shadcn_>
            <p className="text-sm text-foreground-light max-w-[220px]">
              Choose how Supabase looks to you. Select a single theme, or sync with your system.
            </p>
          </div>

          <div className="col-span-8 flex flex-col gap-4">
            <p className="text-sm text-light">Supabase will use your selected theme</p>
            <SingleThemeSelection />
          </div>
        </div>

        <Separator />

        <FormItemLayout
          isReactForm={false}
          label="Expand Navigation menu"
          layout="flex-row-reverse"
          description="Allow the Navigation panel to expand on hover"
          className="pb-3"
        >
          <Switch
            size="large"
            checked={expandNavigationPanel}
            onCheckedChange={() => handleExpandNavigationPanel()}
          />
        </FormItemLayout>
      </Panel.Content>
    </Panel>
  )
}

export default ThemeSettings
