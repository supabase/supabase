import { useTheme } from 'next-themes'
import { IconMoon, IconSun, Listbox, Theme, themes } from 'ui'

import Panel from 'components/ui/Panel'
import { useEffect, useState } from 'react'

const ThemeSettings = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme, setTheme } = useTheme()

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

  return (
    <Panel title={<h5 key="panel-title">Theme</h5>}>
      <Panel.Content>
        <Listbox
          value={theme}
          label="Interface theme"
          descriptionText="Choose a theme preference"
          layout="horizontal"
          style={{ width: '50%' }}
          icon={resolvedTheme === 'dark' ? <IconMoon /> : <IconSun />}
          onChange={(value: string) => setTheme(value)}
        >
          {themes
            .filter(
              (theme: Theme) =>
                // temporary fix to exclude new themes
                theme.value === 'light' || theme.value === 'dark' || theme.value === 'system'
            )
            .map((theme: Theme) => (
              <Listbox.Option key={theme.value} label={theme.name} value={theme.value}>
                {theme.name}
              </Listbox.Option>
            ))}
        </Listbox>
      </Panel.Content>
    </Panel>
  )
}

export default ThemeSettings
