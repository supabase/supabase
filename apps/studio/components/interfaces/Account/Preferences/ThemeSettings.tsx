import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'

import { LOCAL_STORAGE_KEYS } from 'common'
import { DEFAULT_SIDEBAR_BEHAVIOR } from 'components/interfaces/Sidebar'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { BASE_PATH } from 'lib/constants'
import {
  Card,
  CardContent,
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
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

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
      <RadioGroup_Shadcn_
        name="theme"
        onValueChange={setTheme}
        aria-label="Choose a theme"
        defaultValue={theme}
        value={theme}
        className="grid grid-cols-2 gap-4"
      >
        {singleThemes.map((theme: Theme) => (
          <RadioGroupLargeItem_Shadcn_
            className="p-3 w-full"
            key={theme.value}
            value={theme.value}
            label={theme.name}
          >
            <SVG src={`${BASE_PATH}/img/themes/${theme.value}.svg?v=2`} />
          </RadioGroupLargeItem_Shadcn_>
        ))}
      </RadioGroup_Shadcn_>
    )
  }

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
              <Label_Shadcn_ htmlFor="theme" className="text-foreground">
                Theme mode
              </Label_Shadcn_>
              <p className="text-sm text-foreground-light">
                Choose how Supabase looks to you. Select a single theme, or sync with your system.
              </p>
            </div>

            <div className="col-span-full md:col-span-8 flex flex-col gap-4">
              <SingleThemeSelection />
            </div>
          </CardContent>
          <Separator />
          <CardContent>
            <FormItemLayout
              isReactForm={false}
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
            </FormItemLayout>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
