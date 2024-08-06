import { IS_PLATFORM } from 'common'
import { useAdvisorsLintCommands } from 'components/layouts/AdvisorsLayout/Advisors.Commands'
import { CommandHeader, CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useSupportCommands } from 'ui-patterns/CommandMenu/prepackaged/Support'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'
import { useBranchCommands } from 'components/interfaces/BranchManagement/Branch.Commands'
import { useApiKeysCommands } from './ApiKeys'
import { useProjectSwitchCommand } from './ProjectSwitcher'
import { useLayoutNavCommands } from 'components/layouts/useLayoutNavCommands'
import { useApiUrlCommand } from './ApiUrl'

export default function StudioCommandMenu() {
  useAdvisorsLintCommands()
  useApiKeysCommands()
  useApiUrlCommand()
  useProjectSwitchCommand()
  useBranchCommands()
  useLayoutNavCommands()
  useDocsSearchCommands()
  useDocsAiCommands()
  useSupportCommands({ enabled: IS_PLATFORM })
  useChangelogCommand({ enabled: IS_PLATFORM })
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
