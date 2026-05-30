import { LOCAL_STORAGE_KEYS } from 'common'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import SVG from 'react-inlinesvg'
import {
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

import { DEFAULT_SIDEBAR_BEHAVIOR } from '@/components/interfaces/Sidebar'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { BASE_PATH } from '@/lib/constants'

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
      <RadioGroup
        name="theme"
        onValueChange={setTheme}
        aria-label="Choose a theme"
        defaultValue={theme}
        value={theme}
        className="grid grid-cols-2 gap-4"
      >
        {singleThemes.map((theme: Theme) => (
          <RadioGroupLargeItem
            className="p-3 w-full"
            key={theme.value}
            value={theme.value}
            label={theme.name}
          >
            <SVG src={`${BASE_PATH}/img/themes/${theme.value}.svg?v=2`} />
          </RadioGroupLargeItem>
        ))}
      </RadioGroup>
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
              <Label htmlFor="theme" className="text-foreground">
                Theme mode
              </Label>
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
