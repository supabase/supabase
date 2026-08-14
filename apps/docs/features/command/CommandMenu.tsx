import {
  CommandHeader,
  CommandMenu,
  CommandMenuInput,
  CommandMenuList,
} from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useSupportCommands } from 'ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'

import { useDocsNavCommands } from '../../components/Navigation/Navigation.commands'
import { useQuickstartCommands } from './Quickstarts'

const DocsCommandMenu = () => {
  useDocsSearchCommands({
    modify: (command) => ({ ...command, forceMount: true }),
    options: { forceMountSection: true },
  })
  useDocsAiCommands({ modify: (command) => ({ ...command, forceMount: true }) })
  useDocsNavCommands()
  useQuickstartCommands()
  useSupportCommands()
  useChangelogCommand()
  useThemeSwitcherCommands()

  return (
    <CommandMenu>
      <CommandHeader>
        <CommandMenuInput />
      </CommandHeader>
      <CommandMenuList />
    </CommandMenu>
  )
}

export { DocsCommandMenu as default }
