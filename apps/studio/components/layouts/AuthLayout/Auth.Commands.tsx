import { Lock } from 'lucide-react'

import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useParams } from 'common'

export function useAuthGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    'Actions',
    [
      {
        id: 'create-rls-policy',
        name: 'Create RLS policy',
        value: 'Create RLS (Row Level Security) policy',
        route: `/project/${ref}/auth/policies`,
        icon: () => <Lock />,
      },
    ],
    {
      ...options,
      deps: [ref],
      enabled: (options?.enabled ?? true) && ref !== '_',
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-auth-users',
        name: 'Users',
        value: 'Auth: Users',
        route: `/project/${ref}/auth/users`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-policies',
        name: 'Policies',
        value: 'Auth: Policies (RLS)',
        route: `/project/${ref}/auth/policies`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-providers',
        name: 'Providers',
        value: 'Auth: Providers (Social Login, SSO)',
        route: `/project/${ref}/auth/providers`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-templates',
        name: 'Email Templates',
        value: 'Auth: Email Templates',
        route: `/project/${ref}/auth/templates`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-url-configuration',
        name: 'URL Configuration',
        value: 'Auth: URL Configuration (Site URL, Redirect URLs)',
        route: `/project/${ref}/auth/url-configuration`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
