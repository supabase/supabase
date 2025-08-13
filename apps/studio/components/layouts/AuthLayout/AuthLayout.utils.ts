import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

export const generateAuthMenu = (slug: string, ref: string): ProductMenuGroup[] => {
  return [
    {
      title: 'Manage',
      items: [{ name: 'Users', key: 'users', url: `/org/${slug}/project/${ref}/auth/users`, items: [] }],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Policies',
          key: 'policies',
          url: `/org/${slug}/project/${ref}/auth/policies`,
          items: [],
        },
        ...(!IS_PLATFORM // FIXME: Move to organization level
          ? [
              {
                name: 'Sign In / Providers',
                key: 'sign-in-up',
                pages: ['providers', 'third-party'],
                url: `/org/${slug}/project/${ref}/auth/providers`,
                items: [],
              },
              {
                name: 'Sessions',
                key: 'sessions',
                url: `/org/${slug}/project/${ref}/auth/sessions`,
                items: [],
              },
              {
                name: 'Rate Limits',
                key: 'rate-limits',
                url: `/org/${slug}/project/${ref}/auth/rate-limits`,
                items: [],
              },
              {
                name: 'Emails',
                key: 'emails',
                pages: ['templates', 'smtp'],
                url: `/org/${slug}/project/${ref}/auth/templates`,
                items: [],
              },
              {
                name: 'Multi-Factor',
                key: 'mfa',
                url: `/org/${slug}/project/${ref}/auth/mfa`,
                items: [],
              },
              {
                name: 'URL Configuration',
                key: 'url-configuration',
                url: `/org/${slug}/project/${ref}/auth/url-configuration`,
                items: [],
              },
              {
                name: 'Attack Protection',
                key: 'protection',
                url: `/org/${slug}/project/${ref}/auth/protection`,
                items: [],
              },
              {
                name: 'Auth Hooks',
                key: 'hooks',
                url: `/org/${slug}/project/${ref}/auth/hooks`,
                items: [],
                label: 'BETA',
              },
              {
                name: 'Advanced',
                key: 'advanced',
                url: `/org/${slug}/project/${ref}/auth/advanced`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
