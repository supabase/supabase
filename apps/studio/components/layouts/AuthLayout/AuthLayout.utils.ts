import { useFlag, useParams } from 'common'

import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

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
    passkeys?: boolean
  }
}

export function generateAuthMenu(options: GenerateAuthMenuOptions): ProductMenuGroup[] {
  const { ref, isPlatform, showOverview, features } = options
  const passkeysInMenu = Boolean(features.passkeys)
  const baseUrl = `/project/${ref}/auth`

  return [
    {
      title: 'Manage',
      items: [
        ...(showOverview
          ? [
              {
                name: 'Overview',
                key: 'overview',
                url: `${baseUrl}/overview`,
                items: [],
                shortcutId: SHORTCUT_IDS.NAV_AUTH_OVERVIEW,
              },
            ]
          : []),
        {
          name: 'Users',
          key: 'users',
          url: `${baseUrl}/users`,
          items: [],
          shortcutId: SHORTCUT_IDS.NAV_AUTH_USERS,
        },
        ...(isPlatform
          ? [
              {
                name: 'OAuth Apps',
                key: 'oauth-apps',
                url: `${baseUrl}/oauth-apps`,
                items: [],
                shortcutId: SHORTCUT_IDS.NAV_AUTH_OAUTH_APPS,
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
                      shortcutId: SHORTCUT_IDS.NAV_AUTH_EMAIL,
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
          shortcutId: SHORTCUT_IDS.NAV_AUTH_POLICIES,
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
                      shortcutId: SHORTCUT_IDS.NAV_AUTH_SIGN_IN,
                    },
                  ]
                : []),
              ...(passkeysInMenu
                ? [
                    {
                      name: 'Passkeys',
                      key: 'passkeys',
                      url: `${baseUrl}/passkeys`,
                      label: 'Beta',
                      shortcutId: SHORTCUT_IDS.NAV_AUTH_PASSKEYS,
                    },
                  ]
                : []),
              {
                name: 'OAuth Server',
                key: 'oauth-server',
                url: `${baseUrl}/oauth-server`,
                label: 'Beta',
                shortcutId: SHORTCUT_IDS.NAV_AUTH_OAUTH_SERVER,
              },
              {
                name: 'Sessions',
                key: 'sessions',
                url: `${baseUrl}/sessions`,
                items: [],
                shortcutId: SHORTCUT_IDS.NAV_AUTH_SESSIONS,
              },
              ...(features.rateLimits
                ? [
                    {
                      name: 'Rate Limits',
                      key: 'rate-limits',
                      url: `${baseUrl}/rate-limits`,
                      items: [],
                      shortcutId: SHORTCUT_IDS.NAV_AUTH_RATE_LIMITS,
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
                      shortcutId: SHORTCUT_IDS.NAV_AUTH_MFA,
                    },
                  ]
                : []),
              {
                name: 'URL Configuration',
                key: 'url-configuration',
                url: `${baseUrl}/url-configuration`,
                items: [],
                shortcutId: SHORTCUT_IDS.NAV_AUTH_URL_CONFIGURATION,
              },
              ...(features.attackProtection
                ? [
                    {
                      name: 'Attack Protection',
                      key: 'protection',
                      url: `${baseUrl}/protection`,
                      items: [],
                      shortcutId: SHORTCUT_IDS.NAV_AUTH_PROTECTION,
                    },
                  ]
                : []),
              {
                name: 'Auth Hooks',
                key: 'hooks',
                url: `${baseUrl}/hooks`,
                items: [],
                label: 'Beta',
                shortcutId: SHORTCUT_IDS.NAV_AUTH_HOOKS,
              },
              {
                name: 'Audit Logs',
                key: 'audit-logs',
                url: `${baseUrl}/audit-logs`,
                items: [],
                shortcutId: SHORTCUT_IDS.NAV_AUTH_AUDIT_LOGS,
              },
              ...(features.performance
                ? [
                    {
                      name: 'Performance',
                      key: 'performance',
                      url: `${baseUrl}/performance`,
                      items: [],
                      shortcutId: SHORTCUT_IDS.NAV_AUTH_PERFORMANCE,
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
  const enablePasskeyAuth = useFlag('enablePasskeyAuth')

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
      passkeys: enablePasskeyAuth,
    },
  })
}
