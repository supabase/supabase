import { useTheme } from 'common'
import Panel from 'components/ui/Panel'
import { IconMoon, IconSun, Listbox } from 'ui'

const ThemeSettings = () => {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <Panel title={<h5 key="panel-title">Theme</h5>}>
      <Panel.Content>
        <Listbox
          value={isDarkMode ? 'dark' : 'light'}
          label="Interface theme"
          descriptionText="Choose a theme preference"
          layout="horizontal"
          style={{ width: '50%' }}
          icon={isDarkMode ? <IconMoon /> : <IconSun />}
          onChange={(themeOption: any) => toggleTheme(themeOption === 'dark')}
        >
          {/* [Joshen] Removing system default for now, needs to be supported in useTheme from common packages */}
          {/* <Listbox.Option label="System default" value="system">
            System default
          </Listbox.Option> */}
          <Listbox.Option label="Dark" value="dark">
            Dark
          </Listbox.Option>
          <Listbox.Option label="Light" value="light">
            Light
          </Listbox.Option>
        </Listbox>
      </Panel.Content>
    </Panel>
  )
}

export default ThemeSettings
