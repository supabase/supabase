import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'

import { DEFAULT_SIDEBAR_BEHAVIOR } from 'components/interfaces/Sidebar'
import Panel from 'components/ui/Panel'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { BASE_PATH } from 'lib/constants'
import {
  Label_Shadcn_,
  RadioGroup_Shadcn_,
  RadioGroupLargeItem_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  singleThemes,
  Theme,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { LOCAL_STORAGE_KEYS } from 'common'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

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

  function SingleThemeSelection() {
    return (
      <form>
        <RadioGroup_Shadcn_
          name="theme"
          onValueChange={setTheme}
          aria-label="Choose a theme"
          defaultValue={theme}
          value={theme}
          className="flex flex-wrap gap-2 xl:gap-4"
        >
          {singleThemes.map((theme: Theme) => (
            <RadioGroupLargeItem_Shadcn_
              className="p-3 flex-grow w-32 lg:w-36 xl:w-40"
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

  return (
    <Panel title={<h5 key="panel-title">Appearance</h5>}>
      <Panel.Content className="space-y-4 !py-4">
        <FormLayout
          layout="flex-row-reverse"
          label="Theme mode"
          description="Choose how Supabase looks to you. Select a single theme, or sync with your system."
          className="!flex !flex-col-reverse lg:!flex-row-reverse items-start [&>div]:lg:w-1/2 [&>div>div]:md:w-full"
        >
          <SingleThemeSelection />
        </FormLayout>
      </Panel.Content>
      <Separator className="bg-border" />
      <Panel.Content>
        <FormLayout
          label="Sidebar behavior"
          layout="flex-row-reverse"
          description="Choose your preferred sidebar behavior: open, closed, or expand on hover."
        >
          <Select_Shadcn_
            value={sidebarBehaviour}
            onValueChange={setSidebarBehaviour}
            aria-label="Select an option"
          >
            <SelectTrigger_Shadcn_>
              <SelectValue_Shadcn_ placeholder="Choose an option" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="open">Expanded</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="closed">Collapsed</SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="expandable">Expand on hover</SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </FormLayout>
      </Panel.Content>
    </Panel>
  )
}
