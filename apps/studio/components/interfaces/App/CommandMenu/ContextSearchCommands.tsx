'use client'

import { useMemo } from 'react'
import { Database } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  CommandHeader,
  CommandInput,
  CommandWrapper,
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetPage,
  useQuery,
} from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from './CommandMenu.utils'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { orderCommandSectionsByPriority } from './ordering'
import { ContextSearchResults } from './ContextSearchResults'
import { useFlag } from 'common'

export type SearchContextValue = 'database-tables' | 'auth-policies' | 'edge-functions' | 'storage'

interface SearchContextOption {
  value: SearchContextValue
  label: string
  pageName: string
  placeholder: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const SEARCH_CONTEXT_OPTIONS: SearchContextOption[] = [
  {
    value: 'database-tables',
    label: 'Database Tables',
    pageName: 'Search Database Tables',
    placeholder: 'Search database tables...',
    icon: Database,
  },
  {
    value: 'auth-policies',
    label: 'RLS Policies',
    pageName: 'Search RLS Policies',
    placeholder: 'Search rls policies...',
    icon: Auth,
  },
  {
    value: 'edge-functions',
    label: 'Edge Functions',
    pageName: 'Search Edge Functions',
    placeholder: 'Search edge functions...',
    icon: EdgeFunctions,
  },
  {
    value: 'storage',
    label: 'Storage',
    pageName: 'Search Storage',
    placeholder: 'Search buckets...',
    icon: Storage,
  },
]

function ContextSearchPage({
  context,
  placeholder,
}: {
  context: SearchContextValue
  placeholder: string
}) {
  const query = useQuery()

  return (
    <CommandWrapper>
      <CommandHeader>
        {/* <Breadcrumb /> */}
        <CommandInput placeholder={placeholder} />
      </CommandHeader>
      <ContextSearchResults context={context} query={query} />
    </CommandWrapper>
  )
}

export function useContextSearchCommands() {
  const enableSearchEntitiesCommandMenu = useFlag('enableSearchEntitiesCommandMenu')
  const { data: project } = useSelectedProjectQuery()
  const setPage = useSetPage()

  // Register pages for each context
  const pageDefinitions = [
    { title: 'Search Database Tables', context: 'database-tables' as const },
    { title: 'Search RLS Policies', context: 'auth-policies' as const },
    { title: 'Search Edge Functions', context: 'edge-functions' as const },
    { title: 'Search Storage', context: 'storage' as const },
  ]

  // Register pages - pageDefinitions is constant, so hooks are called in consistent order
  for (const { title, context } of pageDefinitions) {
    const placeholder =
      SEARCH_CONTEXT_OPTIONS.find((opt) => opt.value === context)?.placeholder ?? ''
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRegisterPage(title, {
      type: PageType.Component,
      component: () => <ContextSearchPage context={context} placeholder={placeholder} />,
    })
  }

  // Register top-level commands
  const contextCommands = useMemo(
    () =>
      SEARCH_CONTEXT_OPTIONS.map((option) => ({
        id: `search-${option.value}`,
        name: `Search ${option.label}...`,
        action: () => setPage(option.pageName),
        icon: () => <option.icon className="h-4 w-4" strokeWidth={1.5} />,
      })) as ICommand[],
    [setPage]
  )

  useRegisterCommands(COMMAND_MENU_SECTIONS.QUERY, contextCommands, {
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: 3 },
    enabled: enableSearchEntitiesCommandMenu && !!project,
  })
}
