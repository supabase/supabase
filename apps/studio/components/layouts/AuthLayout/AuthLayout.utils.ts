import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateAuthMenu = (ref: string): ProductMenuGroup[] => {
  return [
    {
      title: 'Manage',
      items: [{ name: 'Users', key: 'users', url: `/project/${ref}/auth/users`, items: [] }],
    },
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
              {
                name: 'Sign In / Up',
                key: 'sign-in-up',
                pages: ['providers', 'third-party'],
                url: `/project/${ref}/auth/providers`,
                items: [],
              },
              {
                name: 'Sessions',
                key: 'sessions',
                url: `/project/${ref}/auth/sessions`,
                items: [],
              },
              {
                name: 'Rate Limits',
                key: 'rate-limits',
                url: `/project/${ref}/auth/rate-limits`,
                items: [],
              },
              {
                name: 'Emails',
                key: 'emails',
                pages: ['templates', 'smtp'],
                url: `/project/${ref}/auth/templates`,
                items: [],
              },
              {
                name: 'Multi-Factor',
                key: 'mfa',
                url: `/project/${ref}/auth/mfa`,
                items: [],
              },
              {
                name: 'URL Configuration',
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              {
                name: 'Attack Protection',
                key: 'protection',
                url: `/project/${ref}/auth/protection`,
                items: [],
              },
              {
                name: 'Auth Hooks',
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: 'BETA',
              },
              {
                name: 'Advanced',
                key: 'advanced',
                url: `/project/${ref}/auth/advanced`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
