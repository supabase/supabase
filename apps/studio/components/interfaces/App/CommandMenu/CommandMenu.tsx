import { useCallback, useRef, useState } from 'react'
import { IS_PLATFORM } from 'common'
import { useBranchCommands } from 'components/interfaces/BranchManagement/Branch.Commands'
import { useConnectCommands } from 'components/interfaces/Connect/Connect.Commands'
import {
  useQueryTableCommands,
  useSnippetCommands,
} from 'components/layouts/SQLEditorLayout/SqlEditor.Commands'
import { useProjectLevelTableEditorCommands } from 'components/layouts/TableEditorLayout/TableEditor.Commands'
import { useLayoutNavCommands } from 'components/layouts/useLayoutNavCommands'
import {
  CommandHeader,
  CommandInput,
  CommandList,
  CommandMenu,
  useQuery,
  useSetQuery,
} from 'ui-patterns/CommandMenu'
import { useChangelogCommand } from 'ui-patterns/CommandMenu/prepackaged/Changelog'
import { useDocsAiCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsAi'
import { useDocsSearchCommands } from 'ui-patterns/CommandMenu/prepackaged/DocsSearch'
import { useThemeSwitcherCommands } from 'ui-patterns/CommandMenu/prepackaged/ThemeSwitcher'
import { useApiKeysCommands } from './ApiKeys'
import { useApiUrlCommand } from './ApiUrl'
import { useProjectSwitchCommand, useConfigureOrganizationCommand } from './OrgProjectSwitcher'
import { useSupportCommands } from './Support'
import { orderCommandSectionsByPriority } from './ordering'
import {
  SearchContextBadges,
  getSearchContextPlaceholder,
  type SearchContextValue,
} from './SearchContextBadges'
import { ContextSearchResults } from './ContextSearchResults'

function StudioCommandMenuContent({
  searchContext,
  setSearchContext,
}: {
  searchContext: SearchContextValue
  setSearchContext: (value: SearchContextValue) => void
}) {
  const query = useQuery()
  const setQuery = useSetQuery()

  // Store query values per context to restore when switching back
  const queryPerContext = useRef<Partial<Record<SearchContextValue, string>>>({})

  const handleContextChange = useCallback(
    (newContext: SearchContextValue) => {
      // Save current query for the current context
      queryPerContext.current[searchContext] = query

      // Restore query for the new context (or empty string if not visited before)
      const savedQuery = queryPerContext.current[newContext] ?? ''
      setQuery(savedQuery)

      setSearchContext(newContext)
    },
    [searchContext, query, setQuery, setSearchContext]
  )

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

  const isCommandsContext = searchContext === 'commands'

  return (
    <>
      <CommandHeader>
        <CommandInput
          // Commented out: leftIcon dropdown approach
          // leftIcon={<SearchContextSelector value={searchContext} onChange={handleContextChange} />}
          placeholder={getSearchContextPlaceholder(searchContext)}
          wrapperClassName="border-none"
        />
        <SearchContextBadges value={searchContext} onChange={handleContextChange} />
      </CommandHeader>
      {isCommandsContext ? (
        <CommandList />
      ) : (
        <ContextSearchResults context={searchContext} query={query} />
      )}
    </>
  )
}

export default function StudioCommandMenu() {
  const [searchContext, setSearchContext] = useState<SearchContextValue>('commands')

  return (
    <CommandMenu>
      <StudioCommandMenuContent searchContext={searchContext} setSearchContext={setSearchContext} />
    </CommandMenu>
  )
}
