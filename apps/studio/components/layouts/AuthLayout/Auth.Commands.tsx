import { Lock } from 'lucide-react'

import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useParams } from 'common'

export function useAuthGotoCommands(options?: CommandOptions) {
  let { slug, ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    'Actions',
    [
      {
        id: 'create-rls-policy',
        name: 'Create RLS policy',
        value: 'Create RLS (Row Level Security) policy',
        route: `/org/${slug}/project/${ref}/auth/policies`,
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
        route: `/org/${slug}/project/${ref}/auth/users`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-policies',
        name: 'Policies',
        value: 'Auth: Policies (RLS)',
        route: `/org/${slug}/project/${ref}/auth/policies`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-providers',
        name: 'Providers',
        value: 'Auth: Providers (Social Login, SSO)',
        route: `/org/${slug}/project/${ref}/auth/providers`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-providers',
        name: 'Providers (Third Party)',
        value: 'Auth: Providers (Third Party)',
        route: `/org/${slug}/project/${ref}/auth/third-party`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-sessions',
        name: 'Sessions',
        value: 'Auth: Sessions (User Sessions)',
        route: `/org/${slug}/project/${ref}/auth/sessions`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-rate-limits',
        name: 'Rate Limits',
        value: 'Auth: Rate Limits',
        route: `/org/${slug}/project/${ref}/auth/rate-limits`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-templates',
        name: 'Email Templates',
        value: 'Auth: Email Templates',
        route: `/org/${slug}/project/${ref}/auth/templates`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-mfa',
        name: 'Multi Factor Authentication (MFA)',
        value: 'Auth: Multi Factor Authenticaiton (MFA)',
        route: `/org/${slug}/project/${ref}/auth/mfa`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-url-configuration',
        name: 'URL Configuration',
        value: 'Auth: URL Configuration (Site URL, Redirect URLs)',
        route: `/org/${slug}/project/${ref}/auth/url-configuration`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-attack-protection',
        name: 'Attack Protection',
        value: 'Auth: Attack Protection',
        route: `/org/${slug}/project/${ref}/auth/protection`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-auth-hooks',
        name: 'Auth Hooks',
        value: 'Auth: Auth Hooks',
        route: `/org/${slug}/project/${ref}/auth/hooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-advanced-settings',
        name: 'Auth Advanced Settings',
        value: 'Auth: Advanced Settings',
        route: `/org/${slug}/project/${ref}/auth/advanced`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
