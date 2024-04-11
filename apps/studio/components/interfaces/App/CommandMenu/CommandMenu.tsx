import { CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useApiKeysCommands } from './ApiKeys'
import { useProjectSwitchCommand } from './ProjectSwitcher'

const StudioCommandMenu = () => {
  useApiKeysCommands()
  useProjectSwitchCommand()
  useDocsSearchCommands()
  useDocsAiCommands()

  return (
    <CommandMenu>
      <CommandInput />
      <CommandList />
    </CommandMenu>
  )
}

export { StudioCommandMenu as default }
