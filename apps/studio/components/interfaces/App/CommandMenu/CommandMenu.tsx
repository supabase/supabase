import { IS_PLATFORM } from 'common'
import { CommandHeader, CommandMenu, CommandMenuInput } from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'

import { useApiKeysCommands } from './ApiKeys'
import { useApiUrlCommand } from './ApiUrl'
import { CommandMenuFilterBar } from './CommandMenuFilterBar'
import { useContextSearchCommands } from './ContextSearchCommands'
import { useCreateCommands } from './CreateCommands'
import { useDatabaseResourceCommands } from './DatabaseResourceCommands'
import { useFeaturePreviewCommands } from './FeaturePreviews'
import { FilterableCommandMenuList } from './FilterableCommandMenuList'
import { orderCommandSectionsByPriority } from './ordering'
import { useConfigureOrganizationCommand, useProjectSwitchCommand } from './OrgProjectSwitcher'
import { useSupportCommands } from './Support'
import { useBranchCommands } from '@/components/interfaces/BranchManagement/Branch.Commands'
import { useConnectCommands } from '@/components/interfaces/ConnectButton/Connect.Commands'
import {
  useQueryTableCommands,
  useSnippetCommands,
} from '@/components/layouts/SQLEditorLayout/SqlEditor.Commands'
import { useProjectLevelTableEditorCommands } from '@/components/layouts/TableEditorLayout/TableEditor.Commands'
import { useLayoutNavCommands } from '@/components/layouts/useLayoutNavCommands'

export function CommandMenuInnerContent() {
  return (
    <>
      <CommandHeader>
        <CommandMenuInput />
      </CommandHeader>
      <CommandMenuFilterBar />
      <FilterableCommandMenuList />
    </>
  )
}

export default function StudioCommandMenu() {
  useCreateCommands()
  useApiKeysCommands()
  useApiUrlCommand()
  useConnectCommands()
  useProjectLevelTableEditorCommands()
  useProjectSwitchCommand()
  useConfigureOrganizationCommand()
  useQueryTableCommands()
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
  useContextSearchCommands()
  useFeaturePreviewCommands()
  useDatabaseResourceCommands()

  return (
    <CommandMenu>
      <CommandMenuInnerContent />
    </CommandMenu>
  )
}
