import { useTheme } from 'next-themes'
import { IconMoon, IconSun, Listbox, themes } from 'ui'

import Panel from 'components/ui/Panel'

const ThemeSettings = () => {
  const { theme, resolvedTheme, setTheme } = useTheme()

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
          {themes.map((theme) => (
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
