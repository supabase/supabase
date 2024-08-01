import { CommandHeader, CommandInput, CommandList, CommandMenu } from '@ui-patterns/CommandMenu'
import { useChangelogCommand } from '@ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from '@ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from '@ui-patterns/CommandMenu/prepackaged/DocsSearchLocal'
import { useSupportCommands } from '@ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from '@ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'

import { useQuickstartCommands } from './Quickstarts'
import { useDocsNavCommands } from '../../components/Navigation/Navigation.commands'

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
        <CommandInput />
      </CommandHeader>
      <CommandList />
    </CommandMenu>
  )
}

export { DocsCommandMenu as default }
