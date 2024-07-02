import { CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useSupportCommands } from 'ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'
import { useBranchCommands } from 'components/interfaces/BranchManagement/BranchCommands'
import { useApiKeysCommands } from './ApiKeys'
import { useProjectSwitchCommand } from './ProjectSwitcher'
import { useLayoutNavCommands } from 'components/layouts/useLayoutNavCommands'
import { useApiUrlCommand } from './ApiUrl'

const StudioCommandMenu = () => {
  useApiKeysCommands()
  useApiUrlCommand()
  useProjectSwitchCommand()
  useBranchCommands()
  useLayoutNavCommands()
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
