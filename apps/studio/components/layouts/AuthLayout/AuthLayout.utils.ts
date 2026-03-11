import { useFlag, useParams } from 'common'
import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export const useGenerateAuthMenu = (): ProductMenuGroup[] => {
  const { ref } = useParams()
  const authenticationShowOverview = useFlag('authOverviewPage')

  const {
    authenticationSignInProviders,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationPerformance,
  } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
    'authentication:rate_limits',
    'authentication:emails',
    'authentication:multi_factor',
    'authentication:attack_protection',
    'authentication:performance',
  ])

  const baseUrl = `/project/${ref}/auth`

  return [
    {
      title: 'Manage',
      items: [
        ...(authenticationShowOverview
          ? [{ name: 'Overview', key: 'overview', url: `${baseUrl}/overview`, items: [] }]
          : []),
        { name: 'Users', key: 'users', url: `${baseUrl}/users`, items: [] },
        {
          name: 'OAuth Apps',
          key: 'oauth-apps',
          url: `${baseUrl}/oauth-apps`,
          items: [],
        },
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
                      url: `${baseUrl}/templates`,
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
          url: `${baseUrl}/policies`,
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
                      url: `${baseUrl}/providers`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: 'OAuth Server',
                key: 'oauth-server',
                url: `${baseUrl}/oauth-server`,
                label: 'Beta',
              },
              {
                name: 'Sessions',
                key: 'sessions',
                url: `${baseUrl}/sessions`,
                items: [],
              },
              ...(authenticationRateLimits
                ? [
                    {
                      name: 'Rate Limits',
                      key: 'rate-limits',
                      url: `${baseUrl}/rate-limits`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationMultiFactor
                ? [
                    {
                      name: 'Multi-Factor',
                      key: 'mfa',
                      url: `${baseUrl}/mfa`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: 'URL Configuration',
                key: 'url-configuration',
                url: `${baseUrl}/url-configuration`,
                items: [],
              },
              ...(authenticationAttackProtection
                ? [
                    {
                      name: 'Attack Protection',
                      key: 'protection',
                      url: `${baseUrl}/protection`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: 'Auth Hooks',
                key: 'hooks',
                url: `${baseUrl}/hooks`,
                items: [],
                label: 'Beta',
              },
              {
                name: 'Audit Logs',
                key: 'audit-logs',
                url: `${baseUrl}/audit-logs`,
                items: [],
              },
              ...(authenticationPerformance
                ? [
                    {
                      name: 'Performance',
                      key: 'performance',
                      url: `${baseUrl}/performance`,
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
