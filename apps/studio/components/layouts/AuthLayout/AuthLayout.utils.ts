import { useFlag, useParams } from 'common'

import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'

export interface GenerateAuthMenuOptions {
  ref?: string
  isPlatform: boolean
  showOverview: boolean
  features: {
    signInProviders: boolean
    rateLimits: boolean
    emails: boolean
    multiFactor: boolean
    attackProtection: boolean
    performance: boolean
  }
}

export function generateAuthMenu(options: GenerateAuthMenuOptions): ProductMenuGroup[] {
  const { ref, isPlatform, showOverview, features } = options
  const baseUrl = `/project/${ref}/auth`

  return [
    {
      title: 'Manage',
      items: [
        ...(showOverview
          ? [{ name: 'Overview', key: 'overview', url: `${baseUrl}/overview`, items: [] }]
          : []),
        { name: 'Users', key: 'users', url: `${baseUrl}/users`, items: [] },
        ...(isPlatform
          ? [
              {
                name: 'OAuth Apps',
                key: 'oauth-apps',
                url: `${baseUrl}/oauth-apps`,
                items: [],
              },
            ]
          : []),
      ],
    },
    ...(features.emails && isPlatform
      ? [
          {
            title: 'Notifications',
            items: [
              ...(features.emails
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
        ...(isPlatform
          ? [
              ...(features.signInProviders
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
              ...(features.rateLimits
                ? [
                    {
                      name: 'Rate Limits',
                      key: 'rate-limits',
                      url: `${baseUrl}/rate-limits`,
                      items: [],
                    },
                  ]
                : []),
              ...(features.multiFactor
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
              ...(features.attackProtection
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
              ...(features.performance
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

export const useGenerateAuthMenu = (): ProductMenuGroup[] => {
  const { ref } = useParams()
  const showOverview = useFlag('authOverviewPage')

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

  return generateAuthMenu({
    ref,
    isPlatform: IS_PLATFORM,
    showOverview,
    features: {
      signInProviders: authenticationSignInProviders,
      rateLimits: authenticationRateLimits,
      emails: authenticationEmails,
      multiFactor: authenticationMultiFactor,
      attackProtection: authenticationAttackProtection,
      performance: authenticationPerformance,
    },
  })
}
