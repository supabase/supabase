import { Lock } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

export function useAuthGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const {
    authenticationSignInProviders,
    authenticationThirdPartyAuth,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationAdvanced,
  } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
    'authentication:third_party_auth',
    'authentication:rate_limits',
    'authentication:emails',
    'authentication:multi_factor',
    'authentication:attack_protection',
    'authentication:advanced',
  ])

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
      ...(authenticationSignInProviders
        ? [
            {
              id: 'nav-auth-providers',
              name: 'Providers',
              value: 'Auth: Providers (Social Login, SSO)',
              route: `/project/${ref}/auth/providers`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationThirdPartyAuth
        ? [
            {
              id: 'nav-auth-providers',
              name: 'Providers (Third Party)',
              value: 'Auth: Providers (Third Party)',
              route: `/project/${ref}/auth/third-party`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-sessions',
        name: 'Sessions',
        value: 'Auth: Sessions (User Sessions)',
        route: `/project/${ref}/auth/sessions`,
        defaultHidden: true,
      },
      ...(authenticationRateLimits
        ? [
            {
              id: 'nav-auth-rate-limits',
              name: 'Rate Limits',
              value: 'Auth: Rate Limits',
              route: `/project/${ref}/auth/rate-limits`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationEmails
        ? [
            {
              id: 'nav-auth-templates',
              name: 'Email Templates',
              value: 'Auth: Email Templates',
              route: `/project/${ref}/auth/templates`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationMultiFactor
        ? [
            {
              id: 'nav-auth-mfa',
              name: 'Multi Factor Authentication (MFA)',
              value: 'Auth: Multi Factor Authenticaiton (MFA)',
              route: `/project/${ref}/auth/mfa`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-url-configuration',
        name: 'URL Configuration',
        value: 'Auth: URL Configuration (Site URL, Redirect URLs)',
        route: `/project/${ref}/auth/url-configuration`,
        defaultHidden: true,
      },
      ...(authenticationAttackProtection
        ? [
            {
              id: 'nav-auth-attack-protection',
              name: 'Attack Protection',
              value: 'Auth: Attack Protection',
              route: `/project/${ref}/auth/protection`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-auth-hooks',
        name: 'Auth Hooks',
        value: 'Auth: Auth Hooks',
        route: `/project/${ref}/auth/hooks`,
        defaultHidden: true,
      },
      ...(authenticationAdvanced
        ? [
            {
              id: 'nav-auth-advanced-settings',
              name: 'Auth Advanced Settings',
              value: 'Auth: Advanced Settings',
              route: `/project/${ref}/auth/advanced`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
    ],
    { ...options, deps: [ref] }
  )
}
