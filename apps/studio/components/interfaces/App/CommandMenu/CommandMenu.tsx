import { IS_PLATFORM } from 'common'
import { useBranchCommands } from 'components/interfaces/BranchManagement/Branch.Commands'
import { useSnippetCommands } from 'components/layouts/SQLEditorLayout/SqlEditor.Commands'
import { useGenerateSqlCommand } from 'components/interfaces/SqlGenerator/SqlGenerator.Commands'
import { useLayoutNavCommands } from 'components/layouts/useLayoutNavCommands'
import { CommandHeader, CommandInput, CommandList, CommandMenu } from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'
import { useApiKeysCommands } from './ApiKeys'
import { useApiUrlCommand } from './ApiUrl'
import { useProjectSwitchCommand } from './ProjectSwitcher'
import { useSupportCommands } from './Support'
import { orderCommandSectionsByPriority } from './ordering'

export default function StudioCommandMenu() {
  useGenerateSqlCommand()
  useApiKeysCommands()
  useApiUrlCommand()
  useProjectSwitchCommand()
  useBranchCommands()
  useSnippetCommands()
  useLayoutNavCommands()
  useDocsSearchCommands({
    options: { orderSection: orderCommandSectionsByPriority, sectionMeta: { priority: 3 } },
  })
  useDocsAiCommands({
    options: { orderSection: orderCommandSectionsByPriority, sectionMeta: { priority: 3 } },
  })
  useSupportCommands()
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
