import { LayoutDashboard } from 'lucide-react'
import {
  CommandInput,
  CommandList,
  CommandMenu,
  useRegisterCommands,
} from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useSupportCommands } from 'ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'

const useOpenDashboardCommand = () => {
  useRegisterCommands('Dashboard', [
    {
      id: 'dashboard',
      name: 'Go to your Dashboard',
      route: '/dashboard',
      icon: () => <LayoutDashboard />,
    },
  ])
}

const WwwCommandMenu = () => {
  useDocsSearchCommands()
  useOpenDashboardCommand()
  useDocsAiCommands()
  useSupportCommands()
  useChangelogCommand()
  useThemeSwitcherCommands()

  return (
    <CommandMenu>
      <CommandInput />
      <CommandList />
    </CommandMenu>
  )
}

export { WwwCommandMenu as default }
