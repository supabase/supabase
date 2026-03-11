import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetCommandMenuOpen,
  useSetPage,
  type CommandOptions,
} from '..'
import { Monitor, MonitorDot, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { themes } from 'ui/src/components/ThemeProvider/themes'

const THEME_SWITCHER_PAGE_NAME = 'Switch theme'

const useThemeSwitcherCommands = ({ options }: { options?: CommandOptions } = {}) => {
  const setIsOpen = useSetCommandMenuOpen()
  const setPage = useSetPage()

  const { resolvedTheme, setTheme } = useTheme()

  const applyTheme = (theme: string) => {
    setTheme(theme)
    setIsOpen(false)
  }

  useRegisterPage(THEME_SWITCHER_PAGE_NAME, {
    type: PageType.Commands,
    sections: [
      {
        id: 'switch-theme',
        name: 'Switch theme',
        commands: themes
          .filter(({ name }) => name === 'System' || name === 'Light' || name === 'Dark')
          .map((theme) => ({
            id: `switch-theme-${theme.value}`,
            name: theme.name,
            value:
              theme.name === 'System'
                ? 'System theme, Follow system appearance'
                : theme.name === 'Light'
                  ? 'Light theme, Light mode'
                  : 'Dark theme, Dark mode',
            action: () => applyTheme(theme.value),
            icon: () =>
              theme.name === 'System' ? <Monitor /> : theme.name === 'Light' ? <Sun /> : <Moon />,
          })),
      },
    ],
  })

  useRegisterCommands(
    'Theme',
    [
      {
        id: 'toggle-theme',
        name: 'Toggle theme',
        value:
          'Toggle theme, Toggle dark mode, Toggle light mode, Theme toggle, Dark mode, Light mode',
        action: () => applyTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
        defaultHidden: true,
        icon: () => <MonitorDot />,
      },
      {
        id: 'set-theme-dark',
        name: 'Use dark theme',
        value: 'Dark theme, Dark mode, Switch to dark theme, Set theme dark',
        action: () => applyTheme('dark'),
        defaultHidden: true,
        icon: () => <Moon />,
      },
      {
        id: 'set-theme-light',
        name: 'Use light theme',
        value: 'Light theme, Light mode, Switch to light theme, Set theme light',
        action: () => applyTheme('light'),
        defaultHidden: true,
        icon: () => <Sun />,
      },
      {
        id: 'set-theme-system',
        name: 'Use system theme',
        value: 'System theme, Follow system theme, Auto theme, Match system appearance',
        action: () => applyTheme('system'),
        defaultHidden: true,
        icon: () => <Monitor />,
      },
      {
        id: 'switch-theme',
        name: 'Switch theme...',
        value:
          'Theme, Switch theme, Change theme, Appearance, Color mode, Dark mode, Light mode, Toggle theme',
        action: () => setPage(THEME_SWITCHER_PAGE_NAME),
        defaultHidden: true,
        icon: () => <MonitorDot />,
      },
    ],
    { ...options, deps: [...(options?.deps ?? []), resolvedTheme] }
  )
}

export { useThemeSwitcherCommands }
