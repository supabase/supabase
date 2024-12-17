import { useParams } from 'common'
import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateAuthMenu = (): ProductMenuGroup[] => {
  const ref = useParams()
  console.log('generateAuthMenu params', ref)
  return [
    {
      title: 'Manage',
      items: [{ name: 'Users', key: 'users', url: `/project/${ref}/auth/users`, items: [] }],
    },
    {
      title: 'Configuration',
      items: [
        // {
        //   name: 'Policies',
        //   key: 'policies',
        //   url: `/project/${ref}/auth/policies`,
        //   items: [],
        // },
        ...(IS_PLATFORM
          ? [
              {
                name: 'Sign-in method',
                key: 'Sign-in method',
                url: `/project/${ref}/auth/providers`,
                items: [],
              },
              {
                name: 'Session',
                key: 'session',
                url: `/project/${ref}/auth/session`,
                items: [],
              },
              {
                name: 'MFA',
                key: 'mfa',
                url: `/project/${ref}/auth/mfa`,
                items: [],
              },
              {
                name: 'Third party',
                key: 'third-party',
                url: `/project/${ref}/auth/third-party`,
                items: [],
              },
              {
                name: 'Social login',
                key: 'providers',
                url: `/project/${ref}/auth/social-login`,
                items: [],
              },
              {
                name: 'Rate Limits',
                key: 'rate-limits',
                url: `/project/${ref}/auth/rate-limits`,
                items: [],
              },
              {
                name: 'Email Templates',
                key: 'templates',
                url: `/project/${ref}/auth/templates`,
                items: [],
              },
              {
                name: 'URL Configuration',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              {
                name: 'Hooks',
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: 'BETA',
              },
              {
                name: 'Configuration',
                key: 'configuration',
                url: `/project/${ref}/auth/configuration`,
                items: [],
                label: 'BETA',
              },
            ]
          : []),
      ],
    },
  ]
}

export const generateAuthConfigurationMenu = (): ProductMenuGroup[] => {
  const ref = useParams()
  console.log('generateAuthConfigurationMenu params', ref)
  return [
    {
      title: 'Configuration',
      items: [
        ...(IS_PLATFORM
          ? [
              {
                name: 'Sign-in method',
                key: 'Sign-in method',
                url: `/project/${ref}/auth/providers`,
                items: [],
              },
              {
                name: 'Session',
                key: 'session',
                url: `/project/${ref}/auth/session`,
                items: [],
              },
              {
                name: 'MFA',
                key: 'mfa',
                url: `/project/${ref}/auth/mfa`,
                items: [],
              },
              {
                name: 'Third party',
                key: 'third-party',
                url: `/project/${ref}/auth/third-party`,
                items: [],
              },
              {
                name: 'Social login',
                key: 'providers',
                url: `/project/${ref}/auth/social-login`,
                items: [],
              },
              {
                name: 'Rate Limits',
                key: 'rate-limits',
                url: `/project/${ref}/auth/rate-limits`,
                items: [],
              },
              {
                name: 'Email Templates',
                key: 'templates',
                url: `/project/${ref}/auth/templates`,
                items: [],
              },
              {
                name: 'URL Configuration',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              {
                name: 'Hooks',
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: 'BETA',
              },
              {
                name: 'Configuration',
                key: 'configuration',
                url: `/project/${ref}/auth/configuration`,
                items: [],
                label: 'BETA',
              },
            ]
          : []),
      ],
    },
  ]
}
