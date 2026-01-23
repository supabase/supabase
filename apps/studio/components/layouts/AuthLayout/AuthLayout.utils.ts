import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateAuthMenu = (
  ref: string,
  flags?: {
    authenticationSignInProviders: boolean
    authenticationRateLimits: boolean
    authenticationEmails: boolean
    authenticationMultiFactor: boolean
    authenticationAttackProtection: boolean
    authenticationShowOverview: boolean
    authenticationOauth21: boolean
    authenticationPerformance: boolean
  }
): ProductMenuGroup[] => {
  const {
    authenticationSignInProviders,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationShowOverview,
    authenticationOauth21,
    authenticationPerformance,
  } = flags ?? {}

  return [
    {
      title: 'Manage',
      items: [
        ...(authenticationShowOverview
          ? [{ name: 'Overview', key: 'overview', url: `/project/${ref}/auth/overview`, items: [] }]
          : []),
        { name: 'Users', key: 'users', url: `/project/${ref}/auth/users`, items: [] },
        ...(authenticationOauth21
          ? [
              {
                name: 'OAuth Apps',
                key: 'oauth-apps',
                url: `/project/${ref}/auth/oauth-apps`,
                items: [],
              },
            ]
          : []),
      ],
    },
    ...(authenticationEmails && IS_PLATFORM
      ? [
          {
            title: 'Notifications',
            items: [
              ...(authenticationEmails
                ? [
                    {
                      name: 'Email',
                      key: 'email',
                      pages: ['templates', 'smtp'],
                      url: `/project/${ref}/auth/templates`,
                      items: [],
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    {
      title: 'Configuration',
      items: [
        {
          name: 'Policies',
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              ...(authenticationSignInProviders
                ? [
                    {
                      name: 'Sign In / Providers',
                      key: 'sign-in-up',
                      pages: ['providers', 'third-party'],
                      url: `/project/${ref}/auth/providers`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationOauth21
                ? [
                    {
                      name: 'OAuth Server',
                      key: 'oauth-server',
                      url: `/project/${ref}/auth/oauth-server`,
                      label: 'Beta',
                    },
                  ]
                : []),
              {
                name: 'Sessions',
                key: 'sessions',
                url: `/project/${ref}/auth/sessions`,
                items: [],
              },
              {
                name: 'JWT Keys',
                key: 'jwt',
                url: `/project/${ref}/auth/jwt`,
                items: [],
              },
              ...(authenticationRateLimits
                ? [
                    {
                      name: 'Rate Limits',
                      key: 'rate-limits',
                      url: `/project/${ref}/auth/rate-limits`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationMultiFactor
                ? [
                    {
                      name: 'Multi-Factor',
                      key: 'mfa',
                      url: `/project/${ref}/auth/mfa`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: 'URL Configuration',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              ...(authenticationAttackProtection
                ? [
                    {
                      name: 'Attack Protection',
                      key: 'protection',
                      url: `/project/${ref}/auth/protection`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: 'Auth Hooks',
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: 'Beta',
              },
              {
                name: 'Audit Logs',
                key: 'audit-logs',
                url: `/project/${ref}/auth/audit-logs`,
                items: [],
              },
              ...(authenticationPerformance
                ? [
                    {
                      name: 'Performance',
                      key: 'performance',
                      url: `/project/${ref}/auth/performance`,
                      items: [],
                    },
                  ]
                : []),
            ]
          : []),
      ],
    },
  ]
}
