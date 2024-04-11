import { CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useSupportCommands } from 'ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'
import { useQuickstartCommands } from './Quickstarts'

const DocsCommandMenu = () => {
  useDocsSearchCommands({
    modify: (command) => ({ ...command, forceMount: true }),
    options: { forceMountSection: true },
  })
  useDocsAiCommands({ modify: (command) => ({ ...command, forceMount: true }) })
  useQuickstartCommands()
  useSupportCommands()
  useThemeSwitcherCommands()

  return (
    <CommandMenu>
      <CommandInput />
      <CommandList />
    </CommandMenu>
  )
}

export { DocsCommandMenu as default }
