import { CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useSupportCommands } from 'ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'
import { useBranchCommands } from 'components/interfaces/BranchManagement/BranchCommands'
import { useApiKeysCommands } from './ApiKeys'
import { useProjectSwitchCommand } from './ProjectSwitcher'

const StudioCommandMenu = () => {
  useApiKeysCommands()
  useProjectSwitchCommand()
  useBranchCommands()
  useDocsSearchCommands()
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

export { StudioCommandMenu as default }
