'use client'

import { useMemo } from 'react'
import { Database, Users } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import type { ICommand } from 'ui-patterns/CommandMenu'
import {
  Breadcrumb,
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
import { orderCommandSectionsByPriority } from './ordering'
import { ContextSearchResults } from './ContextSearchResults'

export type SearchContextValue =
  | 'users'
  | 'database-tables'
  | 'auth-policies'
  | 'edge-functions'
  | 'storage'

interface SearchContextOption {
  value: SearchContextValue
  label: string
  pageName: string
  placeholder: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const SEARCH_CONTEXT_OPTIONS: SearchContextOption[] = [
  {
    value: 'users',
    label: 'Users',
    pageName: 'Search Users',
    placeholder: 'Search users...',
    icon: Users,
  },
  {
    value: 'database-tables',
    label: 'Database Tables',
    pageName: 'Search Database Tables',
    placeholder: 'Search in database tables...',
    icon: Database,
  },
  {
    value: 'auth-policies',
    label: 'RLS Policies',
    pageName: 'Search RLS Policies',
    placeholder: 'Search in auth policies...',
    icon: Auth,
  },
  {
    value: 'edge-functions',
    label: 'Edge Functions',
    pageName: 'Search Edge Functions',
    placeholder: 'Search in edge functions...',
    icon: EdgeFunctions,
  },
  {
    value: 'storage',
    label: 'Storage',
    pageName: 'Search Storage',
    placeholder: 'Search in storage...',
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
  const setPage = useSetPage()

  // Register pages for each context
  useRegisterPage('Search Users', {
    type: PageType.Component,
    component: () => (
      <ContextSearchPage context="users" placeholder={SEARCH_CONTEXT_OPTIONS[0].placeholder} />
    ),
  })

  useRegisterPage('Search Database Tables', {
    type: PageType.Component,
    component: () => (
      <ContextSearchPage
        context="database-tables"
        placeholder={SEARCH_CONTEXT_OPTIONS[1].placeholder}
      />
    ),
  })

  useRegisterPage('Search RLS Policies', {
    type: PageType.Component,
    component: () => (
      <ContextSearchPage
        context="auth-policies"
        placeholder={SEARCH_CONTEXT_OPTIONS[2].placeholder}
      />
    ),
  })

  useRegisterPage('Search Edge Functions', {
    type: PageType.Component,
    component: () => (
      <ContextSearchPage
        context="edge-functions"
        placeholder={SEARCH_CONTEXT_OPTIONS[3].placeholder}
      />
    ),
  })

  useRegisterPage('Search Storage', {
    type: PageType.Component,
    component: () => (
      <ContextSearchPage context="storage" placeholder={SEARCH_CONTEXT_OPTIONS[4].placeholder} />
    ),
  })

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

  useRegisterCommands('Search your data', contextCommands, {
    orderSection: orderCommandSectionsByPriority,
    sectionMeta: { priority: 2 },
  })
}
